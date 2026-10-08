import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = {
    draft: null,
    decisions: null,
    out: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[++index] ?? null;
    if (arg === "--draft") result.draft = value;
    else if (arg === "--decisions") result.decisions = value;
    else if (arg === "--out") result.out = value;
    else fail(`Unknown argument: ${arg}`);
  }
  if (!result.draft) fail("--draft is required");
  if (!result.decisions) fail("--decisions is required");
  if (!result.out) fail("--out is required");
  return result;
}

function load(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function isIsoTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

const args = parseArgs(process.argv.slice(2));
const catalog = load(
  new URL("../deployment/security-acceptance.json", import.meta.url),
);
const draft = load(args.draft);
const decisions = load(args.decisions);

if (draft.schemaVersion !== 1 || decisions.schemaVersion !== 1) {
  fail("Draft and decisions schemaVersion must be 1.");
}
if (!draft.deploymentId || decisions.deploymentId !== draft.deploymentId) {
  fail("Reviewer decisions deploymentId must match the acceptance draft.");
}
if (!isIsoTimestamp(decisions.reviewedAt)) {
  fail("reviewedAt must be an exact ISO-8601 timestamp.");
}
if (
  typeof decisions.reviewedBy !== "string" ||
  decisions.reviewedBy.trim().length < 2
) {
  fail("reviewedBy is required.");
}

const expectedIds = catalog.controls.map((control) => control.id);
const expected = new Set(expectedIds);
const draftIds = Object.keys(draft.controls ?? {});
const decisionIds = Object.keys(decisions.controls ?? {});

for (const [label, ids] of [
  ["draft", draftIds],
  ["decisions", decisionIds],
]) {
  if (
    ids.length !== expected.size ||
    ids.some((id) => !expected.has(id))
  ) {
    fail(`${label} controls must contain every catalog control exactly once.`);
  }
}

const output = {
  schemaVersion: 1,
  deploymentId: draft.deploymentId,
  reviewedAt: decisions.reviewedAt,
  reviewedBy: decisions.reviewedBy.trim(),
  controls: {},
};

for (const id of expectedIds) {
  const draftRow = draft.controls[id];
  const decision = decisions.controls[id];

  if (!decision || !["pending", "pass"].includes(decision.status)) {
    fail(`Control ${id} must have status pending or pass.`);
  }

  const reviewerEvidence =
    typeof decision.evidence === "string"
      ? decision.evidence.trim()
      : "";

  if (decision.status === "pass" && reviewerEvidence.length < 8) {
    fail(
      `Control ${id} cannot pass without a substantive reviewer evidence reference.`,
    );
  }

  const supportingEvidence =
    typeof draftRow?.evidence === "string"
      ? draftRow.evidence.trim()
      : "";

  const evidenceParts = [];
  if (supportingEvidence) {
    evidenceParts.push(supportingEvidence);
  }
  if (reviewerEvidence) {
    evidenceParts.push(`Reviewer evidence: ${reviewerEvidence}`);
  }

  output.controls[id] = {
    status: decision.status,
    evidence: evidenceParts.join(" "),
  };
}

writeFileSync(
  resolve(args.out),
  JSON.stringify(output, null, 2) + "\n",
  "utf8",
);
