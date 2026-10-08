# Render production Blueprint

## Purpose

This deployment path converts the production architecture into a Render
Blueprint that can create the three continuously required runtime resources
together:

- SIG web service;
- SIG background worker;
- managed PostgreSQL.

The production document store and malware scanner remain external approved
services and are supplied as secrets/configuration during Blueprint creation.

## Why the Blueprint is generated

The SIG acceptance contract requires the engine container to be pinned by an
immutable SHA-256 digest.

A static `render.yaml` that references `:1.0.0-rc.9` would be convenient but
would weaken that requirement because tags can move. The repository therefore
commits a generator instead of a production Blueprint containing a mutable tag.

Generate the file only after the rc.9 image has been published and its digest
has been independently recorded:

```bash
node scripts/generate-render-blueprint.mjs \
  --engine-image ghcr.io/neophilism/secure-intake-case-workflow-engine@sha256:<64-hex-digest> \
  --out deployment/render.generated.yaml
```

The generator rejects:

- non-GHCR engine images;
- tag-only images;
- malformed digests;
- the all-zero template digest.

The generated file is ignored by Git because it is a deployment artifact whose
image digest changes with release promotion.

## Resources

### Web

`sig-production-web`

- image-backed Render web service;
- Virginia region;
- one initial instance;
- `/api/ready` database-backed Render health check;
- managed PostgreSQL connection from Render;
- `npm run db:migrate` as the pre-deploy migration command;
- production session/cookie/upload settings;
- private S3-compatible document-store configuration;
- scanner configuration;
- protected-data encryption key supplied as a secret.

### Worker

`sig-production-worker`

- image-backed Render background worker;
- same immutable image as web;
- `npm run worker`;
- same database;
- same object-store/scanner/protected-data configuration;
- one initial continuous worker instance.

The worker copies shared environment variables from the web service through
Render's service-reference mechanism so the operator enters each secret once.

### PostgreSQL

`sig-production-db`

- PostgreSQL 16;
- Virginia region;
- 0.5 CPU / 1 GB initial plan;
- 5 GB initial disk with autoscaling;
- no public IP allow list.

Plan sizes are initial provisioning values, not performance certification.
Increase them if load testing or acceptance evidence requires it.

## Secrets prompted during Blueprint creation

The generated Blueprint uses `sync: false` for values that must not be stored
in source control, including:

- production `APP_BASE_URL`;
- S3 endpoint/region/bucket/access credentials;
- optional S3 session token;
- scanner URL/provider/token;
- protected-data encryption key.

Do not paste these values into GitHub issues, PRs, chat logs, or the completed
acceptance-evidence file.

## First deployment

After Render billing is enabled:

1. Publish the reviewed rc.9 engine image and record its immutable digest.
2. Generate `deployment/render.generated.yaml`.
3. Create a Render Blueprint from that file.
4. Enter the prompted production secrets.
5. Confirm the Blueprint creates web, worker, and PostgreSQL in Virginia.
6. Confirm the database public IP allow list is empty.
7. Complete first-time organization/admin bootstrap as a controlled one-off
   operation; bootstrap credentials are not Blueprint runtime variables.
8. Apply the SIG manifest using an authorized named actor.
9. Continue with the smoke tests and acceptance evidence in the production
   runbook.

## Remaining external gates

Creating the Blueprint does not itself satisfy:

- staff MFA/access gateway;
- approved scanner efficacy tests;
- default-deny outbound network enforcement;
- backup/restore evidence;
- SIEM ingestion;
- penetration test;
- manual accessibility review;
- records/security authority approvals.

Those remain separate evidence gates.
