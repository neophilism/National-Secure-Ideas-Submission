import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../application/manifest.json", import.meta.url), "utf8"),
);
const lock = JSON.parse(
  readFileSync(new URL("../engine.lock.json", import.meta.url), "utf8"),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ENGINE_COMMIT = "6145c3401dcfdd64fa7b8bc1423bf52450aefe98";

assert(manifest.schemaVersion === 1, "manifest schemaVersion must be 1");
assert(
  manifest.application?.key === "secure_innovation_gateway",
  "unexpected application key",
);
assert(
  lock.engine?.sourceCommit === ENGINE_COMMIT,
  "engine source pin must match the reviewed parallel-referral engine commit",
);
assert(
  lock.engine?.version === "1.0.0-rc.6",
  "engine version pin must be 1.0.0-rc.6",
);
assert(
  lock.engine?.image ===
    "ghcr.io/neophilism/secure-intake-case-workflow-engine:1.0.0-rc.6",
  "engine image pin must be 1.0.0-rc.6",
);

const form = manifest.forms?.find(
  (candidate) => candidate.slug === "secure-idea-submission",
);
assert(form, "secure-idea-submission form is required");

const fields = form.definition.sections.flatMap((section) => section.fields);
const byId = new Map(fields.map((field) => [field.id, field]));

assert(
  byId.has("unclassified_attestation"),
  "classified-information warning/attestation is required",
);
assert(
  byId.has("submitter_eligibility_attestation"),
  "source-defined submitter eligibility attestation is required",
);

const identityMode = byId.get("identity_mode");
assert(identityMode?.type === "select", "identity_mode must be a select field");
assert(identityMode?.required === true, "identity_mode must be required");
assert(
  JSON.stringify(identityMode.options?.map((option) => option.value)) ===
    JSON.stringify([
      "fully_anonymous",
      "confidential_pseudonymous",
      "open_with_consent",
    ]),
  "identity_mode must expose exactly the three source-derived privacy choices",
);

const protectedIdentityFields = [
  "identity_name",
  "identity_email",
  "identity_phone",
  "identity_affiliation",
  "confidential_disclosure_preference",
  "open_identity_scope",
  "identity_contact_notes",
];

for (const fieldId of protectedIdentityFields) {
  const field = byId.get(fieldId);
  assert(field, `missing protected identity field: ${fieldId}`);
  assert(
    field.protection?.compartment === "submitter_identity",
    `${fieldId} must be stored in submitter_identity`,
  );
  assert(
    field.protection?.revealPolicy === "dual_control",
    `${fieldId} must require dual-control reveal`,
  );
}

for (const fieldId of [
  "identity_name",
  "identity_email",
  "identity_phone",
  "identity_affiliation",
  "identity_contact_notes",
]) {
  const field = byId.get(fieldId);
  assert(
    field.condition?.fieldId === "identity_mode" &&
      field.condition?.operator === "not_equals" &&
      field.condition?.value === "fully_anonymous",
    `${fieldId} must be unavailable in fully anonymous mode`,
  );
}

assert(
  byId.get("confidential_disclosure_preference")?.condition?.value ===
    "confidential_pseudonymous",
  "confidential disclosure preference must be limited to confidential mode",
);
assert(
  byId.get("open_identity_scope")?.condition?.value === "open_with_consent",
  "open identity consent scope must be limited to open-with-consent mode",
);
assert(
  byId.get("anonymous_mode_acknowledgment")?.condition?.value ===
    "fully_anonymous",
  "anonymous-mode acknowledgment must be limited to fully anonymous mode",
);


const portal = form.definition.participantPortal;
assert(portal?.enabled === true, "participant portal must be enabled");
assert(
  portal?.allowMessaging === true,
  "participant portal must permit conditional secure messaging",
);
assert(
  portal?.messagingCondition?.fieldId === "identity_mode" &&
    portal?.messagingCondition?.operator === "not_equals" &&
    portal?.messagingCondition?.value === "fully_anonymous",
  "participant messaging must be disabled exactly for fully anonymous submissions",
);
assert(
  !byId.get("identity_mode")?.protection,
  "identity_mode must remain ordinary data so portal authorization never decrypts protected identity",
);

const fileFields = fields.filter((field) => field.type === "file");
assert(
  fileFields.length === 1,
  "SIG must expose exactly one public supporting-material file field",
);
const supportingMaterials = byId.get("supporting_materials");
assert(
  supportingMaterials?.type === "file",
  "supporting_materials must remain a file field",
);
assert(
  supportingMaterials?.required === false,
  "supporting materials must remain optional",
);
assert(
  supportingMaterials?.publicUpload?.documentTypeKey ===
    "submission_supporting_material",
  "supporting materials must bind to the submission supporting-material document type",
);
assert(
  supportingMaterials?.publicUpload?.visibility === "internal",
  "public supporting materials must enter the internal evidence boundary",
);
assert(
  supportingMaterials?.maxFiles === 10,
  "supporting-material file count policy unexpectedly changed",
);
const supportingType = manifest.documentTypes.find(
  (type) => type.key === "submission_supporting_material",
);
assert(supportingType, "submission supporting-material document type is required");
assert(
  supportingType.maxBytes === 52428800,
  "supporting-material per-file size limit must remain 50 MB",
);
assert(
  JSON.stringify(supportingMaterials.acceptedMimeTypes) ===
    JSON.stringify(supportingType.acceptedMimeTypes),
  "public field MIME policy must match the supporting-material document type",
);

const roleByKey = new Map(manifest.roles.map((role) => [role.key, role]));
const requester = roleByKey.get("sig_intake_privacy_officer");
const approver = roleByKey.get("sig_privacy_officer");
assert(requester, "sig_intake_privacy_officer role is required");
assert(approver, "sig_privacy_officer role is required");
assert(
  requester.permissions.includes("protected_data:request_reveal"),
  "intake/privacy officer must be able to request a protected reveal",
);
assert(
  !requester.permissions.includes("protected_data:approve_reveal"),
  "intake/privacy officer must not approve reveals in this configuration",
);
assert(
  approver.permissions.includes("protected_data:approve_reveal"),
  "privacy officer must be able to approve a protected reveal",
);
assert(
  !approver.permissions.includes("protected_data:request_reveal"),
  "privacy officer must not request reveals in this configuration",
);

for (const role of manifest.roles) {
  if (
    role.key !== "sig_intake_privacy_officer" &&
    role.key !== "sig_privacy_officer"
  ) {
    assert(
      !role.permissions.some((permission) =>
        permission.startsWith("protected_data:"),
      ),
      `${role.key} must not receive protected identity permissions`,
    );
  }
}

const workflow = manifest.workflows?.find(
  (candidate) => candidate.slug === "sig_submission_workflow",
);
assert(workflow, "SIG workflow is required");

const stateKeys = new Set(
  workflow.definition.states.map((state) => state.key),
);
assert(
  stateKeys.has("agency_coordination"),
  "workflow must contain the agency_coordination state",
);
for (const obsolete of [
  "referred_to_agency",
  "agency_preliminary_response",
  "agency_follow_up",
]) {
  assert(
    !stateKeys.has(obsolete),
    `obsolete single-agency state must be removed: ${obsolete}`,
  );
}

const deadlineKeys = new Set(
  workflow.definition.deadlinePolicies.map((policy) => policy.key),
);
for (const key of [
  "triage_target",
  "initial_panel_review_target",
  "resumed_panel_review_target",
]) {
  assert(deadlineKeys.has(key), `missing required case deadline policy: ${key}`);
}
for (const obsolete of [
  "agency_preliminary_response",
  "urgent_agency_preliminary_response",
  "agency_final_status",
  "urgent_agency_final_status",
]) {
  assert(
    !deadlineKeys.has(obsolete),
    `agency accountability clock must be referral-specific, not case-wide: ${obsolete}`,
  );
}

const referralPolicies = new Map(
  (manifest.referralPolicies ?? []).map((policy) => [policy.key, policy]),
);
assert(
  referralPolicies.size === 2,
  "SIG must define exactly routine and urgent agency referral policies",
);

const routineReferral = referralPolicies.get("sig_routine_agency_referral");
const urgentReferral = referralPolicies.get("sig_urgent_agency_referral");
assert(routineReferral, "routine agency referral policy is required");
assert(urgentReferral, "urgent agency referral policy is required");

const deadlineByKey = (policy) =>
  new Map(
    policy.definition.deadlinePolicies.map((deadline) => [
      deadline.key,
      deadline,
    ]),
  );

const routineDeadlines = deadlineByKey(routineReferral);
const routinePreliminary = routineDeadlines.get("agency_preliminary_response");
const routineFinal = routineDeadlines.get("agency_final_status");
assert(
  routinePreliminary?.trigger === "sent" &&
    routinePreliminary?.duration?.value === 30 &&
    routinePreliminary?.duration?.unit === "calendar_days",
  "routine preliminary agency response must be a per-referral 30-calendar-day clock from send",
);
assert(
  routineFinal?.trigger === "sent" &&
    routineFinal?.duration?.value === 90 &&
    routineFinal?.duration?.unit === "calendar_days" &&
    routineFinal?.pausable === true,
  "routine final agency status must be a per-referral 90-calendar-day clock with extension/pause support",
);

const urgentDeadlines = deadlineByKey(urgentReferral);
const urgentPreliminary = urgentDeadlines.get(
  "urgent_agency_preliminary_response",
);
const urgentFinal = urgentDeadlines.get("urgent_agency_final_status");
assert(
  urgentPreliminary?.trigger === "sent" &&
    urgentPreliminary?.duration?.value === 72 &&
    urgentPreliminary?.duration?.unit === "hours",
  "urgent preliminary agency response must be a per-referral 72-hour clock from send",
);
assert(
  urgentFinal?.trigger === "sent" &&
    urgentFinal?.duration?.value === 90 &&
    urgentFinal?.duration?.unit === "calendar_days" &&
    urgentFinal?.pausable === true,
  "urgent final agency status must be a per-referral 90-calendar-day clock",
);

for (const deadline of [
  routinePreliminary,
  routineFinal,
  urgentPreliminary,
  urgentFinal,
]) {
  assert(
    deadline?.escalation?.queueSlug === "oversight_compliance",
    "each agency referral clock must escalate to oversight_compliance",
  );
}

const transitionByKey = new Map(
  workflow.definition.transitions.map((transition) => [
    transition.key,
    transition,
  ]),
);
const beginRoutine = transitionByKey.get("begin_agency_coordination");
const beginUrgent = transitionByKey.get(
  "begin_urgent_agency_coordination",
);
const resolveAgency = transitionByKey.get(
  "resolve_after_agency_coordination",
);
for (const transition of [beginRoutine, beginUrgent]) {
  assert(
    transition?.guards?.referrals?.minCount === 1 &&
      transition?.guards?.referrals?.requireAllFinal === false,
    "entering agency coordination must require at least one actual referral",
  );
  assert(
    transition?.requiredPermissions?.includes("referral:manage"),
    "agency coordination transition must require referral management permission",
  );
}
assert(
  resolveAgency?.guards?.referrals?.minCount === 1 &&
    resolveAgency?.guards?.referrals?.requireAllFinal === true,
  "agency coordination cannot resolve while any referral remains open",
);

const referralViewRoles = [
  "sig_triage_officer",
  "sig_expert_reviewer",
  "sig_case_officer",
  "sig_agency_liaison",
  "sig_supervisor",
  "sig_oversight_auditor",
];
for (const key of referralViewRoles) {
  assert(
    roleByKey.get(key)?.permissions.includes("referral:view"),
    `${key} must be able to view agency referrals`,
  );
}
for (const key of [
  "sig_triage_officer",
  "sig_case_officer",
  "sig_agency_liaison",
  "sig_supervisor",
]) {
  assert(
    roleByKey.get(key)?.permissions.includes("referral:manage"),
    `${key} must be able to manage agency referrals`,
  );
}
for (const key of [
  "sig_expert_reviewer",
  "sig_oversight_auditor",
  "sig_intake_privacy_officer",
  "sig_privacy_officer",
]) {
  assert(
    !roleByKey.get(key)?.permissions.includes("referral:manage"),
    `${key} must not receive referral management permission`,
  );
}

assert(
  (manifest.reviewPolicies ?? []).length === 0,
  "do not invent an appeal policy not established by the source package",
);

console.log("SIG downstream policy checks passed.");
