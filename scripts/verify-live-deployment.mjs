import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = { baseUrl: null, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      result.baseUrl = argv[++index] ?? null;
    } else if (arg === "--out") {
      result.out = argv[++index] ?? null;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  if (!result.baseUrl) fail("--base-url is required");
  return result;
}

function validateBaseUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    fail("Production smoke base URL must be a bare HTTPS origin.");
  }
  return url.origin;
}

async function fetchNoRedirect(url, accept) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    headers: { accept },
    signal: AbortSignal.timeout(15000),
  });
  return response;
}

function requireHeader(response, name, predicate, message) {
  const value = response.headers.get(name);
  if (!value || !predicate(value)) {
    fail(`${message}; received ${name}=${value ?? "<missing>"}`);
  }
  return value;
}

const args = parseArgs(process.argv.slice(2));
const baseUrl = validateBaseUrl(args.baseUrl);
const lock = JSON.parse(
  readFileSync(
    new URL("../engine.lock.json", import.meta.url),
    "utf8",
  ),
).engine;

const checks = [];
function record(name, details = {}) {
  checks.push({ name, status: "pass", ...details });
}

const health = await fetchNoRedirect(
  `${baseUrl}/api/health`,
  "application/json",
);
if (health.status !== 200) {
  fail(`Liveness endpoint returned HTTP ${health.status}.`);
}
const healthJson = await health.json();
if (
  healthJson.status !== "ok" ||
  healthJson.check !== "liveness" ||
  healthJson.service !== "secure-intake-case-workflow-engine" ||
  healthJson.version !== lock.version
) {
  fail("Liveness payload does not match the locked engine release.");
}
record("engine_liveness", {
  endpoint: "/api/health",
  version: healthJson.version,
});

const ready = await fetchNoRedirect(
  `${baseUrl}/api/ready`,
  "application/json",
);
if (ready.status !== 200) {
  fail(`Readiness endpoint returned HTTP ${ready.status}.`);
}
const readyJson = await ready.json();
if (
  readyJson.status !== "ready" ||
  readyJson.check !== "readiness" ||
  readyJson.checks?.database !== "ok" ||
  readyJson.version !== lock.version
) {
  fail("Readiness payload does not prove database readiness.");
}
record("engine_readiness", {
  endpoint: "/api/ready",
  database: readyJson.checks.database,
});

const intake = await fetchNoRedirect(
  `${baseUrl}/intake/secure-innovation-gateway/secure-idea-submission`,
  "text/html",
);
if (intake.status !== 200) {
  fail(`SIG intake returned HTTP ${intake.status}.`);
}
const intakeBody = await intake.text();
for (const requiredText of [
  "American Innovation Shield",
  "Secure Innovation Gateway Submission",
  "Use this form only for unclassified information.",
  "Do not include classified information.",
  "Submit to SIG",
]) {
  if (!intakeBody.includes(requiredText)) {
    fail(`SIG intake is missing required text: ${requiredText}`);
  }
}
record("public_intake_boundary", {
  endpoint:
    "/intake/secure-innovation-gateway/secure-idea-submission",
});

const participant = await fetchNoRedirect(
  `${baseUrl}/participant/secure-innovation-gateway`,
  "text/html",
);
if (participant.status !== 200) {
  fail(`Participant login returned HTTP ${participant.status}.`);
}
const participantBody = await participant.text();
for (const requiredText of [
  "Secure Innovation Gateway participant portal",
  "Tracking code",
  "Access secret",
  "Open participant portal",
]) {
  if (!participantBody.includes(requiredText)) {
    fail(`Participant login is missing required text: ${requiredText}`);
  }
}
record("participant_login_surface", {
  endpoint: "/participant/secure-innovation-gateway",
});

const headers = {};
headers.contentSecurityPolicy = requireHeader(
  intake,
  "content-security-policy",
  (value) =>
    value.includes("default-src 'self'") &&
    value.includes("frame-ancestors 'none'"),
  "Production Content-Security-Policy is missing required directives",
);
headers.referrerPolicy = requireHeader(
  intake,
  "referrer-policy",
  (value) => value === "no-referrer",
  "Production Referrer-Policy is incorrect",
);
headers.contentTypeOptions = requireHeader(
  intake,
  "x-content-type-options",
  (value) => value.toLowerCase() === "nosniff",
  "Production X-Content-Type-Options is incorrect",
);
headers.frameOptions = requireHeader(
  intake,
  "x-frame-options",
  (value) => value.toUpperCase() === "DENY",
  "Production X-Frame-Options is incorrect",
);
headers.permissionsPolicy = requireHeader(
  intake,
  "permissions-policy",
  (value) =>
    value.includes("camera=()") &&
    value.includes("microphone=()") &&
    value.includes("geolocation=()"),
  "Production Permissions-Policy is incomplete",
);
headers.hsts = requireHeader(
  intake,
  "strict-transport-security",
  (value) => /max-age=(\d+)/i.test(value) &&
    Number(value.match(/max-age=(\d+)/i)?.[1] ?? 0) >= 31536000,
  "Production HSTS max-age is too short",
);
record("security_headers", {
  endpoint:
    "/intake/secure-innovation-gateway/secure-idea-submission",
});

const report = {
  schemaVersion: 1,
  application: "secure_innovation_gateway",
  baseUrl,
  checkedAt: new Date().toISOString(),
  engine: {
    version: lock.version,
    sourceCommit: lock.sourceCommit,
  },
  checks,
  observedHeaders: headers,
};

if (args.out) {
  writeFileSync(
    resolve(args.out),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
} else {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
