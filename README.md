# National Secure Ideas Submission

Implementation repository for the **Secure Innovation Gateway (SIG)** / **American Innovation Shield** described in the *National Secure Ideas Submission Act of 2025* legislative package.

This is a downstream application of the generic [Secure Intake & Case Workflow Engine](https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine). Application-specific policy lives here; reusable case-management behavior stays upstream.

## Current milestone

**PR 8 — security and deployment acceptance**

PR 8 defines the production go-live contract for the unclassified SIG
application. It does not claim that source control can issue an ATO, accredit a
classified system, certify a network, or prove an external control is operating.

The repository now includes:

- a separate production Compose definition with loopback-only web exposure,
  internal-only database networking, dropped application capabilities and
  bounded container logs;
- a production environment contract requiring HTTPS, `__Host-` session
  cookies, immutable image digests and protected-data key custody;
- a machine-enforced production preflight;
- a go-live control catalog and evidence template covering staff MFA/IdP,
  reverse proxy/WAF, external egress firewalling, malware scanning, backup and
  restore, SIEM, penetration testing, manual accessibility, records retention,
  incident response and the unclassified-only boundary;
- a hold-by-default records-retention configuration with no automatic
  destructive disposition;
- a production deployment/upgrade/recovery runbook.

The current engine does not claim native staff MFA/IdP. Production staff routes
therefore require an approved MFA-capable access gateway until reusable native
federation is implemented upstream.

Passing the repository preflight confirms the declared configuration and
evidence gates. It is not an ATO or classified-system accreditation.

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

- version: `1.0.0-rc.7`
- source commit: `ca4cdd236de76674830c45a64178999efffe4010`
- target image: `ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.7`
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

7. Run engine migrations. Upgrading to PR 5 applies the referral-ledger migration as part of the normal migration chain:

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

## Development sequence

See [docs/development-plan.md](docs/development-plan.md).

The project follows the intended feedback loop: a real downstream requirement is classified as application policy or reusable infrastructure; reusable primitives are implemented neutrally upstream, released, and then consumed here.
