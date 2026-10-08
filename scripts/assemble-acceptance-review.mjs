import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = {
    promotion: null,
    smoke: null,
    promotionRunId: null,
    smokeRunId: null,
    deploymentId: null,
    outDraft: null,
    outReview: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[++index] ?? null;
    if (arg === "--promotion") result.promotion = value;
    else if (arg === "--smoke") result.smoke = value;
    else if (arg === "--promotion-run-id") result.promotionRunId = value;
    else if (arg === "--smoke-run-id") result.smokeRunId = value;
    else if (arg === "--deployment-id") result.deploymentId = value;
    else if (arg === "--out-draft") result.outDraft = value;
    else if (arg === "--out-review") result.outReview = value;
    else fail(`Unknown argument: ${arg}`);
  }

  for (const [key, value] of Object.entries(result)) {
    if (!value) fail(`Missing required argument for ${key}.`);
  }
  return result;
}

function loadJson(path) {
  const source =
    typeof path === "string" ? resolve(path) : path;
  return JSON.parse(readFileSync(source, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
if (!/^[0-9]+$/.test(args.promotionRunId)) {
  fail("Promotion run ID must be numeric.");
}
if (!/^[0-9]+$/.test(args.smokeRunId)) {
  fail("Smoke run ID must be numeric.");
}
if (
  !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(args.deploymentId)
) {
  fail("Deployment ID must be 3-128 safe characters.");
}

const catalog = loadJson(
  new URL("../deployment/security-acceptance.json", import.meta.url),
);
const template = loadJson(
  new URL("../deployment/acceptance-evidence.example.json", import.meta.url),
);
const promotion = loadJson(args.promotion);
const smoke = loadJson(args.smoke);

if (
  catalog.schemaVersion !== 1 ||
  catalog.application !== "secure_innovation_gateway"
) {
  fail("Security acceptance catalog is invalid.");
}
if (promotion.schemaVersion !== 1) {
  fail("Promotion evidence schemaVersion must be 1.");
}
if (
  promotion.application !== "secure_innovation_gateway"
) {
  fail("Promotion evidence is for the wrong application.");
}
if (smoke.schemaVersion !== 1) {
  fail("Smoke evidence schemaVersion must be 1.");
}
if (smoke.application !== "secure_innovation_gateway") {
  fail("Smoke evidence is for the wrong application.");
}

if (
  promotion.engine?.version !== smoke.engine?.version ||
  promotion.engine?.sourceCommit !== smoke.engine?.sourceCommit
) {
  fail(
    "Promotion and smoke evidence do not refer to the same engine release.",
  );
}

if (!/^https:\/\//.test(smoke.baseUrl ?? "")) {
  fail("Smoke evidence does not contain an HTTPS production origin.");
}

const requiredSmokeChecks = new Set([
  "engine_liveness",
  "engine_readiness",
  "public_intake_boundary",
  "participant_login_surface",
  "security_headers",
]);
const presentSmokeChecks = new Set(
  (smoke.checks ?? [])
    .filter((check) => check.status === "pass")
    .map((check) => check.name),
);
for (const check of requiredSmokeChecks) {
  if (!presentSmokeChecks.has(check)) {
    fail(`Smoke evidence is missing passing check: ${check}`);
  }
}

const controlIds = new Set(
  catalog.controls.map((control) => control.id),
);
const templateIds = new Set(
  Object.keys(template.controls ?? {}),
);
if (
  controlIds.size !== templateIds.size ||
  [...controlIds].some((id) => !templateIds.has(id))
) {
  fail("Acceptance template does not match the control catalog.");
}

const promotionRef =
  `GitHub Actions promotion run ${args.promotionRunId}: production-promotion-evidence.json`;
const smokeRef =
  `GitHub Actions smoke run ${args.smokeRunId}: live-deployment-smoke.json`;

const supporting = {
  immutable_images: [
    `${promotionRef} verifies the locked engine source, immutable engine container digest, and generated deployment Blueprint. Managed database resource/provider/region/version evidence is still required.`,
  ],
  tls_waf_rate_limit: [
    `${smokeRef} verifies HTTPS reachability, HSTS, CSP, framing, MIME-sniffing, referrer and permissions headers. WAF/volumetric, rate-limit and trusted-proxy overwrite evidence is still required.`,
  ],
  classified_boundary: [
    `${smokeRef} verifies the deployed public intake exposes the unclassified-only boundary. Deployment-owner acknowledgment that the system is unclassified-only and not an ATO/classified system is still required.`,
  ],
};

const draft = structuredClone(template);
draft.deploymentId = args.deploymentId;
draft.reviewedAt = null;
draft.reviewedBy = null;

for (const [id, entries] of Object.entries(supporting)) {
  if (!draft.controls[id]) fail(`Unknown supporting-evidence control: ${id}`);
  draft.controls[id].status = "pending";
  draft.controls[id].evidence =
    "Supporting evidence only; control not yet passed. " +
    entries.join(" ");
}

const controls = catalog.controls.map((control) => ({
  id: control.id,
  category: control.category,
  gate: control.gate,
  requirement: control.requirement,
  status: "pending",
  supportingEvidence: supporting[control.id] ?? [],
  remainingExternalEvidence:
    supporting[control.id]?.length
      ? "Machine evidence is attached, but the full control requirement still requires external/operator evidence before status may become pass."
      : "No qualifying machine evidence is attached yet; full external/operator evidence is required before status may become pass.",
}));

const review = {
  schemaVersion: 1,
  application: "secure_innovation_gateway",
  deploymentId: args.deploymentId,
  generatedAt: new Date().toISOString(),
  goLiveStatus: "not_ready",
  rule: catalog.productionGoLiveRule,
  evidenceSources: {
    promotion: {
      runId: args.promotionRunId,
      sigCommit: promotion.sigCommit,
      engineVersion: promotion.engine.version,
      engineSourceCommit: promotion.engine.sourceCommit,
      engineTag: promotion.engine.tag,
      immutableImage: promotion.engine.immutableImage,
      renderBlueprintSha256: promotion.renderBlueprint.sha256,
    },
    smoke: {
      runId: args.smokeRunId,
      baseUrl: smoke.baseUrl,
      checkedAt: smoke.checkedAt,
      engineVersion: smoke.engine.version,
      engineSourceCommit: smoke.engine.sourceCommit,
      passedChecks: [...presentSmokeChecks].sort(),
    },
  },
  controls,
  summary: {
    totalGates: controls.filter((control) => control.gate).length,
    passedGates: 0,
    pendingGates: controls.filter((control) => control.gate).length,
  },
};

writeFileSync(
  resolve(args.outDraft),
  JSON.stringify(draft, null, 2) + "\n",
  "utf8",
);
writeFileSync(
  resolve(args.outReview),
  JSON.stringify(review, null, 2) + "\n",
  "utf8",
);
