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
