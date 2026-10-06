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

## Deliberately not implemented yet

### 1. Protected submitter status and messaging — blocking

The source calls for a secure confirmation and pseudonymous tracking number, account or tracking-code status lookup, secure messages, and the ability to request additional information without exposing sensitive content in ordinary email.

The engine currently returns a confirmation code and the case system provides case numbers, but it does not provide a protected public status/messaging portal keyed by an external participant credential.

**Current behavior:** PR 2 can securely collect confidential identity/contact information, but the public confirmation text still warns that protected status lookup and secure submitter messaging are not yet enabled. Existing participant communication templates remain definitions only; they do not imply a public portal exists.

**Required next step:** add a generic upstream external-participant portal or high-entropy tracking credential with protected case-status and message access, then consume it here.

### 2. Public supporting-file intake and malware quarantine — blocking

The source contemplates technical drawings and supporting files and requires malware scanning/sandboxing. The engine has staff document handling and malware status controls, but the generic public form does not currently enable secure public attachment persistence.

**Current behavior:** supporting-material document types are declared for staff-side handling; the public form contains no file field.

**Required next step:** add reusable public upload staging, malware quarantine, hash/provenance, and controlled attachment promotion.

### 3. Classified information — deployment/accreditation boundary

The source permits classified submissions only through approved secure channels and describes cleared personnel, secure facilities, classification handling, HSM-backed encryption, and other high-assurance controls.

The upstream engine explicitly does not constitute an accredited classified system.

**Current behavior:** the public form requires an attestation that classified information will not be submitted and directs classified material to an approved external secure channel once one exists.

**Required before operational classified intake:** an appropriately authorized/accredited environment and integration design. This must not be simulated by ordinary application configuration.

### 4. Parallel multi-panel / multi-agency referral tracking — partially represented

The source allows submissions to span multiple panels and multiple agencies. The current engine has one active routing queue/assignment and case-level deadline policies; it does not yet provide a first-class collection of parallel referral records, each with its own receiving agency, acknowledgment, 30/90-day clocks, and disposition.

**Current behavior:** a primary domain selects the principal panel; secondary domains are recorded. One primary agency referral lifecycle is modeled.

**Candidate reusable upstream improvement:** first-class child referral/work-item records with per-referral deadlines and agency responses.

### 5. Identity verification integrations — procedural/integration work

The SOP permits confidential identity verification using appropriate public/professional/government sources on a need-to-know basis.

**Current behavior:** PR 2 securely stores supplied identity data and records access, but it does not automatically call identity-verification services or classified/government databases.

**Future work:** define approved verification adapters, authorization, purpose logging, and deployment-specific provider integrations without exposing protected identity to ordinary reviewers.

## Pseudonymous case identifiers

The source permits participating-agency communications to use a pseudonym **or case number** in place of real identity. The current engine generates stable case numbers and the SIG referral/communication model does not require real-name fields. A separate human-readable random handle generator is therefore not required for PR 2, though it may be added later if useful.

## No invented appeal process

The source package emphasizes oversight, audit, complaints about mishandling, and escalation of agency non-compliance, but the source review does not establish a general submitter appeal from every SIG panel decision. Therefore this manifest does **not** invent an appeal policy.
