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

assert(manifest.schemaVersion === 1, "manifest schemaVersion must be 1");
assert(
  manifest.application?.key === "secure_innovation_gateway",
  "unexpected application key",
);
assert(
  lock.engine?.sourceCommit === "84362ad69ffd45a421d026c1c6a5ec0621a6b203",
  "engine source pin changed unexpectedly",
);
assert(
  lock.engine?.version === "1.0.0-rc.1",
  "engine version pin changed unexpectedly",
);

const form = manifest.forms?.find(
  (candidate) => candidate.slug === "secure-idea-submission",
);
assert(form, "secure-idea-submission form is required");

const fields = form.definition.sections.flatMap((section) => section.fields);
const fieldIds = new Set(fields.map((field) => field.id));
for (const forbidden of [
  "name",
  "email",
  "phone",
  "address",
  "affiliation",
  "employer",
  "identity",
]) {
  assert(
    !fieldIds.has(forbidden),
    `foundation form must not collect identity field '${forbidden}'`,
  );
}

assert(
  fieldIds.has("unclassified_attestation"),
  "classified-information warning/attestation is required",
);

const workflow = manifest.workflows?.find(
  (candidate) => candidate.slug === "sig_submission_workflow",
);
assert(workflow, "SIG workflow is required");

const deadlineKeys = new Set(
  workflow.definition.deadlinePolicies.map((policy) => policy.key),
);
for (const key of [
  "triage_target",
  "initial_panel_review_target",
  "agency_preliminary_response",
  "urgent_agency_preliminary_response",
  "agency_final_status",
]) {
  assert(deadlineKeys.has(key), `missing required deadline policy: ${key}`);
}

assert(
  (manifest.reviewPolicies ?? []).length === 0,
  "do not invent an appeal policy not established by the source package",
);

console.log("Foundation policy checks passed.");
