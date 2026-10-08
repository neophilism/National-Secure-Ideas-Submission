# Production provisioning status

This record captures the concrete provisioning work attempted from the connected
automation environment after the security/deployment acceptance milestone.

It is **not** the final acceptance evidence file and does not convert pending
controls to pass.

## Current outcome

Production go-live is **not yet approved**.

The application and production contracts are ready for provisioning, but
external infrastructure/account prerequisites still block a complete production
environment and several acceptance tests cannot truthfully run before that
environment exists.

## Completed or implemented in source

### Production security contract

Merged SIG PR 8 provides:

- hardened production Compose contract;
- immutable-image preflight;
- secret/key-custody preflight;
- MFA/IdP deployment gate;
- network/egress deployment gate;
- scanner deployment gate;
- backup/restore evidence gates;
- SIEM evidence gate;
- penetration-test and manual accessibility gates;
- hold-by-default retention;
- production deployment/recovery runbook.

### Durable document storage and automatic scanning

Engine PR 28 introduces the reusable runtime capabilities required for a
cloud-hosted SIG deployment:

- S3-compatible private object storage;
- HTTPS malware-scanner adapter;
- automatic `document.scan` jobs for every persisted document version;
- SHA-256 re-verification before scanning;
- fail-closed retries/final failed status;
- clean-only evidence promotion.

SIG PR 9 consumes those production interfaces and requires them in production
preflight.

## Provisioning attempts and blockers

### Render production database

**Attempted:** creation of a dedicated non-expiring PostgreSQL 16 production
database in the connected Render workspace.

**Result:** blocked by Render billing. The API returned HTTP 402 indicating that
payment information is required.

No existing SIG production database was found in the workspace. The only
existing PostgreSQL instance discovered was an unrelated expiring free sandbox
database and was not reused.

**Status:** blocked — Render billing/payment method required before a paid
production database can be provisioned there.

### Render production application/worker

No SIG production web service or worker currently exists.

The connected Render automation surface can create web services but does not
expose creation of the background-worker/persistent-disk topology required by
the existing production runbook. Engine rc.8 removes the shared-disk requirement
by supporting S3-compatible storage, but a continuously running background
worker is still required for deadline/review/scanner jobs.

**Status:** blocked for fully automated provisioning through the currently
available Render interface. A provider/workflow capable of provisioning the
worker must be used.

### Alternative Neon backend

The connected Neon integration exposes Postgres, Functions and S3-compatible
object-storage operations for a known project, but the current connection is
unscoped and does not expose project discovery/creation in this automation
environment. The Neon CLI is also unavailable here.

**Status:** blocked until a Neon project ID is connected/provided or project
creation becomes available through the connector.

### MFA / staff access gateway

No approved MFA-capable access-gateway or IdP integration is currently connected
to this automation environment.

Plugin discovery did not surface a configurable Cloudflare Access, Okta or
Auth0 integration.

**Status:** pending external provider selection/configuration and route-policy
evidence. Do not mark `staff_mfa_idp` pass.

### Malware scanner

Before engine PR 28, the engine exposed only a scanner interface and deliberately
left uploads quarantined.

PR 28 adds a production HTTPS scanner adapter and automatic scan worker, but no
scanner vendor/service is connected to this environment.

**Status:** software adapter implemented; external scanner provider and
clean/infected/failure test evidence still pending.

### Egress controls

The repository defines the required default-deny policy and blocks claiming
Docker network segmentation as sufficient.

No connected cloud/network firewall control plane is available here for the
future production host.

**Status:** pending actual host/network provisioning and egress test evidence.

### Backups

No production database/document store exists yet, so a real encrypted
backup-and-restore drill cannot be performed.

**Status:** pending production infrastructure. Do not mark database or document
backup controls pass based on configuration alone.

### SIEM

Datadog is available as a ChatGPT integration but is not currently connected.
The SIG engine exposes tenant-scoped immutable audit events suitable for
least-privilege collection.

**Status:** pending SIEM connection, collector configuration and alert tests.

### Security scan / penetration test

The connected Codex Security service can see the SIG GitHub repository, but the
available security environments do not include SIG and scan execution is
currently unavailable in the connected security account.

A repository scan is not a substitute for the required authorized penetration
test against a production-equivalent running deployment.

**Status:** static security scan blocked in current connected environment;
authorized penetration test remains pending.

### Accessibility review

Upstream automated Axe coverage is present and is exercised in engine CI.

The required manual end-to-end accessibility review must target the actual
production/prod-equivalent SIG deployment, which does not yet exist.

**Status:** automated coverage available; manual production review pending.

## Acceptance evidence posture

Do not copy the statuses above into the final evidence file as `pass` unless
the corresponding control has actually been exercised against the target
deployment and a durable evidence reference exists.

The canonical production preflight remains:

```bash
node scripts/verify-production-deployment.mjs \
  --env /secure/runtime/sig.env \
  --evidence /secure/runtime/acceptance-evidence.json
```

It is expected to fail until all go-live gates are genuinely satisfied.
