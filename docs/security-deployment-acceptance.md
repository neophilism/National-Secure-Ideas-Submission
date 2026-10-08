# Security and deployment acceptance

## Purpose

This document defines the go-live boundary for the unclassified Secure
Innovation Gateway (SIG) application.

The repository can verify application configuration and production deployment
contracts. It cannot by itself certify infrastructure, issue an Authority to
Operate, accredit a classified system, validate a cryptographic module, or prove
that an external control is operating effectively.

Production approval therefore requires both:

1. repository-controlled checks; and
2. deployment evidence for external controls.

The machine-readable control catalog is
`deployment/security-acceptance.json`. Operators copy
`deployment/acceptance-evidence.example.json` to an untracked evidence file
and attach evidence references for the actual deployment.

## Hard launch boundary

SIG remains **unclassified-only**.

Do not use this deployment to receive, store, process, or transmit classified
information. Classified submissions require a separately authorized program and
approved secure channel. Passing this checklist does not change that boundary.

## Repository-controlled controls

### Immutable software images

Production uses `deployment/compose.production.yaml`.

Both `ENGINE_IMAGE` and `POSTGRES_IMAGE` must use immutable
`@sha256:<digest>` references. Release tags are useful for review but are not
the production trust anchor.

The production preflight rejects moving tags and the all-zero template digest.

### Production origin and cookies

`APP_BASE_URL` must be a bare HTTPS origin.

Staff and participant cookies must:

- be distinct;
- use the `__Host-` prefix;
- retain the engine's HttpOnly, SameSite=Strict and production Secure behavior.

Staff session TTL is capped at 12 hours by the SIG preflight. Participant
session TTL is capped at 8 hours.

### Bootstrap credentials

Bootstrap credentials are setup-only values.

`deployment/compose.production.yaml` does not pass bootstrap credentials to
the running engine. The production preflight rejects
`BOOTSTRAP_ADMIN_PASSWORD` and `BOOTSTRAP_ADMIN_EMAIL` in the production
runtime env.

After bootstrap:

- remove the bootstrap password from the secrets-rendering workflow;
- verify the initial administrator account;
- create named staff accounts;
- assign least-privilege SIG roles;
- revoke/disable any temporary setup access.

### Protected-data key

`PROTECTED_DATA_ENCRYPTION_KEY` is required because SIG uses protected
submitter identity compartments.

The key must be:

- generated from an approved cryptographic random source;
- 32 bytes represented as 64 hexadecimal characters;
- stored in an approved secrets manager/HSM-backed secret service as required
  by the deployment authority;
- stable for the lifetime of encrypted records unless a separately designed
  migration/rotation procedure is executed;
- backed up under controlled key-recovery procedures;
- excluded from source control, ticket text, shell history, logs and SIEM
  payloads.

Loss of this key makes existing protected identity ciphertext unreadable.

### Webhook key separation

SIG webhooks are disabled by default.

If webhooks are approved and enabled, `WEBHOOK_ENCRYPTION_KEY` must be a
separate 32-byte key. The preflight rejects reuse of the protected-data key.

### Production environment file

The real env file is a short-lived rendering target, not the source of truth.

Recommended flow:

1. retrieve secrets from the approved manager;
2. write a temporary env file with mode 0600;
3. run the production preflight;
4. launch/update the containers;
5. securely remove the rendered file when the deployment platform no longer
   requires it.

The preflight rejects group/world-readable env files.

## Staff IdP and MFA plan

The current engine does **not** provide native SAML/OIDC staff SSO or MFA.

Production staff access therefore requires an approved MFA-capable access
gateway/reverse proxy in front of staff routes. The gateway must establish an
authenticated staff access boundary before the engine's local staff login.

At minimum:

- `/admin/**`, `/login`, `/select-organization` and other internal staff
  surfaces require the approved MFA gateway;
- public intake paths remain available only where explicitly intended;
- participant access under `/participant/**` remains governed by the
  participant credential model rather than staff IdP;
- bearer-authenticated integration API access is controlled separately by
  API credentials, network policy and API rate limits.

This is defense in depth, not native identity federation. If direct OIDC/SAML
identity mapping becomes a requirement, implement it as a reusable upstream
engine capability rather than SIG-only code.

Acceptance evidence must identify the gateway/IdP, MFA policy, protected route
set, test account results and break-glass procedure.

## Edge, proxy and network controls

The production Compose file binds the engine only to loopback:

`127.0.0.1:<APP_PORT>:3000`

A trusted reverse proxy is therefore required to expose the service.

The proxy/WAF must:

- terminate TLS with approved certificates/protocols;
- overwrite, rather than append attacker-supplied, client-address headers;
- enforce request-size and volumetric protections;
- preserve the exact public `APP_BASE_URL` origin;
- forward only required headers;
- block direct access to the loopback-bound application port from remote hosts.

`AUTH_TRUST_PROXY_HEADERS=true` is allowed only after that overwrite behavior
is verified.

PostgreSQL is attached only to the internal backend network and has no published
host port.

Application and worker egress must be enforced outside Docker with a
host/cloud/network default-deny policy. Allow only approved destinations such as:

- DNS resolvers;
- required HTTPS endpoints for approved integrations/webhooks;
- approved monitoring/telemetry endpoints.

Explicitly block cloud metadata endpoints, loopback, link-local, RFC1918/private
networks and other internal address space unless an approved integration
requires a documented exception.

Docker network segmentation does not replace the external egress firewall.

## Malware scanning

Public supporting files enter `quarantined / pending`.

Engine rc.9 automatically queues every new document version for its configured
HTTPS scanner. A production scanner/sandbox must:

- inspect actual content, not trust browser MIME metadata;
- run before a file can be marked clean;
- record clean/infected/failed scan results through the engine's controlled
  document scan-status path;
- keep failed/pending/infected content outside trusted case evidence;
- log scanner identity/version and result provenance;
- have test cases for clean, infected and scanner-failure behavior.

Go-live is blocked until this integration is demonstrated.

## Backup and recovery acceptance

Back up **both** the PostgreSQL database and document store. A database-only
backup is incomplete because document bytes are stored separately.

Before production:

- define approved RPO and RTO;
- encrypt backups at rest and in transit;
- separate backup credentials from application credentials;
- restrict backup deletion;
- test restoration into an isolated environment;
- verify database migrations and manifest application after restore;
- verify representative document SHA-256 integrity after restore;
- verify protected identity can still be decrypted with recovered key custody;
- record restore duration and resulting RPO/RTO evidence.

SIG production now targets a private S3-compatible object store through engine
rc.9 rather than a container filesystem. The backup design must include the
bucket/object history or an independent encrypted copy and must prove that
representative object bytes restore with their recorded SHA-256 values.

A backup is not accepted merely because a scheduled job reports success.

## Security logging and SIEM

The engine provides immutable organization-scoped audit events and container
logs. Production must forward both to the approved monitoring stack.

Audit events are available to a least-privilege integration with
`audit:view` through:

`GET /api/v1/audit-events`

Use a dedicated API credential and network-restrict it to the approved collector.

SIEM acceptance should demonstrate alerting for at least:

- repeated authentication failures / access-gateway anomalies;
- protected identity reveal requests, approvals and use;
- administrative role/membership changes;
- document malware-scan failures or infected results;
- API credential / webhook administration;
- deadline/compliance escalations;
- unexpected container restarts or worker failures;
- audit ingestion gaps.

Do not export participant access secrets, raw encryption keys, database
passwords, protected identity plaintext or full sensitive document content to
the SIEM.

## Penetration-test acceptance checklist

Testing must be authorized and performed against a production-equivalent
environment.

Cover at least:

- authentication/session fixation/logout/revocation;
- CSRF/origin enforcement;
- organization/tenant isolation;
- role/permission escalation;
- protected-data dual-control bypass attempts;
- participant credential brute force and status-only/messaging separation;
- IDOR across submissions/cases/documents/referrals;
- file upload MIME/content mismatch and quarantine bypass;
- stored/reflected XSS and content injection;
- SSRF/webhook DNS rebinding controls plus network egress enforcement;
- API credential scope/rate limiting;
- deadline/referral mutation authorization;
- security headers/CSP/clickjacking;
- reverse-proxy header spoofing;
- backup/admin interfaces exposed unintentionally.

Go-live requires no unresolved critical or high finding unless the designated
security authority records an explicit exception outside this repository.

## Accessibility acceptance

Upstream automated Axe tests are necessary but not sufficient.

Manually test the production thin application for WCAG 2.1 AA-compatible
behavior, including:

- keyboard-only public intake;
- error summary focus and field association;
- participant login/status/messaging;
- staff case navigation and tables;
- referral and operations dashboards;
- zoom/reflow at 200% and narrow widths;
- visible focus;
- screen-reader labels/headings/landmarks;
- non-color status communication;
- representative uploaded/downloaded document workflows.

Record browser/assistive-technology combinations and remediation evidence.

## Records retention

`deployment/records-retention.json` uses hold-by-default mode.

No automatic destructive disposition is authorized. Legal hold overrides any
future disposition.

Before enabling deletion in a future release:

1. obtain an approved records schedule;
2. map every engine record/document category to the schedule;
3. define legal-hold behavior;
4. implement reusable deletion/disposition support upstream if needed;
5. add audit evidence and recovery safeguards;
6. review the change as a separate PR.

For initial production, the records officer may explicitly approve the
hold-by-default posture as the launch disposition.

## Incident response

Before go-live, exercise procedures for:

- staff credential compromise;
- participant credential disclosure;
- protected-data encryption-key compromise/loss;
- database credential compromise;
- malicious or infected file discovery after prior clean marking;
- suspected tenant-isolation defect;
- audit/SIEM ingestion outage;
- backup corruption or failed restore;
- webhook/API credential compromise.

Preserve immutable audit evidence and relevant infrastructure logs before
containment actions that could destroy evidence.

## Production acceptance command

After rendering the real production env and filling the evidence file:

```bash
node scripts/verify-production-deployment.mjs \
  --env /secure/runtime/sig.env \
  --evidence /secure/runtime/acceptance-evidence.json
```

A passing command means the repository-level preflight and declared evidence
gates are complete. It is **not** an ATO or classified-system accreditation.
