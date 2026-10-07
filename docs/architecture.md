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

The application pins the exact merged rc.7 upstream source commit recorded in
`engine.lock.json`.

Development may use the reviewed rc.7 tag. Production acceptance requires the
published engine image to be pinned by immutable SHA-256 digest, along with an
immutable PostgreSQL image digest.

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

## Parallel agency referral ledger

Agency referral is no longer modeled as one case-wide recipient lifecycle.

The parent case enters `agency_coordination` after staff have created at least
one recipient-specific referral. Each referral stores:

- the participating-agency name and optional stable recipient key;
- the routine or urgent policy snapshot that applied when the referral was
  created;
- sent and acknowledgment timestamps;
- preliminary, status, and final response events;
- its own deadline rows and deadline history;
- any reasoned extension recorded against its own clock.

The manifest defines two application policies:

```text
sig_routine_agency_referral
  preliminary response: 30 calendar days from send
  final disposition/status: 90 calendar days from send

sig_urgent_agency_referral
  preliminary response: 72 hours from send
  final disposition/status: 90 calendar days from send
```

Every one of those clocks belongs to the individual referral. Two agencies
referred on the same day receive separate deadline records even though the
policy keys are identical.

A preliminary response satisfies only that referral's preliminary-response
clock. A final response, completion, or cancellation satisfies the applicable
remaining clocks for that referral. An agreed extension moves only the selected
deadline and records the reason, prior due date, and new due date.

The old case-wide `referred_to_agency`, `agency_preliminary_response`, and
`agency_follow_up` states and their case-wide 30/72-hour/90-day deadline
policies are removed.

SIG does not hard-code a fixed federal-agency directory into the portable
manifest. Recipient identity is operational referral data so authorized staff
can route to the appropriate participating agency without requiring a software
release when participation changes.

The case may resolve from Agency Coordination only when at least one referral
exists and every referral is completed or cancelled. Overdue referral clocks
continue to escalate the parent case through the `oversight_compliance` queue,
while the referral record identifies which recipient missed the obligation.

## Operational SIG workspace

PR 6 uses the engine's application-defined operations profile rather than
creating a SIG-only dashboard codebase.

The manifest supplies shared work views for:

- intake and triage;
- urgent review;
- expert-panel review across all configured domains;
- pending submitter information;
- IP/proprietary-interest coordination;
- referral preparation;
- agency coordination;
- overdue/compliance escalation;
- recent closures.

Those views are immutable application configuration until a new manifest
revision is applied. They coexist with personal saved views.

### Objective performance measures

SIG configures case-count and deadline-compliance metrics only. The metrics are
grounded in current case state or actual deadline due/completion timestamps.

The configured timeliness measures correspond to the existing source-derived
operational targets: triage, initial panel review, routine/urgent preliminary
agency responses, and final agency status. Cancelled and actively paused
deadlines are not treated as failures.

This dashboard is operational reporting, not an assertion that the software
alone satisfies statutory oversight or annual reporting duties.

## IP / proprietary-interest coordination

The intake already records whether the submission asserts patent/invention,
trade-secret, other proprietary, or no known IP interests.

For a referral candidate that requires explicit IP handling, staff may move from
Expert Panel Review to `ip_coordination`. The transition requires the recorded
IP-interest field and accompanying IP notes, adds the `ip_interest` tag, and
routes the case to the dedicated IP coordination queue.

Completion returns the case to Referral Preparation. The software does not
adjudicate title, patentability, trade-secret validity, licensing terms, credit,
or compensation.

## Participant-safe closure and feedback

Participant-facing closure/feedback correspondence remains a portal operation,
not ordinary email.

The engine evaluates the source intake's immutable participant-portal condition
before staff can create or publish portal correspondence. A fully anonymous
status-only case therefore shows that messaging is unavailable and cannot be
sent a portal feedback request.

## Identity-verification integration boundary

PR 6 does not select or call an identity-verification provider.

If operations later require verification, an adapter must be approved for the
deployment and may receive identity material only after the existing protected
identity reveal process establishes a documented need-to-know and independent
approval. Provider purpose, authorization, and access logging belong to the
deployment/integration design and PR 7 acceptance work.

## Security / deployment acceptance boundary

PR 8 separates repository-verifiable controls from deployment controls that
require infrastructure and evidence.

The production path uses
`deployment/compose.production.yaml`, not the local-development Compose file.

Repository-enforced production requirements include:

- HTTPS-only public origin;
- distinct `__Host-` staff and participant session cookies;
- immutable engine and PostgreSQL image digests;
- no bootstrap credentials in the running production service;
- required protected-data encryption key;
- distinct webhook key if webhooks are approved;
- 50 MB SIG aggregate public-upload ceiling;
- loopback-only host binding for the engine;
- internal-only PostgreSQL network;
- dropped Linux capabilities for engine/worker;
- bounded container log rotation;
- machine-readable hold-by-default retention with no destructive automation.

External go-live controls are defined in
`deployment/security-acceptance.json` and require evidence before production:

- MFA-capable staff access gateway / IdP;
- TLS reverse proxy, WAF and trusted forwarding-header behavior;
- host/cloud default-deny egress;
- production malware scanner/sandbox;
- database and document backup/restore testing;
- SIEM ingestion and alert validation;
- authorized penetration testing;
- manual production accessibility review;
- records-officer approval;
- incident-response exercise;
- explicit acknowledgment of the unclassified-only boundary.

The engine does not currently claim native staff SSO/MFA. Staff routes therefore
require an approved access gateway in production. Public intake and participant
access remain separate from staff identity federation.

The real deployment environment and completed evidence record are secrets/
controlled deployment artifacts and are excluded from source control.

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
