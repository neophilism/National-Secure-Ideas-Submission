# National Secure Ideas Submission

Implementation repository for the **Secure Innovation Gateway (SIG)** / **American Innovation Shield** described in the *National Secure Ideas Submission Act of 2025* legislative package.

This is a downstream application of the generic [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Application-specific policy lives here; reusable case-management behavior stays upstream.

## Current milestone

**PR 3 — protected participant status and conditional secure messaging**

PR 3 upgrades the application to the engine's protected external-participant portal and applies the source-derived privacy split:

- every submitted matter receives a tracking/confirmation code plus a separate high-entropy participant access secret;
- the access secret is shown once and only its hash is stored by the engine;
- participants authenticate to a separate participant portal rather than the staff application;
- every submission can pull bounded status with the saved credentials;
- fully anonymous submissions are **status-only**;
- confidential/pseudonymous and open-with-consent submissions can use secure two-way portal messaging;
- participant messaging is controlled by the ordinary `identity_mode` field, never by decrypting protected identity data;
- participant-visible messages are limited to the submitter's own case and participant/public portal correspondence;
- internal notes, protected identity, submission answers, assignments, deadlines, audit history, staff identities, and documents are not exposed;
- additional-information requests and status correspondence can use the protected portal rather than sensitive ordinary email.

The existing workflow continues to provide intake/triage, urgent handling, expert-panel review, referral preparation, agency-response deadlines, overdue escalation, IP/proprietary-interest flags, and closure states.

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

- version: `1.0.0-rc.4`
- source commit: `b7b1f74ed210d68eb61015efc6850167d03721da`
- target image: `ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.4`
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

4. Start PostgreSQL:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d postgres
   ```

5. Run engine migrations. Upgrading from the PR 2 engine applies the participant-portal migration as part of the normal chain:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run db:migrate
   ```

6. Bootstrap the SIG organization administrator:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run auth:bootstrap
   ```

7. Apply the manifest:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine \
     npm run app:manifest -- \
     --file /application/manifest.json \
     --organization secure-innovation-gateway \
     --actor-email "${BOOTSTRAP_ADMIN_EMAIL}"
   ```

8. Assign at least one person to `sig_intake_privacy_officer` and a different person to `sig_privacy_officer` before operationally accepting confidential identities.

9. Start the web application and worker:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d engine worker
   ```

The public participant login surface is under the engine's `/participant` path and uses the SIG organization slug plus the saved tracking/confirmation code and participant access secret.

## Development sequence

See [docs/development-plan.md](docs/development-plan.md).

The project follows the intended feedback loop: a real downstream requirement is classified as application policy or reusable infrastructure; reusable primitives are implemented neutrally upstream, released, and then consumed here.
