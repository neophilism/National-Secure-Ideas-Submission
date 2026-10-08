# Automatic production promotion request

## Purpose

A reviewed change to `production-promotion-request.json` on `main` can now
start the existing production-promotion workflow automatically.

This removes the remaining manual GitHub Actions click between a published
engine release and the verified SIG deployment bundle.

## Request schema

```json
{
  "schemaVersion": 1,
  "engineTag": "v1.0.0-rc.9",
  "engineSourceCommit": "2fb452f23e5e5464db03a3ec95d36c4bc2db4fa4"
}
```

The request validator requires:

- schema version 1;
- tag exactly equal to `v<engine.lock version>`;
- source commit exactly equal to `engine.lock.json`;
- a full immutable 40-character Git SHA.

A request cannot point at a different release source than the downstream lock.

## Trigger behavior

The existing **Prepare production promotion bundle** workflow now supports both:

- manual `workflow_dispatch` for controlled retries; and
- automatic `push` on `main` when
  `production-promotion-request.json` changes.

For automatic runs, the workflow validates the request file before any release
asset is downloaded.

For manual retries, the requested tag must still equal the locked version.

## Promotion path

After validation, the existing promotion logic remains unchanged:

1. download public engine `release-evidence.json`;
2. verify release evidence against `engine.lock.json`;
3. generate the immutable Render Blueprint;
4. validate web/worker/private-Postgres topology;
5. write production-promotion evidence;
6. write SHA-256 checksums;
7. upload the promotion bundle as a GitHub Actions artifact.

## Current request

The repository currently requests:

- engine tag: `v1.0.0-rc.9`;
- engine source:
  `2fb452f23e5e5464db03a3ec95d36c4bc2db4fa4`.

The public engine release and release-evidence asset already exist for that
source.

## Security boundary

This request starts preparation of a verified deployment bundle.

It does not:

- create paid Render resources;
- supply production secrets;
- approve external security controls;
- change any acceptance control to `pass`.
