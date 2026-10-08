import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = { file: null, githubOutput: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") {
      result.file = argv[++index] ?? null;
    } else if (arg === "--github-output") {
      result.githubOutput = argv[++index] ?? null;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  if (!result.file) fail("--file is required");
  return result;
}

const args = parseArgs(process.argv.slice(2));
const request = JSON.parse(
  readFileSync(resolve(args.file), "utf8"),
);
const lock = JSON.parse(
  readFileSync(
    new URL("../engine.lock.json", import.meta.url),
    "utf8",
  ),
).engine;

if (request.schemaVersion !== 1) {
  fail("Promotion request schemaVersion must be 1.");
}
if (request.engineTag !== `v${lock.version}`) {
  fail(
    `Promotion request engineTag ${request.engineTag} does not match locked tag v${lock.version}.`,
  );
}
if (
  request.engineSourceCommit !== lock.sourceCommit ||
  !/^[a-f0-9]{40}$/i.test(request.engineSourceCommit ?? "")
) {
  fail(
    "Promotion request engineSourceCommit must exactly match the locked immutable engine source.",
  );
}

const resolved = {
  engineTag: request.engineTag,
  engineSourceCommit: request.engineSourceCommit.toLowerCase(),
};

if (args.githubOutput) {
  appendFileSync(
    resolve(args.githubOutput),
    [
      `engine_tag=${resolved.engineTag}`,
      `engine_source_commit=${resolved.engineSourceCommit}`,
      "",
    ].join("\n"),
    "utf8",
  );
} else {
  process.stdout.write(JSON.stringify(resolved, null, 2) + "\n");
}
