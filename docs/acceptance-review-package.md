# Acceptance review package assembly

## Purpose

This workflow combines two machine-produced deployment artifacts:

- the verified production promotion bundle; and
- the live production smoke evidence.

It produces a consolidated review package without converting supporting machine
evidence into a final control pass.

The workflow is deliberately conservative: every production gate remains
`pending` until its full requirement has been satisfied with durable external
or operator evidence.

## Inputs

Run:

**Assemble production acceptance review**

with:

- promotion run ID from **Prepare production promotion bundle**;
- smoke run ID from **Production smoke evidence**;
- deployment/change identifier.

The workflow downloads both prior artifacts from the same repository and checks
the promotion bundle checksums before assembly.

## Cross-evidence consistency

The assembler requires the promotion and smoke evidence to refer to the same:

- engine version;
- exact engine source commit.

It also requires the smoke artifact to contain passing checks for:

- engine liveness;
- database-backed readiness;
- public unclassified boundary;
- participant login surface;
- production security headers.

## Supporting machine evidence

Machine evidence is attached only where it genuinely supports part of a control.

### Immutable software / database provenance

Promotion evidence demonstrates:

- exact locked engine source;
- immutable engine SHA-256 container digest;
- generated deployment Blueprint.

For managed Render PostgreSQL, the final control still requires the deployed
database resource identity, provider, region and major version to be captured.

### TLS / edge controls

Smoke evidence demonstrates:

- HTTPS reachability;
- HSTS;
- CSP;
- clickjacking protection;
- MIME-sniff protection;
- referrer policy;
- permissions policy.

The final control still requires separate evidence for:

- WAF / volumetric protection;
- effective rate limiting;
- trusted-proxy overwrite behavior.

### Classified boundary

Smoke evidence demonstrates that the deployed public intake exposes the
unclassified-only boundary.

The final control still requires the deployment owner's explicit acknowledgment
that the application is unclassified-only and is not an ATO or classified
system.

## Controls never auto-passed

The assembler does not automatically pass:

- immutable software/database provenance;
- secrets/key custody;
- staff MFA/IdP;
- TLS/WAF/rate limiting;
- egress controls;
- malware scanner efficacy;
- database restore;
- document-store restore;
- SIEM ingestion/alerts;
- penetration testing;
- manual accessibility;
- records schedule;
- incident response;
- classified-boundary acknowledgment.

Even where machine evidence exists, the draft control status remains
`pending`.

## Outputs

The workflow uploads one acceptance-review artifact containing:

- `acceptance-evidence-draft.json`;
- `acceptance-review.json`;
- `production-promotion-evidence.json`;
- `release-evidence.json`;
- `render.generated.yaml`;
- promotion checksum file;
- `live-deployment-smoke.json`;
- package-level SHA-256 checksums.

### acceptance-evidence-draft.json

This is a working copy of the production evidence file.

It contains:

- the supplied deployment ID;
- all controls in `pending` status;
- supporting machine-evidence references where available.

It is not valid go-live evidence until every required control has been reviewed,
changed to `pass`, and given its complete evidence reference.

### acceptance-review.json

This is a review-oriented summary containing:

- evidence source run IDs;
- SIG/engine release identity;
- production origin;
- passed smoke checks;
- each acceptance requirement;
- supporting machine evidence;
- the remaining external-evidence requirement;
- total/passed/pending gate counts.

The generated go-live status is always `not_ready`.

## Finalization

After external evidence exists, an authorized reviewer should:

1. copy the draft into the controlled deployment workspace;
2. verify each external evidence reference;
3. set only fully satisfied controls to `pass`;
4. fill `reviewedAt` and `reviewedBy`;
5. run the production preflight against the finalized evidence file.

The repository preflight remains the final machine check before go-live review.
