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
| Referral to appropriate participating agency with expert findings | Act §5(4); SOP §4.4.8 | Referral-preparation and referred states; referral-package document type |
| Agency preliminary response normally within 30 days | Act/MOU timely-response provisions; FAQ/SOP | 30-calendar-day deadline |
| Urgent agency preliminary response may be required within 72 hours | Act/MOU timely-response provisions | 72-hour urgent response deadline |
| Final disposition/status expected within 90 days, subject to agreed extension | Act/MOU timely-response provisions | 90-calendar-day pausable deadline |
| Lifecycle tracking and auditability | Act §5(5); Charter §5.03 | Engine case history, immutable audit events, deadlines, oversight queue |
| Preserve inventor patent/trade-secret interests and facilitate licensing/compensation under existing law | Act §6; FAQ | IP-interest intake fields and IP record document type; no payment formula invented |
| Staff oversight of overdue agency responses | Act §9; SOP | Compliance escalation queue |
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
| Sensitive content should not be exposed through ordinary email | SOP §4.2.6 | SIG communication templates direct participants to the protected portal; portal messages remain inside the participant channel |

## Deliberately not implemented yet

### 1. Public supporting-file intake and malware quarantine — blocking

The source contemplates technical drawings and supporting files and requires malware scanning/sandboxing. The engine has staff document handling and malware status controls, but the generic public form does not currently enable secure public attachment persistence.

**Current behavior:** supporting-material document types are declared for staff-side handling; the public form contains no file field and participant messages do not accept attachments.

**Required next step:** add reusable public upload staging, malware quarantine, hash/provenance, and controlled attachment promotion.

### 2. Classified information — deployment/accreditation boundary

The source permits classified submissions only through approved secure channels and describes cleared personnel, secure facilities, classification handling, HSM-backed encryption, and other high-assurance controls.

The upstream engine explicitly does not constitute an accredited classified system.

**Current behavior:** the public form requires an attestation that classified information will not be submitted and directs classified material to an approved external secure channel once one exists.

**Required before operational classified intake:** an appropriately authorized/accredited environment and integration design. This must not be simulated by ordinary application configuration.

### 3. Parallel multi-panel / multi-agency referral tracking — partially represented

The source allows submissions to span multiple panels and multiple agencies. The current engine has one active routing queue/assignment and case-level deadline policies; it does not yet provide a first-class collection of parallel referral records, each with its own receiving agency, acknowledgment, 30/90-day clocks, and disposition.

**Current behavior:** a primary domain selects the principal panel; secondary domains are recorded. One primary agency referral lifecycle is modeled.

**Candidate reusable upstream improvement:** first-class child referral/work-item records with per-referral deadlines and agency responses.

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
