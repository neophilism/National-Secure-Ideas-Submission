import { readFileSync, statSync } from "node:fs";
import {verifyDependencyContract} from "./verify-dependency-contract.mjs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = { template: false, envPath: null, evidencePath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--template") {
      result.template = true;
    } else if (arg === "--env") {
      result.envPath = argv[++index] ?? null;
    } else if (arg === "--evidence") {
      result.evidencePath = argv[++index] ?? null;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  if (!result.envPath) fail("--env is required");
  if (!result.evidencePath) fail("--evidence is required");
  return result;
}

function parseEnv(path) {
  const values = new Map();
  const source = readFileSync(path, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals < 1) fail(`Invalid env line: ${rawLine}`);
    const key = line.slice(0, equals).trim();
    const value = line.slice(equals + 1).trim();
    values.set(key, value);
  }
  return values;
}

function required(env, key) {
  if (!env.has(key)) fail(`Missing required production env key: ${key}`);
  return env.get(key);
}

function integer(env, key) {
  const value = Number(required(env, key));
  if (!Number.isSafeInteger(value)) fail(`${key} must be an integer`);
  return value;
}

function isZeroDigest(value) {
  return /@sha256:0{64}$/.test(value);
}

function isImmutableImage(value) {
  return /@sha256:[a-f0-9]{64}$/i.test(value);
}

function isPlaceholder(value) {
  return (
    !value ||
    /REPLACE|EXAMPLE|CHANGEME/i.test(value) ||
    /^0+$/.test(value)
  );
}

const args = parseArgs(process.argv.slice(2));
verifyDependencyContract(JSON.parse(readFileSync(new URL("../registry/prs.json",import.meta.url),"utf8")),JSON.parse(readFileSync(new URL("../engine.lock.json",import.meta.url),"utf8")),{production:!args.template});
const envPath = resolve(args.envPath);
const evidencePath = resolve(args.evidencePath);
const env = parseEnv(envPath);

for (const key of [
  "ENGINE_IMAGE",
  "POSTGRES_IMAGE",
  "APP_BASE_URL",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "AUTH_SESSION_COOKIE_NAME",
  "AUTH_SESSION_TTL_HOURS",
  "PARTICIPANT_SESSION_COOKIE_NAME",
  "PARTICIPANT_SESSION_TTL_HOURS",
  "AUTH_TRUST_PROXY_HEADERS",
  "DOCUMENT_MAX_BYTES",
  "PUBLIC_UPLOAD_TOTAL_MAX_BYTES",
  "DOCUMENT_STORAGE_DRIVER",
  "DOCUMENT_S3_ENDPOINT",
  "DOCUMENT_S3_REGION",
  "DOCUMENT_S3_BUCKET",
  "DOCUMENT_S3_ACCESS_KEY_ID",
  "DOCUMENT_S3_SECRET_ACCESS_KEY",
  "MALWARE_SCANNER_URL",
  "MALWARE_SCANNER_PROVIDER",
  "MALWARE_SCANNER_TIMEOUT_MS",
  "PROTECTED_DATA_ENCRYPTION_KEY",
  "SIG_WEBHOOKS_ENABLED",
]) {
  required(env, key);
}

const appUrl = new URL(required(env, "APP_BASE_URL"));
if (
  appUrl.protocol !== "https:" ||
  appUrl.username ||
  appUrl.password ||
  (appUrl.pathname !== "/" && appUrl.pathname !== "") ||
  appUrl.search ||
  appUrl.hash
) {
  fail("APP_BASE_URL must be a bare HTTPS origin in production");
}

const staffCookie = required(env, "AUTH_SESSION_COOKIE_NAME");
const participantCookie = required(
  env,
  "PARTICIPANT_SESSION_COOKIE_NAME",
);
if (!staffCookie.startsWith("__Host-")) {
  fail("AUTH_SESSION_COOKIE_NAME must use the __Host- prefix");
}
if (!participantCookie.startsWith("__Host-")) {
  fail("PARTICIPANT_SESSION_COOKIE_NAME must use the __Host- prefix");
}
if (staffCookie === participantCookie) {
  fail("Staff and participant cookie names must be distinct");
}
if (integer(env, "AUTH_SESSION_TTL_HOURS") > 12) {
  fail("Staff session TTL must not exceed 12 hours");
}
if (integer(env, "PARTICIPANT_SESSION_TTL_HOURS") > 8) {
  fail("Participant session TTL must not exceed 8 hours");
}
if (required(env, "AUTH_TRUST_PROXY_HEADERS") !== "true") {
  fail(
    "Production SIG expects a trusted reverse proxy that overwrites client-address headers",
  );
}

const documentMax = integer(env, "DOCUMENT_MAX_BYTES");
const aggregateMax = integer(env, "PUBLIC_UPLOAD_TOTAL_MAX_BYTES");
if (documentMax < 1 || aggregateMax < 1) {
  fail("Upload limits must be positive");
}
if (documentMax > aggregateMax) {
  fail("DOCUMENT_MAX_BYTES must not exceed the aggregate upload limit");
}
if (aggregateMax > 50 * 1024 * 1024) {
  fail("SIG aggregate upload limit must not exceed 50 MB");
}

if (required(env, "DOCUMENT_STORAGE_DRIVER") !== "s3") {
  fail("Production SIG requires DOCUMENT_STORAGE_DRIVER=s3");
}

const storageUrl = new URL(required(env, "DOCUMENT_S3_ENDPOINT"));
if (
  storageUrl.protocol !== "https:" ||
  storageUrl.username ||
  storageUrl.password ||
  storageUrl.search ||
  storageUrl.hash
) {
  fail("DOCUMENT_S3_ENDPOINT must be a bare HTTPS URL");
}

const scannerUrl = new URL(required(env, "MALWARE_SCANNER_URL"));
if (
  scannerUrl.protocol !== "https:" ||
  scannerUrl.username ||
  scannerUrl.password
) {
  fail("MALWARE_SCANNER_URL must be HTTPS without embedded credentials");
}

const scannerTimeout = integer(env, "MALWARE_SCANNER_TIMEOUT_MS");
if (scannerTimeout < 1000 || scannerTimeout > 600000) {
  fail("MALWARE_SCANNER_TIMEOUT_MS must be between 1000 and 600000");
}

if (env.has("BOOTSTRAP_ADMIN_PASSWORD")) {
  fail("Production runtime env must not contain BOOTSTRAP_ADMIN_PASSWORD");
}
if (env.has("BOOTSTRAP_ADMIN_EMAIL")) {
  fail("Production runtime env must not contain BOOTSTRAP_ADMIN_EMAIL");
}

for (const key of ["ENGINE_IMAGE", "POSTGRES_IMAGE"]) {
  const image = required(env, key);
  if (!isImmutableImage(image)) {
    fail(`${key} must be pinned by sha256 digest`);
  }
  if (!args.template && isZeroDigest(image)) {
    fail(`${key} still contains the template digest`);
  }
}

const webhookEnabled = required(env, "SIG_WEBHOOKS_ENABLED");
if (!["true", "false"].includes(webhookEnabled)) {
  fail("SIG_WEBHOOKS_ENABLED must be true or false");
}

if (!args.template) {
  const mode = statSync(envPath).mode & 0o777;
  if ((mode & 0o077) !== 0) {
    fail(
      `Production env file permissions must be 0600-style; found ${mode.toString(8)}`,
    );
  }

  const dbPassword = required(env, "POSTGRES_PASSWORD");
  if (
    dbPassword.length < 24 ||
    !/^[A-Za-z0-9._~-]+$/.test(dbPassword) ||
    isPlaceholder(dbPassword)
  ) {
    fail(
      "POSTGRES_PASSWORD must be at least 24 URL-safe characters from the approved secrets manager",
    );
  }

  for (const key of [
    "DOCUMENT_S3_BUCKET",
    "DOCUMENT_S3_ACCESS_KEY_ID",
    "DOCUMENT_S3_SECRET_ACCESS_KEY",
    "MALWARE_SCANNER_PROVIDER",
  ]) {
    if (isPlaceholder(required(env, key))) {
      fail(`${key} still contains a placeholder`);
    }
  }

  if (
    /example\./i.test(storageUrl.hostname) ||
    /example\./i.test(scannerUrl.hostname)
  ) {
    fail("Storage and scanner endpoints must not use template example hosts");
  }

  const scannerToken = env.get("MALWARE_SCANNER_TOKEN") ?? "";
  if (scannerToken && isPlaceholder(scannerToken)) {
    fail("MALWARE_SCANNER_TOKEN still contains a placeholder");
  }

  const protectedKey = required(
    env,
    "PROTECTED_DATA_ENCRYPTION_KEY",
  );
  if (
    !/^[a-f0-9]{64}$/i.test(protectedKey) ||
    isPlaceholder(protectedKey)
  ) {
    fail(
      "PROTECTED_DATA_ENCRYPTION_KEY must be a non-placeholder 32-byte hex key",
    );
  }

  const webhookKey = env.get("WEBHOOK_ENCRYPTION_KEY") ?? "";
  if (webhookEnabled === "true") {
    if (
      !/^[a-f0-9]{64}$/i.test(webhookKey) ||
      isPlaceholder(webhookKey)
    ) {
      fail(
        "WEBHOOK_ENCRYPTION_KEY is required when webhooks are enabled",
      );
    }
    if (webhookKey.toLowerCase() === protectedKey.toLowerCase()) {
      fail("Webhook and protected-data encryption keys must be distinct");
    }
  }
}

const acceptance = JSON.parse(
  readFileSync(
    new URL("../deployment/security-acceptance.json", import.meta.url),
    "utf8",
  ),
);
const retention = JSON.parse(
  readFileSync(
    new URL("../deployment/records-retention.json", import.meta.url),
    "utf8",
  ),
);
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

if (acceptance.schemaVersion !== 1) {
  fail("security-acceptance.json schemaVersion must be 1");
}
if (retention.schemaVersion !== 1) {
  fail("records-retention.json schemaVersion must be 1");
}
if (
  retention.automaticDeletionEnabled !== false ||
  retention.legalHoldOverridesDisposition !== true
) {
  fail("Retention configuration must remain hold-by-default");
}
if (
  retention.categories.some(
    (category) =>
      category.disposition !== "retain" &&
      category.disposition !==
        "retain_until_engine_supported_schedule_is_approved",
  )
) {
  fail("No destructive retention disposition is authorized");
}

const expectedIds = new Set(
  acceptance.controls.map((control) => control.id),
);
const evidenceIds = new Set(Object.keys(evidence.controls ?? {}));
if (expectedIds.size !== evidenceIds.size) {
  fail("Acceptance evidence must contain every defined control exactly once");
}
for (const id of expectedIds) {
  if (!evidenceIds.has(id)) {
    fail(`Acceptance evidence is missing control: ${id}`);
  }
}

if (args.template) {
  for (const id of expectedIds) {
    const row = evidence.controls[id];
    if (row.status !== "pending" || row.evidence !== "") {
      fail(
        `Evidence template control ${id} must begin pending with blank evidence`,
      );
    }
  }
} else {
  if (
    !evidence.deploymentId ||
    isPlaceholder(String(evidence.deploymentId))
  ) {
    fail("Production evidence requires a deploymentId");
  }
  if (!evidence.reviewedAt || !evidence.reviewedBy) {
    fail("Production evidence requires reviewedAt and reviewedBy");
  }

  for (const control of acceptance.controls) {
    if (!control.gate) continue;
    const row = evidence.controls[control.id];
    if (row.status !== "pass") {
      fail(`Go-live control did not pass: ${control.id}`);
    }
    if (!String(row.evidence ?? "").trim()) {
      fail(`Go-live control lacks evidence: ${control.id}`);
    }
  }
}

console.log(
  args.template
    ? "Production deployment template and acceptance schema checks passed."
    : "Production deployment preflight passed.",
);
