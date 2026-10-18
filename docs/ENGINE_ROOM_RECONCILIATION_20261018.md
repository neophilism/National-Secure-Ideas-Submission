# Upstream-first source reconciliation — 18 October 2026

Reviewed downstream source: `77ba3ed3a08918a141b6e443c90b9b51d1015685`. The API observation records 27 PRs, 1 open, 26 closed, 25 merged and 1 closed without merge. These are GitHub facts, separate from the local 21-unit work plan.

The application pins Secure Intake `1.0.0-rc.9`, commit `2fb452f23e5e5464db03a3ec95d36c4bc2db4fa4`. The source plan documents historical development against specific upstream release-candidate capabilities. PRs #7 and #10 explicitly cleaned up pins after downstream PRs merged immediately before corresponding upstream merges. That historical co-development occurred; it must not be relabeled as development on an already finished stable engine.

## Corrected source contract

The owner's 18 October instruction requires upstream-first completion. Every canonical downstream unit now declares the engine's SI-42 stable-release requirement. Units also retain the applicable specific upstream capability from the detailed plan. Stable IDs, local accepted PR mappings and all 21 approved units are preserved. The canonical runtime dependency records the exact current lock and requires a stable engine for production. The source validator checks all units retain the upstream gate and rejects source/version drift. Production preflight now rejects a prerelease pin; template validation and independent preparatory tests can continue.

The explicit capability links use actual engine source definitions, not ordinal guesses:

- protected identities: SI-22;
- participant portal/messaging: SI-23 and SI-24;
- quarantine: SI-25;
- referrals and operations: SI-26 and SI-27;
- durable storage/scanning: SI-30, explicitly defined by ADR 0030 / engine PR #28;
- readiness: SI-31, ADR 0031 / engine PR #29;
- immutable release evidence: SI-32, ADR 0032 consolidated in engine PR #31;
- validated dispatch/request tooling: SI-33 / SI-34.

## Completion facts and remaining evidence

All local mapped PRs can be accepted while the upstream stable release and the deployed end-to-end application remain unverified. The former dashboard's unconditional 100% was not proof of either. Local tooling includes manifests, production preflight, release-evidence generation, promotion bundles and review assembly. Those tools can prepare evidence without establishing that every real production control passed.

The older provisioning document records historical attempts and provider limits; this audit does not assert that those old account/billing facts remain current. Current runtime/provider, deployment, scanner/storage, authorized authentication, restoration and full downstream flow evidence must be checked against actual configured resources. Independent human security auditing remains deferred under owner policy; it is not substituted for missing real control evidence or used to halt ordinary development.

Policy checks, canonical registry checks, dependency-contract positive/negative tests and template preflight pass locally. Existing full downstream CI validates the manifest against the pinned engine, deployment templates and promotion/acceptance tooling. No live data, secret, service placement or paid resource is changed by this source repair.
