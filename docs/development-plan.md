# Development plan

## PR 1 — Foundation, engine contract, and safe unclassified SIG manifest

- initialize downstream repository;
- pin upstream engine source/version;
- add Docker Compose deployment scaffold;
- create source-derived SIG terminology, roles, queues, workflow, deadlines, routing, document types, and communication templates;
- expose an anonymous-only unclassified public intake rather than co-mingling identity and content;
- validate the manifest against the pinned upstream parser in CI;
- document capability gaps discovered by the first real downstream implementation.

## PR 2 — Protected submitter architecture

Before collecting confidential identities, implement the reusable upstream capability needed for:

- content/identity compartment separation;
- separate authorization;
- immutable identity-access audit;
- two-person identity reveal approval;
- pseudonymous external credential/status/message access.

Once released upstream, update this repository's engine pin and enable confidential/pseudonymous and open-with-consent identity modes.

## PR 3 — Public supporting evidence

Add the reusable public attachment pipeline:

- upload staging;
- MIME/size policy;
- hashing and provenance;
- malware scanning/quarantine;
- promotion into the case file only after clean status;
- public UX for technical drawings/supporting documents.

## PR 4 — Referral ledger and agency accountability

If implemented upstream as a reusable primitive, add first-class agency referral work items so one SIG case can:

- refer to multiple agencies in parallel;
- track each agency acknowledgment;
- maintain separate 30/90-day clocks;
- record extensions and response history;
- escalate per-agency non-compliance.

## PR 5 — Operational SIG experience

- staff queue tuning;
- triage/panel/referral dashboard views;
- submitter-safe communication templates;
- IP-interest handling workflow;
- closure and feedback UX;
- aggregate performance metrics mapped to SIG KPIs.

## PR 6 — Security/deployment acceptance

- production secret handling;
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
