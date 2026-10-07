# Architecture

## Repository role

This repository is a **downstream application** of the Secure Intake & Case Workflow Engine.

The upstream engine remains domain-neutral. This repository owns:

- SIG branding and terminology;
- application roles;
- intake forms and privacy choices;
- participant-access policy;
- workflow states/transitions;
- deadlines;
- teams/queues and routing;
- document types;
- communication templates;
- deployment configuration;
- SIG-specific acceptance tests and any specialized code that proves impossible to express through generic engine contracts.

## Engine pin

PR 4 is developed against the exact upstream source commit recorded in `engine.lock.json` and targets the matching `1.0.0-rc.5` image.

The deployment should move to an immutable image digest once the release image is published.

## Protected submitter identity

The SIG form keeps privacy policy downstream while consuming the reusable upstream protected-data primitive.

The public form exposes three source-derived identity choices:

- fully anonymous;
- confidential/pseudonymous;
- open with consent.

`identity_mode` is ordinary workflow data. Identifying/contact fields are assigned to the encrypted `submitter_identity` compartment and therefore do not enter ordinary submission-answer JSON.

Ordinary triage officers, expert reviewers, case officers, agency liaisons, supervisors, and application auditors receive no protected-data permission through this manifest.

The two SIG privacy roles remain asymmetric:

- `sig_intake_privacy_officer` can see compartment metadata and request a reveal;
- `sig_privacy_officer` can see compartment metadata and approve/reject a reveal but cannot request one.

## External participant portal

The participant portal is enabled on the SIG intake form for every submission.

The authentication credential consists of:

- the ordinary tracking/confirmation code; and
- a separate high-entropy participant access secret shown once after submission.

The access secret is not an identity field and is not a staff credential. The engine stores only its hash.

### Status access

Every participant credential can resolve a bounded status surface:

- tracking/confirmation code;
- submission receipt time;
- case number after case creation;
- configured workflow-state label;
- status timestamp.

This deliberately does not include submission answers, protected identity, internal notes, assignments, deadlines, audit history, staff identities, or documents.

### Messaging policy

SIG applies conditional messaging using the ordinary `identity_mode` field:

```text
fully_anonymous          -> status-only
confidential_pseudonymous -> status + secure messages
open_with_consent         -> status + secure messages
```

The engine evaluates this against the immutable form-version definition and ordinary submission answer snapshot. Protected identity never has to be decrypted to authorize participant messaging.

When status-only applies:

- no participant-visible messages are returned;
- the participant cannot start a message;
- the participant cannot reply to a thread.

When messaging applies:

- only participant/public portal correspondence belonging to the participant's own case is visible;
- participant replies are recorded as inbound portal correspondence;
- internal messages and staff-only case data remain inaccessible.

This lets SIG request additional information securely without putting sensitive submission content in ordinary email.

## Public supporting evidence

The SIG intake exposes one optional `supporting_materials` file field. It is
bound to the manifest-declared `submission_supporting_material` document type;
the browser cannot select an arbitrary document category.

Accepted public files are:

- limited to the configured PDF, plain-text, PNG, JPEG, and DOCX MIME policy;
- limited to 10 files, with a 50 MB per-file ceiling and a 50 MB combined
  attachment ceiling in the supplied deployment configuration;
- assigned engine-generated storage keys;
- hashed with SHA-256 before persistence;
- stored as immutable submission-linked document versions;
- initialized as `quarantined / pending`.

A browser upload is not itself a scan result. The engine does not mark a file
clean by assumption. An approved scanner or authorized external scan process
must record `clean` before the version becomes available and is promoted into
case evidence. Pending, failed, and infected content remains outside the trusted
case evidence surface.

The public intake stores document-version references in the file-field answer;
binary file content is not placed in ordinary answer JSON.

This milestone does not enable participant-message attachments. It also does
not change the unclassified-only boundary: the supporting-material help text
and the existing submission attestation both prohibit classified information.

## Security posture

This repository still defines an **unclassified web application** only.

It must not be represented as satisfying the package's classified-system requirements, FISMA authorization, High-Value Asset designation, FIPS 140-3 validation, HSM architecture, clearance/need-to-know processes, or Authority to Operate. Those are deployment/accreditation and cryptographic-module requirements beyond a manifest.

Protected structured identity and participant credentials materially improve application privacy, but they do not convert this deployment into an accredited classified-information channel.

## Participant session boundary

Participant sessions are separate from internal staff authentication.

Deployment config uses a distinct participant cookie name and bounded TTL. The engine uses HttpOnly, SameSite=Strict cookies, secure cookies in production, server-side session revocation, and login throttling.

The permanent participant access secret is not placed in URLs. Losing the one-time secret currently requires operational handling; no password/email recovery system is claimed.

## Upstream feedback rule

If implementation exposes a missing capability that is reusable across case-workflow applications, the capability belongs upstream under neutral terminology. After an upstream release, this repository updates its engine pin.

Remaining reusable gaps are tracked in `docs/source-requirements.md`.
