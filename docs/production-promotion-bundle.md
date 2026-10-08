# Automated production promotion bundle

## Purpose

This workflow turns a published engine release into a verified SIG deployment
bundle without manually copying a container digest.

The engine release publishes a public `release-evidence.json` asset at the
release tag. SIG downloads that file, verifies it against `engine.lock.json`,
generates the immutable Render Blueprint, and records a promotion-evidence
document tying the engine release and SIG source together.

## Workflow

Run:

**Prepare production promotion bundle**

with:

- engine tag: `v1.0.0-rc.9`

The workflow:

1. checks out the SIG commit being promoted;
2. requires the requested tag to equal `v<engine.lock version>`;
3. downloads:
   `https://github.com/neophilism/Secure-Intake-Case-Workflow-Engine/releases/download/<tag>/release-evidence.json`;
4. verifies the release evidence through
   `scripts/generate-render-blueprint.mjs`;
5. generates `render.generated.yaml`;
6. validates the Blueprint topology;
7. writes `production-promotion-evidence.json`;
8. writes SHA-256 checksums;
9. uploads the complete bundle as a 90-day Actions artifact.

## Promotion evidence

The promotion evidence records:

- SIG source commit;
- engine version;
- exact engine source commit;
- engine release tag;
- immutable container digest;
- immutable container image reference;
- SHA-256 of the generated Render Blueprint.

The release evidence itself is revalidated before the promotion evidence is
written.

## Bundle contents

The uploaded artifact contains:

- `release-evidence.json`;
- `render.generated.yaml`;
- `production-promotion-evidence.json`;
- `SHA256SUMS`.

The Render Blueprint contains no production secret values. Secret fields remain
prompted through the Blueprint's `sync: false` declarations.

## Failure behavior

Promotion fails if:

- the requested tag does not match the engine lock;
- the public release asset does not exist;
- release version/source/tag/repository/digest does not match the lock;
- the immutable reference is inconsistent;
- the generated Blueprint does not contain the expected web/worker/private-DB
  topology.

No deployment artifact is published on a failed validation.

## Deployment handoff

After a successful promotion bundle:

1. retain the artifact with the deployment/change record;
2. use the generated Blueprint to create/update the Render resources;
3. enter the approved production secrets;
4. run the production smoke workflow;
5. continue the remaining external acceptance evidence.

This workflow prepares deployment inputs. It does not itself create paid Render
resources or mark external security controls complete.
