#!/usr/bin/env python3
"""Execute the authoritative GitHub CI job's run steps for CircleCI.

Never silently ignore new unsupported GitHub Actions steps. CircleCI runner
must provide the equivalent checkout, pinned Node, Docker Compose and Ruby.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import subprocess
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/ci.yml"
PIN = json.loads((ROOT / "engine.lock.json").read_text())["engine"]
ENGINE_REPO = "neophilism/Secure-Intake-Case-Workflow-Engine"
PINNED_COMMIT = PIN["sourceCommit"]
ACTIONS = {"actions/checkout@v4", "actions/setup-node@v4"}


def fail(message: str) -> None:
    raise RuntimeError(f"CI parity failure: {message}")


def main() -> None:
    workflow = yaml.safe_load(WORKFLOW.read_text())
    jobs = workflow.get("jobs")
    if not isinstance(jobs, dict) or set(jobs) != {"validate"}:
        fail("Unexpected job shape: review new workflow jobs before porting")
    steps = jobs["validate"].get("steps")
    if not isinstance(steps, list) or len(steps) < 10:
        fail("Workflow steps missing or truncated")

    seen_checkout = False
    seen_setup = False
    seen_engine = False
    executed = 0
    for i, step in enumerate(steps, 1):
        if not isinstance(step, dict):
            fail(f"Step {i} is not a mapping")
        action = step.get("uses")
        run = step.get("run")
        if bool(action) == bool(run):
            fail(f"Step {i} must contain exactly one uses or run")
        if action:
            if action not in ACTIONS:
                fail(f"Unsupported action: {action}")
            opts = step.get("with", {}) or {}
            if action == "actions/setup-node@v4":
                if set(opts) != {"node-version"} or int(opts["node-version"]) != 22:
                    fail("Node runtime changed; update CircleCI with review")
                if not os.popen("node --version").read().strip().startswith("v22."):
                    fail("Expected Node 22")
                seen_setup = True
            elif opts:
                if opts != {"repository": ENGINE_REPO, "ref": PINNED_COMMIT, "path": ".engine"}:
                    fail("Engine checkout no longer matches pinned lock")
                checkout = ROOT / ".engine"
                if not (checkout / ".git").exists() and not (checkout / ".git").is_file():
                    fail("Missing external engine checkout")
                actual = subprocess.check_output(["git", "-C", str(checkout), "rev-parse", "HEAD"], text=True).strip()
                if actual != PINNED_COMMIT:
                    fail("External engine checkout SHA differs from lock")
                seen_engine = True
            else:
                if not (ROOT / ".git").exists():
                    fail("Main repository has not been checked out")
                seen_checkout = True
            print(f"[CI parity] validated action {i}: {action}", flush=True)
            continue

        if not isinstance(run, str) or not run.strip():
            fail(f"Empty or missing run command: {i}")
        if "${{" in run:
            fail(f"Unevaluated GitHub expression in shell command: {i}")
        if "env" in step or "if" in step or "shell" in step:
            fail(f"Step {i} changed execution semantics")
        relative = step.get("working-directory", ".")
        if relative not in (".", ".engine"):
            fail(f"Unexpected working directory at step {i}: {relative!r}")
        cwd = ROOT / relative
        if relative == ".engine" and not seen_engine:
            fail("Engine scripts run before pinned checkout")
        if not (seen_checkout and seen_setup):
            fail("Run attempted before source/Node setup")
        name = step.get("name", f"shell step {i}")
        print(f"[CI parity] {i}: {name}", flush=True)
        subprocess.run(["bash", "-e", "-o", "pipefail", "-c", run], cwd=cwd, check=True, env=os.environ.copy())
        executed += 1
    if not (seen_checkout and seen_setup and seen_engine):
        fail("A required source setup action is missing")
    if executed < 10:
        fail(f"Only {executed} CI validation commands executed")
    print(f"[CI parity] All {executed} authoritative run steps passed.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[CI parity] FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
