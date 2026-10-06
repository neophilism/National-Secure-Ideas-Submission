# National Secure Ideas Submission

Implementation repository for the **Secure Innovation Gateway (SIG)** / **American Innovation Shield** described in the *National Secure Ideas Submission Act of 2025* legislative package.

This is a downstream application of the generic [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Application-specific policy lives here; reusable case-management behavior stays upstream.

## Current milestone

**PR 2 — protected submitter identity**

PR 2 moves the application from the temporary anonymous-only foundation to the source-defined privacy model:

- fully anonymous intake;
- confidential/pseudonymous intake;
- open identity with explicit consent scope;
- source-defined U.S. citizen / lawful permanent resident / substantially U.S.-owned entity eligibility attestation;
- encrypted identity/contact compartment separate from ordinary submission content;
- dedicated Intake & Privacy identity-access requester role;
- separate Privacy Officer approval role;
- dual-control, expiring, one-time identity reveal through the upstream engine;
- immutable identity-access audit without protected plaintext in the audit stream.

The existing case workflow continues to provide intake/triage, urgent handling, expert-panel review, referral preparation, agency-response deadlines, overdue escalation, IP/proprietary-interest flags, and closure states.

## Security boundary

**Do not submit classified information through this application.**

The source package contemplates classified submissions only through approved secure channels with cleared personnel, need-to-know controls, secure facilities, validated cryptographic modules/key management, and other high-assurance controls. The generic engine is not an accredited classified system.

The public form therefore requires an unclassified-information attestation and does not attempt to simulate classified handling.

## Privacy boundary

Identifying/contact fields are now assigned to the engine's encrypted `submitter_identity` protected compartment. Ordinary SIG content-processing roles do not receive protected-data permissions.

Identity access is not a normal case view. The downstream role model requires one authorized Intake & Privacy officer to request access and a separate Privacy Officer to approve it; the engine additionally prevents self-approval and makes the reveal expiring and one-time.

The source also calls for protected public status lookup and secure two-way submitter messaging. That **is not implemented yet**. PR 2 therefore still tells submitters to save their confirmation information and does not claim that a confirmation code is a secure messaging portal.

See [docs/source-requirements.md](docs/source-requirements.md).

## Engine contract

Pinned engine:

- version: `1.0.0-rc.2`
- source commit: `b8db6155657d7f7576fde72f1dba0563c190c853`
- target image: `ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.2`
- manifest schema: `1`

See `engine.lock.json`.

## Local deployment

The engine release image must be published before the default Compose deployment can pull it.

1. Copy the environment template:

   ```bash
   cp deployment/.env.example deployment/.env
   ```

2. Replace the development example values in `deployment/.env`. In particular, generate and protect a stable 32-byte `PROTECTED_DATA_ENCRYPTION_KEY` encoded as 64 hexadecimal characters. Losing or changing that key makes existing protected identity ciphertext unreadable.

3. Start PostgreSQL:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d postgres
   ```

4. Run engine migrations:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run db:migrate
   ```

5. Bootstrap the SIG organization administrator:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine npm run auth:bootstrap
   ```

6. Apply the manifest:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml run --rm engine \
     npm run app:manifest -- \
     --file /application/manifest.json \
     --organization secure-innovation-gateway \
     --actor-email "${BOOTSTRAP_ADMIN_EMAIL}"
   ```

7. Assign at least one person to `sig_intake_privacy_officer` and a different person to `sig_privacy_officer` before operationally accepting confidential identities.

8. Start the web application and worker:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d engine worker
   ```

## Development sequence

See [docs/development-plan.md](docs/development-plan.md).

The project follows the intended feedback loop: a real downstream requirement is first classified as application policy or reusable infrastructure; reusable primitives are implemented neutrally upstream, released, and then consumed here.
