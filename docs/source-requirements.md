# Source-to-software requirements map

Source basis: **National Secure Ideas Submission Act of 2025 / Secure Innovation Gateway (“American Innovation Shield”) legislative package**.

This file records what the downstream application currently implements, what is represented in the application manifest, and what must wait for a reusable engine capability or accredited deployment infrastructure. It is intentionally conservative: a source requirement is not marked implemented unless the software actually provides it.

## Implemented in the foundation manifest

| Source requirement | Source location | Foundation implementation |
| --- | --- | --- |
| Secure Innovation Gateway as centralized submission portal and clearinghouse | Act §§4–5 | Application identity, public intake, SIG case workflow |
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

## Deliberately not implemented yet

### 1. Identity/content compartmentalization — blocking

The SOP requires the submission **Content Package** to be separated from the **Identity Package**, with the identity protected from ordinary reviewers and controlled unmasking. It also describes a two-person rule for non-routine identity access.

The upstream engine currently stores form answers together and has no field-level compartment or dual-control identity reveal primitive.

**Foundation behavior:** the public form collects no name, email, phone, affiliation, or other identity fields. It is anonymous-only rather than pretending ordinary form permissions satisfy the source requirement.

**Required next step:** add a generic upstream compartment/linked-secret capability with separate authorization, access audit, and two-person reveal approval.

### 2. Protected submitter status and messaging — blocking

The source calls for a pseudonymous tracking number, account or tracking-code status lookup, secure messages, and the ability to request additional information without exposing sensitive content in ordinary email.

The engine currently returns a confirmation code but does not provide a protected public status/messaging portal keyed by a pseudonymous credential.

**Foundation behavior:** participant communication templates are defined, but the public anonymous intake warns that protected follow-up/status messaging is not yet enabled.

**Required next step:** add a generic upstream external-participant portal or one-time tracking credential with secure case-status/message access.

### 3. Public supporting-file intake and malware quarantine — blocking

The source contemplates technical drawings and supporting files and requires malware scanning/sandboxing. The engine has staff document handling and malware status controls, but the generic public form does not currently enable secure public attachment persistence.

**Foundation behavior:** supporting-material document types are declared for staff-side handling; the public form contains no file field.

**Required next step:** add reusable public upload staging, malware quarantine, hash/provenance, and controlled attachment promotion.

### 4. Classified information — deployment/accreditation boundary

The source permits classified submissions only through approved secure channels and describes cleared personnel, secure facilities, classification handling, HSM-backed encryption, and other high-assurance controls.

The upstream engine explicitly does not constitute an accredited classified system.

**Foundation behavior:** the public form requires an attestation that classified information will not be submitted and directs classified material to an approved external secure channel once one exists.

**Required before operational classified intake:** an appropriately authorized/accredited environment and integration design. This must not be simulated by ordinary application configuration.

### 5. Parallel multi-panel / multi-agency referral tracking — partially represented

The source allows submissions to span multiple panels and multiple agencies. The current engine has one active routing queue/assignment and case-level deadline policies; it does not yet provide a first-class collection of parallel referral records, each with its own receiving agency, acknowledgment, 30/90-day clocks, and disposition.

**Foundation behavior:** a primary domain selects the principal panel; secondary domains are recorded. One primary agency referral lifecycle is modeled.

**Candidate reusable upstream improvement:** first-class child referral/work-item records with per-referral deadlines and agency responses.

## No invented appeal process

The source package emphasizes oversight, audit, complaints about mishandling, and escalation of agency non-compliance, but the foundation source review does not establish a general submitter appeal from every SIG panel decision. Therefore this manifest does **not** invent an appeal policy.
