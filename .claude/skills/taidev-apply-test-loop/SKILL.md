---
name: taidev-apply-test-loop
description: "Implement an OpenSpec change, run its Playwright MCP E2E checklist, and repair failures using observed evidence. Use when asked to implement and test a change end to end or keep fixing it until the required E2E cases pass."
license: MIT
metadata:
  author: local
  version: "1.0"
---

# Taidev Apply Test Loop

Run the OpenSpec implementation workflow and browser E2E checklist as one bounded, evidence-driven loop. This workflow does not change the selected change, relax its requirements, or archive it.

## Select the Change Once

Follow `openspec-apply-change` for change and store selection, OpenSpec-root checks, and status handling. Announce `Using change: <name>` and keep the same change, project root, and selected `--store <id>` throughout the loop.

Read this skill and `taidev-test-change` before starting. Follow both skills' project, artifact, browser, evidence, and authorization requirements.

## Implementation and E2E Loop

1. Run `openspec-apply-change` for the selected change and continue until its tracked implementation tasks are complete or it reaches a pause condition.
2. Stop and report if implementation is blocked, the requirement is unclear or conflicting, or the work would exceed the selected change. Do not use E2E results to make product decisions.
3. Run `taidev-test-change` for the selected change. On the first test pass, explicitly request every applicable E2E case by ID so all cases run even if they were checked by an earlier execution.
4. If every required case passes with valid evidence, finish and report implementation and E2E results.
5. If any case fails:
   - Inspect the failed case, its expected and observed behavior, screenshots, relevant browser console/network errors, specs, design, tasks, and affected code.
   - Identify the smallest implementation defect supported by the evidence. Do not change a spec or expected result merely to match the current behavior.
   - If completed task behavior is incorrect, reopen only the corresponding task before modifying code.
   - If the required fix is in the approved scope but no tracked task covers it, pause and ask to update the task artifacts before continuing. Do not implement untracked work.
   - Run `openspec-apply-change` again to repair and verify the defect. Mark a reopened task complete only after its specified behavior is restored.
   - Run `taidev-test-change` again for every failed case and every previously passing case whose behavior could have been affected. Preserve passing evidence for unaffected cases.
6. Repeat until all applicable E2E cases pass or a stop condition is reached.

For each iteration, report its number, the failing case IDs entering implementation, files changed, and cases selected for retest.

## Stop Conditions

Stop and ask the user how to proceed if:

- Evidence exposes unclear or conflicting requirements.
- A fix would exceed the selected change's scope.
- The work requires credentials, an external service, destructive data changes, or additional authorization.
- Playwright MCP or a required environment dependency is unavailable.
- The same case fails after two consecutive repair iterations without new evidence or a materially different implementation hypothesis.
- The user interrupts the workflow.

Do not claim success merely because apply tasks are complete. Success requires every applicable case in `e2e-testing.md` to be checked as passed, required screenshot evidence to exist and be non-empty, and no unresolved browser error that invalidates a case. If the checklist has no executable browser cases, report E2E as not applicable or blocked as appropriate; do not report an E2E pass.

## Final Report

Report the selected change, apply progress, number of repair iterations, E2E pass/fail/skipped/total counts, updated `e2e-testing.md`, and evidence directory. If paused, report the exact blocker, failed case IDs, latest expected versus observed behavior, and the decision needed to continue.
