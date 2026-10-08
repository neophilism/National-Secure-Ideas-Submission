import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = {
    releaseEvidence: null,
    blueprint: null,
    sigCommit: null,
    out: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--release-evidence") {
      result.releaseEvidence = argv[++index] ?? null;
    } else if (arg === "--blueprint") {
      result.blueprint = argv[++index] ?? null;
    } else if (arg === "--sig-commit") {
      result.sigCommit = argv[++index] ?? null;
    } else if (arg === "--out") {
      result.out = argv[++index] ?? null;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  for (const [key, value] of Object.entries(result)) {
    if (!value) fail(`--${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())} is required`);
  }

  return result;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const args = parseArgs(process.argv.slice(2));
if (!/^[a-f0-9]{40}$/i.test(args.sigCommit)) {
  fail("SIG commit must be a 40-character Git SHA.");
}

const lock = JSON.parse(
  readFileSync(
    new URL("../engine.lock.json", import.meta.url),
    "utf8",
  ),
).engine;
const release = JSON.parse(
  readFileSync(resolve(args.releaseEvidence), "utf8"),
);
const blueprint = readFileSync(resolve(args.blueprint));

if (release.schemaVersion !== 1) {
  fail("Release evidence schemaVersion must be 1.");
}
if (release.engine?.version !== lock.version) {
  fail("Release evidence version does not match engine lock.");
}
if (release.engine?.sourceCommit !== lock.sourceCommit) {
  fail("Release evidence source commit does not match engine lock.");
}
if (release.engine?.tag !== `v${lock.version}`) {
  fail("Release evidence tag does not match engine lock.");
}
if (
  release.container?.repository !==
  "ghcr.io/neophilism/secure-intake-case-workflow-engine"
) {
  fail("Release evidence repository is unexpected.");
}
if (
  !/^sha256:[a-f0-9]{64}$/i.test(
    release.container?.digest ?? "",
  )
) {
  fail("Release evidence digest is invalid.");
}
if (
  release.container?.immutableRef !==
  `${release.container.repository}@${release.container.digest.toLowerCase()}`
) {
  fail("Release evidence immutableRef is inconsistent.");
}

const report = {
  schemaVersion: 1,
  application: "secure_innovation_gateway",
  preparedAt: new Date().toISOString(),
  sigCommit: args.sigCommit.toLowerCase(),
  engine: {
    version: release.engine.version,
    sourceCommit: release.engine.sourceCommit,
    tag: release.engine.tag,
    containerDigest: release.container.digest.toLowerCase(),
    immutableImage: release.container.immutableRef,
  },
  renderBlueprint: {
    sha256: sha256(blueprint),
  },
};

writeFileSync(
  resolve(args.out),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
