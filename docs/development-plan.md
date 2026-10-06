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

PR 2 deliberately does **not** claim that the protected external participant portal exists.

## PR 3 — Protected participant status and messaging

Implement the remaining reusable upstream participant capability, then consume it here:

- high-entropy external tracking credential;
- protected public status lookup;
- secure two-way submitter messaging;
- additional-information requests without sensitive email content;
- credential rotation/revocation/recovery policy;
- account-based option with strong authentication where appropriate;
- fully anonymous mode remains usable without contact.

## PR 4 — Public supporting evidence

Add the reusable public attachment pipeline:

- upload staging;
- MIME/size policy;
- hashing and provenance;
- malware scanning/quarantine;
- promotion into the case file only after clean status;
- public UX for technical drawings/supporting documents.

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
- submitter-safe communication templates;
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
