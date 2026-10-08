# Production deployment runbook

## Preconditions

Do not deploy until:

- engine PR 28 / rc.8 is available as a reviewed production image;
- the exact engine image digest has been recorded;
- the PostgreSQL image digest has been reviewed;
- `deployment/acceptance-evidence.json` is complete;
- the production preflight passes;
- backup/restore evidence exists;
- scanner, MFA gateway, reverse proxy/WAF, egress firewall and SIEM are ready.

The production runtime is unclassified-only.

## 1. Prepare immutable inputs

Record:

- SIG repository commit;
- `engine.lock.json` commit/version;
- engine image digest;
- PostgreSQL image digest;
- manifest SHA-256;
- change ticket / deployment identifier.

Do not deploy a moving `latest`, branch, or tag-only image reference.

## 2. Render secrets

Materialize the production env from the approved secrets manager.

Required sensitive values include:

- PostgreSQL password;
- protected-data encryption key;
- object-store access credentials;
- scanner bearer token when required by the approved scanner;
- webhook encryption key only if webhooks are explicitly enabled.

Use a URL-safe PostgreSQL password because it is embedded in the internal
`DATABASE_URL`.

Set the rendered file to mode 0600.

Bootstrap credentials are not production runtime variables.

## 3. Fill acceptance evidence

Copy:

`deployment/acceptance-evidence.example.json`

to the controlled deployment workspace as:

`deployment/acceptance-evidence.json`

For every gate, set `status` to `pass` and record a durable evidence
reference such as a change record, test report, security assessment, backup
restore report, screenshot bundle or monitoring query.

Do not put secrets or protected identity in evidence references.

## 4. Run production preflight

```bash
node scripts/verify-production-deployment.mjs \
  --env /secure/runtime/sig.env \
  --evidence /secure/runtime/acceptance-evidence.json
```

Do not continue on failure.

## 5. Validate Compose

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  config
```

Confirm:

- no PostgreSQL host port;
- engine binds only to 127.0.0.1;
- backend network is internal;
- no bootstrap password appears;
- image references are immutable digests;
- production document storage is `s3`;
- both engine and worker receive the same object-store configuration;
- the worker receives the scanner endpoint/provider configuration.

## 6. Pre-upgrade backup

Before migrations, take a coordinated encrypted backup of:

- PostgreSQL;
- the S3-compatible document store/bucket;
- protected-data encryption-key recovery material through its approved key
  custody process.

Record backup identifiers.

For upgrades, keep the previous application/engine image digests available for
rollback analysis. Database rollback must follow migration-specific recovery
procedures; do not assume application image rollback reverses a database
migration.

## 7. Start PostgreSQL only

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  up -d postgres
```

Verify database health from the deployment host. PostgreSQL must not be
reachable from an external network.

## 8. Run migrations

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  run --rm engine npm run db:migrate
```

Capture migration output in the change record without secrets.

## 9. Bootstrap only for a new organization

For first deployment only, perform bootstrap as a controlled one-off operation.
Do **not** add bootstrap secrets to `compose.production.yaml`.

Use an approved temporary mechanism to inject the bootstrap email/password into
the one-off container, then remove the password from the secret-rendering
workflow immediately.

Verify named administrative access before continuing.

## 10. Apply/validate the manifest

Validate first:

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  run --rm engine npm run app:manifest -- \
    --file /application/manifest.json \
    --validate-only
```

Then apply using an authorized named actor:

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  run --rm engine npm run app:manifest -- \
    --file /application/manifest.json \
    --organization secure-innovation-gateway \
    --actor-email "<AUTHORIZED_ADMIN_EMAIL>"
```

## 11. Start application and worker

```bash
docker compose \
  --env-file /secure/runtime/sig.env \
  -f deployment/compose.production.yaml \
  up -d engine worker
```

Confirm the engine remains loopback-only and is reached externally only through
the trusted TLS reverse proxy.

## 12. Smoke tests

Using test data only:

- public intake loads over HTTPS;
- classified-information warning/attestation is visible;
- anonymous status-only submission cannot message;
- confidential/open test submission can use protected portal messaging;
- staff route requires MFA gateway and engine login;
- protected identity requires requester + different approver;
- clean test file remains quarantined until scanner marks it clean;
- infected test file never becomes evidence;
- referral clocks can be created independently;
- Operations page loads SIG shared views/metrics;
- audit events are visible to authorized staff/collector;
- no secret appears in browser URL, application logs or SIEM sample.

## 13. Monitoring validation

Trigger safe test signals and confirm SIEM receipt:

- failed staff login;
- protected-data reveal workflow;
- test audit event retrieval;
- scanner test result;
- application/worker restart.

Confirm alert routing and on-call ownership.

## 14. Backup restore drill

At initial go-live and on the approved recurring cadence:

1. restore database and documents to an isolated environment;
2. use the correct protected-data key;
3. run migrations if required;
4. validate the SIG manifest;
5. verify representative case/referral/audit records;
6. verify representative document SHA-256 integrity;
7. record RPO, RTO and restore outcome.

## 15. Rollback / incident stop

If a release has an application-only defect before incompatible writes or
migrations, stop the new containers and follow the approved rollback plan.

If data integrity, protected identity, scanner trust or tenant isolation may be
affected:

- stop intake/worker processing as appropriate;
- preserve evidence;
- notify the incident commander/security authority;
- do not perform ad-hoc destructive rollback;
- restore only through the approved recovery procedure.

## 16. Post-deployment

Record:

- deployed SIG commit;
- engine/database image digests;
- migration result;
- manifest revision;
- acceptance evidence revision;
- smoke-test results;
- monitoring validation;
- backup identifiers;
- operator/reviewer names and timestamps.

Remove temporary secret-rendered files when permitted by the deployment
platform and verify no bootstrap credential remains active.
