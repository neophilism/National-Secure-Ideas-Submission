# Final acceptance evidence review

## Purpose

This step converts an acceptance-review draft into the production evidence file
only after an authorized reviewer has made an explicit decision for every
control.

It does not discover evidence, infer approval, or automatically convert
supporting machine evidence into a pass.

## Inputs

The finalizer requires:

- `acceptance-evidence-draft.json` from the acceptance-review package;
- a reviewer decision file based on
  `deployment/acceptance-review-decisions.example.json`.

The reviewer decision file contains:

- deployment ID;
- exact ISO-8601 review timestamp;
- reviewer identity;
- every acceptance control;
- explicit `pending` or `pass` status;
- reviewer evidence reference for any control marked `pass`.

## Finalization command

```bash
node scripts/finalize-acceptance-evidence.mjs \
  --draft acceptance-evidence-draft.json \
  --decisions acceptance-review-decisions.json \
  --out acceptance-evidence.json
```

## Guardrails

The finalizer rejects:

- schema-version mismatch;
- deployment-ID mismatch;
- missing/invalid review timestamp;
- missing reviewer identity;
- missing or extra controls;
- statuses other than `pending` or `pass`;
- a `pass` with missing or trivial reviewer evidence.

The finalizer never changes a pending decision to pass.

## Supporting evidence

Supporting evidence already present in the draft is retained.

Reviewer evidence is appended separately using the prefix:

`Reviewer evidence:`

This keeps the distinction between:

- automatically collected supporting evidence; and
- the reviewer-controlled evidence basis for the final decision.

## Production preflight

Finalization is not the final go-live decision.

After the reviewer file is finalized, the production preflight must still run
against the real secret-rendered environment:

```bash
node scripts/verify-production-deployment.mjs \
  --env /secure/runtime/sig.env \
  --evidence acceptance-evidence.json
```

The preflight still requires every go-live control to be `pass` with non-empty
evidence.

## Review responsibility

A reviewer should mark `pass` only when the complete requirement in
`deployment/security-acceptance.json` has actually been satisfied.

Partial machine evidence does not justify a pass when the control also requires
external/provider/operator evidence.
