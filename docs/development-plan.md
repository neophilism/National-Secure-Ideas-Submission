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

If implemented upstream as a reusable primitive, add first-class agency referral work items so one SIG case can:

- refer to multiple agencies in parallel;
- track each agency acknowledgment;
- maintain separate 30/90-day clocks;
- record extensions and response history;
- escalate per-agency non-compliance.

## PR 6 — Operational SIG experience

- staff queue tuning;
- triage/panel/referral dashboard views;
- participant-safe communication operations;
- IP-interest handling workflow;
- closure and feedback UX;
- aggregate performance metrics mapped to SIG KPIs;
- approved identity-verification integration points if required for deployment.

## PR 7 — Security/deployment acceptance

- production secret handling and key custody;
- IdP/MFA integration plan;
- network and egress controls;
- storage/backup policy;
- security logging/SIEM integration plan;
- penetration-test checklist;
- accessibility acceptance;
- records-retention configuration;
- deployment runbook.

## Separate classified-channel program

Classified submission support is not a normal application PR. It requires an authorized infrastructure/security program and an approved interface to this unclassified case-management layer.
