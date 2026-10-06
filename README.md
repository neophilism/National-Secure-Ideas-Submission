# National Secure Ideas Submission

Implementation repository for the **Secure Innovation Gateway (SIG)** / **American Innovation Shield** described in the *National Secure Ideas Submission Act of 2025* legislative package.

This is a downstream application of the generic [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Application-specific policy lives here; reusable case-management behavior stays upstream.

## Current milestone

**PR 1 — foundation, engine contract, and safe unclassified SIG manifest**

The foundation models:

- anonymous unclassified public intake;
- intake/triage;
- urgent handling;
- domain expert-panel queues;
- request-for-more-information state;
- referral preparation;
- agency referral;
- 30-day preliminary response tracking;
- 72-hour urgent preliminary response tracking;
- 90-day final disposition/status tracking;
- overdue/compliance escalation;
- IP/proprietary-interest flags;
- audit-oriented closure states.

The workflow derives from the supplied National Secure Ideas Submission legislative package rather than a generic reinterpretation.

## Security boundary

**Do not submit classified information through this application.**

The source package contemplates classified submissions only through approved secure channels with cleared personnel, need-to-know controls, secure facilities, cryptographic key management, and other high-assurance controls. The generic engine is not an accredited classified system.

The foundation public form therefore requires an unclassified-information attestation and does not attempt to simulate classified handling.

## Privacy boundary

The source package requires submitter identity to be separated from submission content and protected by pseudonymous handling and controlled unmasking.

The generic engine does not yet provide field-level identity/content compartments. Therefore PR 1 deliberately collects **no identifying/contact information**. It is anonymous-only until the reusable privacy capability exists upstream.

See [docs/source-requirements.md](docs/source-requirements.md).

## Engine contract

Pinned engine:

- version: `1.0.0-rc.1`
- source commit: `84362ad69ffd45a421d026c1c6a5ec0621a6b203`
- target image: `ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.1`
- manifest schema: `1`

See `engine.lock.json`.

## Local deployment

The engine release image must be published before the default Compose deployment can pull it.

1. Copy the environment template:

   ```bash
   cp deployment/.env.example deployment/.env
   ```

2. Set strong development-only values in `deployment/.env`.

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

7. Start the web application and worker:

   ```bash
   docker compose --env-file deployment/.env -f deployment/compose.yaml up -d engine worker
   ```

## Development sequence

See [docs/development-plan.md](docs/development-plan.md).

The first real downstream implementation has already identified reusable gaps in the generic engine. Those gaps should be fixed upstream under neutral contracts, released, and then consumed here rather than patched into the master engine with SIG-specific logic.
