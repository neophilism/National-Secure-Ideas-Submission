# Architecture

## Repository role

This repository is a **downstream application** of the Secure Intake & Case Workflow Engine.

The upstream engine remains domain-neutral. This repository owns:

- SIG branding and terminology;
- application roles;
- intake forms;
- workflow states/transitions;
- deadlines;
- teams/queues and routing;
- document types;
- communication templates;
- deployment configuration;
- SIG-specific acceptance tests and any specialized code that proves impossible to express through generic engine contracts.

## Engine pin

The foundation is developed against the exact upstream source commit recorded in `engine.lock.json` and targets the matching `1.0.0-rc.1` image.

The deployment must move to an immutable image digest once the release image is published.

## Security posture

This repository currently defines an **unclassified foundation** only.

It must not be represented as satisfying the package's classified-system requirements, FISMA authorization, FedRAMP High deployment, HSM architecture, clearance/need-to-know processes, or Authority to Operate. Those are deployment and accreditation requirements beyond a manifest.

## Upstream feedback rule

If implementation exposes a missing capability that is reusable across case-workflow applications, the capability belongs upstream under neutral terminology. After an upstream release, this repository updates its engine pin.

The first identified reusable gaps are tracked in `docs/source-requirements.md`.
