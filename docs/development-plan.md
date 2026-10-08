# Development plan

## PR 1 — Foundation, engine contract, and safe unclassified SIG manifest

- initialize downstream repository;
- pin upstream engine source/version;
- add Docker Compose deployment scaffold;
- create source-derived SIG terminology, roles, queues, workflow, deadlines, routing, document types, and communication templates;
- expose an anonymous-only unclassified public intake rather than co-mingling identity and content;
- validate the manifest against the pinned upstream parser in CI;
- document capability gaps discovered by the first real downstream implementation.

## PR 2 — Protected submitter identity

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 22.

- update the engine pin to `1.0.0-rc.2`;
- enable source-defined fully anonymous, confidential/pseudonymous, and open-with-consent modes;
- keep identifying/contact values in the encrypted `submitter_identity` compartment;
- separate identity-request and identity-approval roles;
- enforce engine-level dual control, one-time reveal, and immutable identity-access audit;
- add the source-defined submitter eligibility attestation;
- preserve the unclassified-only public intake boundary.

## PR 3 — Protected participant status and messaging

Reusable upstream prerequisites: Secure Intake & Case Workflow Engine PRs 23 and 24.

- update the engine pin to `1.0.0-rc.4`;
- enable protected participant access for every SIG submission;
- issue a high-entropy access secret separately from the tracking/confirmation code;
- expose bounded status without ordinary case data;
- make fully anonymous submissions true status-only sessions;
- enable secure two-way portal messaging only for confidential/open identity modes;
- support participant-safe additional-information requests and replies;
- update SIG communication templates to use the protected portal rather than imply ordinary email transmission;
- configure separate participant-session cookie and TTL;
- preserve the no-attachment boundary until the public evidence pipeline exists.

The source permits a non-account tracking-code plus PIN/passphrase path, so PR 3 uses the engine's per-submission credential model. Long-lived participant accounts, 2FA, and recovery are optional future enhancements rather than prerequisites for the status/messaging milestone.

## PR 4 — Public supporting evidence

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 25.

- update the engine pin to `1.0.0-rc.5`;
- enable the source-contemplated unclassified technical drawing/supporting-file field;
- bind public uploads to the SIG supporting-material document type;
- enforce MIME, file-count, per-file-size, and aggregate-size policy;
- retain SHA-256 provenance and immutable document versions;
- quarantine every public upload until a clean malware scan is recorded;
- promote only clean content into the case evidence set;
- preserve the classified-information prohibition;
- leave participant-message attachments disabled because the generic participant portal does not yet expose a safe attachment contract.

## PR 5 — Referral ledger and agency accountability

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 26.

- update the engine pin to `1.0.0-rc.6`;
- replace the single-agency case states with one Agency Coordination state;
- create routine and urgent referral policies rather than case-wide agency clocks;
- permit multiple participating-agency referrals on one SIG case in parallel;
- track acknowledgment and response history independently for every recipient;
- maintain independent 30/90-day routine clocks and 72-hour/90-day urgent clocks;
- record reasoned extensions against only the affected referral deadline;
- escalate overdue recipient clocks through `oversight_compliance`;
- require at least one referral before entering Agency Coordination;
- prevent case resolution until every referral is completed or cancelled.

## PR 6 — Operational SIG experience

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 27.

- update the engine pin to `1.0.0-rc.7`;
- tune referral/agency queues and add a dedicated IP/proprietary-interest coordination queue;
- ship shared intake, urgent, panel, IP, referral, agency, compliance and closure work views;
- expose source-derived workload and deadline-compliance metrics through the generic Operations page;
- make staff portal correspondence honor the participant's immutable messaging eligibility;
- add an explicit IP/proprietary-interest coordination step before referral when needed;
- add protected-portal closure feedback copy;
- preserve identity verification as an approved-provider/deployment integration boundary rather than inventing a provider or exposing protected identity.

## PR 7 — PR 6 post-merge rc.7 pin cleanup

PR 6 merged immediately before upstream engine PR 27, so its reviewed rc.7 source
pin still referenced the PR head commit. The merged engine commit has the exact
same Git tree, so no application behavior changes are required.

- repin `engine.lock.json` to the canonical merged rc.7 engine commit;
- update downstream CI to validate the merged engine commit rather than the
  closed PR head;
- update policy guardrails and README provenance;
- rerun the complete downstream validation against the merged engine commit.

## PR 8 — Security/deployment acceptance

- add a separate hardened production Compose definition with loopback-only web exposure, internal database networking, dropped application capabilities, bounded logs, and immutable-image requirements;
- add a production env contract and preflight that rejects moving image tags, placeholder secrets, insecure cookie/origin settings, bootstrap credentials, weak env-file permissions, and missing go-live evidence;
- define protected-data key custody and webhook-key separation requirements;
- require an approved MFA-capable staff access gateway because the engine does not claim native IdP/MFA;
- define external default-deny egress, reverse-proxy/WAF and trusted-forwarding-header requirements;
- make malware scanning a hard operational acceptance gate;
- define coordinated database/document backup and restore testing with RPO/RTO evidence;
- define least-privilege audit-event SIEM ingestion and alert tests;
- add an authorized penetration-test checklist;
- add manual WCAG 2.1 AA-compatible production accessibility acceptance;
- add a machine-readable hold-by-default records-retention configuration with no destructive automation;
- add incident-response evidence requirements and classified-boundary acknowledgment;
- add a production deployment/upgrade/restore runbook;
- validate the production acceptance template and production Compose definition in CI.

## PR 9 — Production runtime enablement

Deployment execution after PR 8 exposed two reusable engine gaps that prevented
a cloud production deployment from satisfying its own acceptance contract.

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 28.

- update the engine pin to `1.0.0-rc.8`;
- require S3-compatible private object storage in production rather than a
  shared container filesystem;
- require an HTTPS malware-scanner endpoint/provider in production;
- rely on automatic `document.scan` background jobs for every new document
  version;
- keep scan/storage failure fail-closed and quarantined;
- update production Compose and preflight for the durable storage/scanner
  contract;
- record concrete provisioning attempts and external blockers without marking
  unverified acceptance gates as passed.

## PR 10 — PR 9 post-merge rc.8 pin cleanup

PR 9 merged immediately before upstream engine PR 28, so its reviewed rc.8
source pin still referenced the PR head commit. The merged engine commit has
the exact same Git tree, so no application behavior changes are required.

- repin `engine.lock.json` to the canonical merged rc.8 engine commit;
- update downstream CI to validate the merged engine commit;
- update policy guardrails and README provenance;
- rerun complete downstream validation against the merged rc.8 commit.

## PR 11 — Render production Blueprint

- generate Render infrastructure-as-code only from an immutable rc.8 engine
  image digest;
- provision the SIG web service, continuous background worker, and managed
  PostgreSQL together;
- run database migrations as the web service pre-deploy command;
- keep PostgreSQL closed to public IP access;
- prompt for object-store, scanner, protected-data and production-origin
  secrets rather than committing them;
- share the web service's secret/config values with the worker through Render
  service references;
- validate the generated Blueprint structure in downstream CI;
- keep completed external acceptance evidence separate from infrastructure
  creation.

## PR 12 — Readiness-aware production routing

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 29.

- update the engine pin to `1.0.0-rc.9`;
- use the engine's explicit database-backed `/api/ready` contract for Render
  web-service health checks;
- return HTTP 503 when PostgreSQL is unavailable so the platform can stop
  routing traffic to an unready instance;
- retain `/api/health` as a process-only liveness signal;
- validate the Render Blueprint contains the readiness health-check path;
- preserve worker monitoring through process/job/log/SIEM controls rather than
  inventing an HTTP worker health endpoint.

## PR 13 — Release-evidence-driven production promotion

Reusable upstream prerequisite: Secure Intake & Case Workflow Engine PR 30.

- consume the engine release workflow's machine-readable
  `release-evidence.json` artifact;
- verify evidence schema, rc.9 version, exact source commit, release tag,
  expected GHCR repository, SHA-256 digest and immutable reference against
  `engine.lock.json`;
- generate the Render Blueprint from the verified immutable release reference;
- retain direct digest input only as a controlled manual/recovery path;
- exercise the complete release-evidence-to-Blueprint promotion path in CI.

## PR 14 — Live production smoke evidence

- add a read-only production/prod-equivalent smoke harness;
- verify rc.9 liveness and database-backed readiness against the deployed
  origin;
- verify the SIG public intake is present with its unclassified-information
  boundary and submit control;
- verify the participant login surface is reachable without attempting
  authentication;
- verify production CSP, HSTS, framing, MIME-sniffing, referrer and permissions
  headers;
- emit machine-readable JSON evidence on success;
- add a manual GitHub Actions workflow that uploads the evidence artifact;
- keep stateful workflow, scanner, MFA, backup, penetration and accessibility
  tests as separate acceptance activities.

## PR 15 — Land production deployment stack on main

SIG PRs 11 through 14 were merged into their already-merged parent feature
branches during a rapid stacked merge sequence, so GitHub recorded them as
merged without propagating their cumulative changes to `main`.

This consolidation PR lands the already-reviewed cumulative result directly on
current SIG `main`:

- generated Render web + worker + PostgreSQL Blueprint;
- rc.9 database-backed readiness routing;
- release-evidence-driven immutable container promotion;
- live read-only production smoke evidence workflow;
- associated deployment/runbook/architecture updates.

It also pins validation to the reviewed main-targeted engine PR 31 head that
lands the orphaned engine PR 30 release-evidence work.

## Separate classified-channel program

Classified submission support is not a normal application PR. It requires an authorized infrastructure/security program and an approved interface to this unclassified case-management layer.
