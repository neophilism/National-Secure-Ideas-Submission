# Source-to-software requirements map

Source basis: **National Secure Ideas Submission Act of 2025 / Secure Innovation Gateway (“American Innovation Shield”) legislative package**.

This file records what the downstream application currently implements, what is represented in the application manifest, and what must wait for a reusable engine capability or accredited deployment infrastructure. It is intentionally conservative: a source requirement is not marked implemented unless the software actually provides it.

## Implemented in the current manifest

| Source requirement | Source location | Current implementation |
| --- | --- | --- |
| Secure Innovation Gateway as centralized submission portal and clearinghouse | Act §§4–5 | Application identity, public intake, SIG case workflow |
| “Submitter” limited to U.S. citizens, lawful permanent residents, or entities substantially owned by them | Act §3 | Required non-identifying submitter-eligibility attestation |
| Submission includes ideas, proposals, technical designs, vulnerability/wrongdoing reports, and related information | Act §3 | `submission_kind`, title, summary, detailed description, relevance fields |
| Initial screening/triage; frivolous or non-germane material may be closed | Act §5(2); SOP §4.3 | `received -> triage`, non-germane closure state |
| Expert panels evaluate merit, urgency, and relevance | Act §5(3); SOP §4.4 | Expert-review state, domain panel teams/queues |
| Domain categories include defense technology, cybersecurity, intelligence/foreign threats, homeland/law enforcement, science/technology, policy/governance | SOP §4.3.6 | Primary domain field, secondary-domain tags, domain-specific review queues |
| Urgent threats may bypass ordinary layers for rapid referral | SOP §4.3.5 | Urgent queue and urgent referral branch |
| Triage target of 3 working days | SOP §4.3.10 | 3-business-day case-created deadline |
| Panel initial review target of 10 business days | SOP §4.4.6 | 10-business-day expert review deadlines |
| Panel outcomes include positive referral, awareness/verification referral, hold for more information, merge/duplicate, and no further action | SOP §4.4.7 | Matching workflow transitions/states |
| Referral to appropriate participating agency with expert findings | Act §5(4); SOP §4.4.8 | Referral preparation followed by first-class recipient-specific agency referrals; one case may carry multiple participating-agency referrals in parallel |
| Agency preliminary response normally within 30 days | Act/MOU timely-response provisions; FAQ/SOP | Each routine agency referral starts its own 30-calendar-day preliminary-response clock when sent |
| Urgent agency preliminary response may be required within 72 hours | Act/MOU timely-response provisions | Each urgent agency referral starts its own 72-hour preliminary-response clock when sent |
| Final disposition/status expected within 90 days, subject to agreed extension | Act/MOU timely-response provisions | Each routine or urgent referral receives its own 90-calendar-day final-status clock; explicit reasoned extensions are recorded against only the affected deadline |
| Lifecycle tracking and auditability | Act §5(5); Charter §5.03 | Engine case history, immutable audit events, deadlines, oversight queue |
| Preserve inventor patent/trade-secret interests and facilitate licensing/compensation under existing law | Act §6; FAQ | IP-interest intake fields and IP record document type; no payment formula invented |
| Staff oversight of overdue agency responses | Act §9; SOP | Recipient-specific referral deadlines escalate the parent case through the compliance queue while preserving which agency referral is overdue |
| Fully anonymous, confidential/pseudonymous, and open-with-consent identity choices | SOP §4.2.3 | Required `identity_mode` with the three source-derived choices |
| Identity package separated from ordinary submission content | Act §7(c); SOP §§4.2.1, 4.2.5 | Identifying/contact fields stored in encrypted `submitter_identity` protected compartment; ordinary reviewers receive no protected-data permission |
| Need-to-know identity access and two-person reveal | SOP §§4.2.8–4.2.9; §4.5 | Dedicated Intake & Privacy requester role, separate Privacy Officer approver role, engine-enforced no-self-approval, expiring one-time reveal, immutable access audit |
| Anonymous submissions still reviewed on content alone | SOP §4.2.3 | Identity fields are conditionally unavailable in fully anonymous mode while the content submission remains valid |
| Confidential submitters may state an agency-disclosure preference | SOP §4.2.3 | Protected `confidential_disclosure_preference` field |
| Open submitters may consent to agency disclosure and/or direct evaluator contact | SOP §4.2.3 | Protected `open_identity_scope` field |
| Every submission has a unique tracking identifier | Charter §5.03; SOP §§4.2, 4.3 | Engine confirmation/tracking code plus case number after case creation |
| Non-account submitters can use a tracking code plus secret/PIN-style credential to check status | SOP §4.2.6 | Engine participant credential: confirmation/tracking code + separately generated 256-bit access secret |
| Submitters can receive bounded status such as under review / referred / closed | Act §5(6); SOP §4.2.6 | Participant portal exposes bounded case status and workflow-state label only |
| Fully anonymous submitters cannot receive direct follow-up/feedback | SOP §4.2.3 | `identity_mode = fully_anonymous` resolves to status-only participant access; no messages are returned or accepted |
| Confidential/open submitters can securely communicate with SIG | Act §5(6); SOP §4.2.6 | Conditional secure portal messaging when `identity_mode != fully_anonymous` |
| SIG may securely request additional information | Act §5(6); SOP §§4.2.6, 4.4 | Participant-visible portal correspondence and participant replies |
| Technical drawings and unclassified supporting files may accompany a submission | Act §3; SOP intake/security provisions | Optional `supporting_materials` public file field bound to the supporting-material document type; SHA-256 provenance; immutable submission links; mandatory quarantine; only a recorded clean scan can promote content into case evidence |
| Sensitive content should not be exposed through ordinary email | SOP §4.2.6 | SIG communication templates direct participants to the protected portal; portal messages remain inside the participant channel |

## Deliberately not implemented yet

### 1. Production malware-scanner / sandbox integration — deployment boundary

PR 4 implements public file transport, SHA-256 provenance, immutable submission linking, quarantine, malware-status recording, and a hard clean-scan gate before case-evidence promotion.

The generic engine intentionally does **not** pretend to be a malware-scanner product and never marks a file clean merely because upload succeeded.

**Required before operational public-file acceptance:** connect an approved malware scanner or authorized external scan/sandbox process and validate that its results are recorded through the document scan-status path. Pending, failed, or infected files remain unavailable.

Participant-message attachments remain disabled; PR 4 covers public intake supporting files only.

### 2. Classified information — deployment/accreditation boundary

The source permits classified submissions only through approved secure channels and describes cleared personnel, secure facilities, classification handling, HSM-backed encryption, and other high-assurance controls.

The upstream engine explicitly does not constitute an accredited classified system.

**Current behavior:** the public form requires an attestation that classified information will not be submitted and directs classified material to an approved external secure channel once one exists.

**Required before operational classified intake:** an appropriately authorized/accredited environment and integration design. This must not be simulated by ordinary application configuration.

### 3. Parallel multi-panel review — partially represented

PR 5 resolves the **multi-agency** portion of this gap. A case can now carry
multiple participating-agency referrals simultaneously, each with an independent
recipient, acknowledgment, response history, 30/72-hour/90-day clocks,
extensions, completion status, and overdue escalation.

The remaining limitation concerns **parallel expert-panel work before referral**.
The form records a primary domain plus secondary domains, but the engine still
has one active case queue/assignment rather than first-class concurrent panel
work items.

**Current behavior:** one principal expert-review queue handles the case while
secondary domains remain recorded as submission data. After referral
preparation, multiple agency referrals are first-class and independent.

**Possible future reusable improvement:** generic parallel review/work-item
records if SIG operations determine that simultaneous independent panel
assignments are necessary rather than coordinated review through one primary
panel.

### 4. Identity verification integrations — procedural/integration work

The SOP permits confidential identity verification using appropriate public/professional/government sources on a need-to-know basis.

**Current behavior:** protected identity data can be revealed only through the dual-control process, but the application does not automatically call identity-verification services or classified/government databases.

**Future work:** define approved verification adapters, authorization, purpose logging, and deployment-specific provider integrations without exposing protected identity to ordinary reviewers.

### 5. Long-lived participant accounts and credential recovery — optional future enhancement

The SOP describes both account-based access and a non-account tracking-code/PIN path. PR 3 implements the latter. It does not create a long-lived username/password account system, email recovery flow, or 2FA enrollment.

**Current behavior:** the participant must save the tracking/confirmation code and access secret issued at submission. The secret is shown once and cannot be recovered from the database.

**Future work if operationally required:** add generic participant credential rotation/recovery with protections against identity disclosure or account takeover. This is not required to provide the source-described non-account status path.

## Pseudonymous case identifiers

The source permits participating-agency communications to use a pseudonym **or case number** in place of real identity. The current engine generates stable case numbers and the SIG referral/communication model does not require real-name fields. A separate human-readable random handle generator remains optional.

## No invented appeal process

The source package emphasizes oversight, audit, complaints about mishandling, and escalation of agency non-compliance, but the source review does not establish a general submitter appeal from every SIG panel decision. Therefore this manifest does **not** invent an appeal policy.
