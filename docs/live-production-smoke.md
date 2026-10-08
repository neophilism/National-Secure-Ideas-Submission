# Live production smoke evidence

## Purpose

This harness verifies a deployed SIG origin without submitting data, creating a
case, opening protected identity, or mutating production state.

It is suitable for:

- initial production bring-up;
- production-equivalent acceptance;
- post-deploy smoke verification;
- evidence collection after infrastructure changes.

The harness is intentionally read-only.

## Checks

Given a bare HTTPS origin, the script verifies:

### Engine liveness

`GET /api/health`

Requires:

- HTTP 200;
- `status: ok`;
- `check: liveness`;
- expected engine service name;
- engine version equal to `engine.lock.json`.

### Engine readiness

`GET /api/ready`

Requires:

- HTTP 200;
- `status: ready`;
- `check: readiness`;
- database status `ok`;
- engine version equal to `engine.lock.json`.

This proves that the deployed web process can reach PostgreSQL at the moment of
the smoke check.

### SIG public intake boundary

`GET /intake/secure-innovation-gateway/secure-idea-submission`

Requires the production page to expose the configured SIG identity and
unclassified-only boundary, including:

- American Innovation Shield branding;
- Secure Innovation Gateway Submission;
- unclassified-only instruction;
- explicit prohibition on including classified information;
- Submit to SIG control.

This also verifies that the SIG manifest has been applied to the target
organization.

### Participant login surface

`GET /participant/secure-innovation-gateway`

Requires:

- Secure Innovation Gateway participant portal;
- tracking-code field;
- separate access-secret field;
- Open participant portal control.

The harness does not attempt authentication.

### Production response headers

The public intake response must include:

- Content-Security-Policy with self-default and no framing;
- Referrer-Policy: no-referrer;
- X-Content-Type-Options: nosniff;
- X-Frame-Options: DENY;
- Permissions-Policy disabling camera, microphone and geolocation;
- Strict-Transport-Security with at least a one-year max age.

## Manual execution

```bash
node scripts/verify-live-deployment.mjs \
  --base-url https://sig.example.gov \
  --out live-deployment-smoke.json
```

The base URL must be a bare HTTPS origin.

On success, the output JSON contains:

- checked origin;
- timestamp;
- locked engine version/source;
- each passed smoke check;
- observed security-header values.

A failed check exits nonzero and does not create a passing evidence report.

## GitHub Actions

The repository also includes the manual workflow:

**Production smoke evidence**

Supply the production or production-equivalent base URL. The workflow uploads
the JSON evidence report as a 90-day artifact and records the artifact name in
the job summary.

## Acceptance use

A successful smoke report can support the deployment evidence package for:

- application availability;
- database readiness;
- public unclassified boundary;
- participant-login availability;
- application-layer security headers.

It does not replace evidence for:

- MFA/IdP enforcement;
- malware scanner efficacy;
- network egress controls;
- backup/restore;
- SIEM alerting;
- penetration testing;
- manual accessibility review;
- records/security approvals.
