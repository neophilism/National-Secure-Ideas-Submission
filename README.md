# National Secure Ideas Submission

Implementation repository for the **Secure Innovation Gateway (SIG)** / **American Innovation Shield** described in the *National Secure Ideas Submission Act of 2025* legislative package.

This is a downstream application of the generic [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Application-specific policy lives here; reusable case-management behavior stays upstream.

## Current milestone

**PR 22 — automatic production promotion request**

The public engine `v1.0.0-rc.9` release is published from the exact source
commit locked by SIG.

SIG now includes a reviewed `production-promotion-request.json`. When that
request reaches `main`, the existing production-promotion workflow starts
automatically, validates the request against `engine.lock.json`, downloads the
public release evidence, generates the immutable Render Blueprint, and uploads
the verified promotion bundle.

Manual workflow dispatch remains available only as a controlled retry path.

## Security boundary

**Do not submit classified information through this application.**

The source package contemplates classified submissions only through approved secure channels with cleared personnel, need-to-know controls, secure facilities, validated cryptographic modules/key management, and other high-assurance controls. The generic engine is not an accredited classified system.

The public form therefore requires an unclassified-information attestation and does not attempt to simulate classified handling.

## Privacy and participant-access boundary

Identifying/contact fields remain in the encrypted `submitter_identity` protected compartment. Ordinary SIG content-processing roles do not receive protected-data permissions.

Identity access requires the separate requester/approver workflow introduced in PR 2.

Participant access is independent of identity reveal:

- a participant credential is not a staff account;
- the tracking/confirmation code alone is not sufficient authentication;
- the access secret is not placed in a URL and is not stored in plaintext;
- participant sessions use a separate HttpOnly, SameSite=Strict cookie;
- fully anonymous users can check bounded case status if they saved the credential, but they cannot read or send messages;
- confidential/open submitters can use secure portal messaging because their `identity_mode` permits follow-up.

This preserves the source's distinction between anonymous status tracking and direct communications.

## Engine contract

Pinned engine:

- version: `1.0.0-rc.9`
- source commit: `2fb452f23e5e5464db03a3ec95d36c4bc2db4fa4`
- target image: `ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.9`
- manifest schema: `1`

See `engine.lock.json`.

## Local deployment

The engine release image must be published before the default Compose deployment can pull it.

1. Copy the environment template:

   ```bash
   cp deployment/.env.example deployment/.env
   ```

2. Replace the development example values in `deployment/.env`. In particular, generate and protect a stable 32-byte `PROTECTED_DATA_ENCRYPTION_KEY` encoded as 64 hexadecimal characters. Losing or changing that key makes existing protected identity ciphertext unreadable.

3. Keep the participant-session cookie name distinct from the staff-session cookie. The default participant TTL is 8 hours and can be changed with `PARTICIPANT_SESSION_TTL_HOURS`.

4. Keep `DOCUMENT_MAX_BYTES` and `PUBLIC_UPLOAD_TOTAL_MAX_BYTES` at or below the deployment limits you intend to support. The supplied development configuration permits up to 50 MB per supporting file and 50 MB combined attachments per submission, inside the engine's 64 MB multipart transport ceiling.

5. Connect an approved malware scanner or authorized external scan process before treating public uploads as operational evidence. The engine deliberately leaves uploads quarantined until a clean result is recorded.

6. Start PostgreSQL:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d postgres
   ```

7. Run engine migrations. The normal migration chain applies all engine migrations required by the pinned rc.7 release:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run db:migrate
   ```

8. Bootstrap the SIG organization administrator:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run auth:bootstrap
   ```

9. Apply the manifest:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine \
     npm run app:manifest -- \
     --file /application/manifest.json \
     --organization secure-innovation-gateway \
     --actor-email "${BOOTSTRAP_ADMIN_EMAIL}"
   ```

10. Assign at least one person to `sig_intake_privacy_officer` and a different person to `sig_privacy_officer` before operationally accepting confidential identities.

11. Start the web application and worker:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d engine worker
   ```

The public participant login surface is under the engine's `/participant` path and uses the SIG organization slug plus the saved tracking/confirmation code and participant access secret.

## Production deployment

Do not use the local-development Compose file as the production security
baseline.

Production operators should use:

- [Security and deployment acceptance](docs/security-deployment-acceptance.md)
- [Production deployment runbook](docs/deployment-runbook.md)
- `deployment/compose.production.yaml`
- `deployment/production.env.example`
- `deployment/security-acceptance.json`
- `deployment/records-retention.json`
- [Current provisioning status](docs/production-provisioning-status.md)
- [Render production Blueprint](docs/render-production-blueprint.md)
- [Live production smoke evidence](docs/live-production-smoke.md)
- [Automated production promotion bundle](docs/production-promotion-bundle.md)
- [Automatic production promotion request](docs/automatic-production-promotion-request.md)
- [Acceptance review package](docs/acceptance-review-package.md)
- [Final acceptance evidence review](docs/final-acceptance-evidence.md)

A real production environment must pass:

```bash
node scripts/verify-production-deployment.mjs \
  --env /secure/runtime/sig.env \
  --evidence /secure/runtime/acceptance-evidence.json
```

The evidence file and rendered production secrets must remain outside source
control.

## Development sequence

See [docs/development-plan.md](docs/development-plan.md).

The project follows the intended feedback loop: a real downstream requirement is classified as application policy or reusable infrastructure; reusable primitives are implemented neutrally upstream, released, and then consumed here.
