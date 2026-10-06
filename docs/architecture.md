# Architecture

## Repository role

This repository is a **downstream application** of the Secure Intake & Case Workflow Engine.

The upstream engine remains domain-neutral. This repository owns:

- SIG branding and terminology;
- application roles;
- intake forms and privacy choices;
- workflow states/transitions;
- deadlines;
- teams/queues and routing;
- document types;
- communication templates;
- deployment configuration;
- SIG-specific acceptance tests and any specialized code that proves impossible to express through generic engine contracts.

## Engine pin

PR 2 is developed against the exact upstream source commit recorded in `engine.lock.json` and targets the matching `1.0.0-rc.2` image.

The deployment should move to an immutable image digest once the release image is published.

## Protected submitter identity

The SIG form keeps privacy policy downstream while consuming the reusable upstream protected-data primitive.

The public form exposes three source-derived identity choices:

- fully anonymous;
- confidential/pseudonymous;
- open with consent.

`identity_mode` is ordinary workflow data. Identifying/contact fields are different: they are assigned to the encrypted `submitter_identity` compartment and therefore do not enter the ordinary submission-answer JSON.

Ordinary triage officers, expert reviewers, case officers, agency liaisons, supervisors, and application auditors receive no protected-data permission through this manifest.

The two SIG privacy roles are intentionally asymmetric:

- `sig_intake_privacy_officer` can see compartment metadata and request a reveal;
- `sig_privacy_officer` can see compartment metadata and approve/reject a reveal but cannot request one.

The upstream engine separately prevents requester self-approval, gives approvals a short lifetime, makes reveal one-time, and records request/decision/reveal audit events without copying protected plaintext into the audit stream.

This role split is stricter than relying on the engine prohibition alone and makes the downstream operational intent explicit.

## Security posture

This repository still defines an **unclassified web application** only.

It must not be represented as satisfying the package's classified-system requirements, FISMA authorization, High-Value Asset designation, FIPS 140-3 validation, HSM architecture, clearance/need-to-know processes, or Authority to Operate. Those are deployment/accreditation and cryptographic-module requirements beyond a manifest.

The protected-data engine feature provides application-level separation and authenticated encryption. It is not, by itself, evidence that a deployment meets the source package's federal cryptographic or classified-system requirements.

## External participant boundary

PR 2 securely stores optional identity/contact information but does not yet expose the source-described protected public status/messaging portal.

A confirmation code is not treated as proof that secure external participant messaging exists. That reusable capability is the next upstream feedback item.

## Upstream feedback rule

If implementation exposes a missing capability that is reusable across case-workflow applications, the capability belongs upstream under neutral terminology. After an upstream release, this repository updates its engine pin.

Remaining reusable gaps are tracked in `docs/source-requirements.md`.
