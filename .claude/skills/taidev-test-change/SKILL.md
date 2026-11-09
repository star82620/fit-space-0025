---
name: taidev-test-change
description: "Execute an OpenSpec change's e2e-testing.md checklist with Playwright MCP, save screenshot evidence, and mark only verified passing cases complete. Use after implementation or to run, continue, or rerun browser E2E tests."
license: MIT
metadata:
  author: local
  version: "1.0"
---

# Taidev Test Change

Execute the selected change's browser E2E checklist and keep auditable evidence in the change directory.

## Select the Change

Accept an optional change name. If omitted, infer it from the conversation or select the only active change. If multiple changes remain possible, run `openspec list --json` and ask the user which one to use.

Follow `openspec-apply-change` for store selection and OpenSpec-root checks. Announce `Using change: <name>` and how to select a different change.

Run:

```bash
openspec status --change "<name>" --json
openspec instructions apply --change "<name>" --json
```

Keep the selected `--store <id>` on both commands. Use the resolved change root and artifact paths from the CLI output; do not guess the change directory or checklist path. Stop if the schema has no E2E checklist, the checklist is missing, OpenSpec reports a blocked state, or unresolved placeholders such as `TBD` prevent execution.

## Preconditions

- Read the complete resolved `e2e-testing.md`, including Test Setup, every case, cleanup, and Traceability.
- Inspect implementation only as needed to determine documented server commands and user-visible locators. The checklist is the test plan; do not silently relax its expectations.
- Confirm Playwright MCP browser tools are available. If not, report the blocker. Do not substitute source inspection, HTTP status checks, unit tests, or a non-MCP browser and call it E2E.
- Start only the services required by Test Setup. Use its documented commands and retain any process handles needed to stop services started for the test. Do not invent credentials, seed data, URLs, or external services.
- Create `<changeRoot>/e2e-evidence/` for screenshots. Preserve existing evidence unless replacing it with a new run of the same case.

## Execute the Checklist

Run unchecked cases in document order. If the user explicitly requests a rerun, run those cases even if checked. For each case:

1. Establish its documented viewport, prerequisites, and clean initial state.
2. Use Playwright MCP to perform the listed steps through visible labels, roles, text, routes, or stable test IDs.
3. Verify every expected result from observable browser state. Inspect console or network errors when the case or behavior requires it.
4. Capture each meaningful screenshot required by the Evidence field. Use stable names such as `e2e-evidence/E2E-001-create-item.png`; add a short checkpoint suffix for multiple screenshots.
5. Confirm each saved screenshot exists, is non-empty, and shows the state it is meant to prove.
6. Perform the documented cleanup before proceeding.

Static inspection, a successful build, a reachable URL, or a screenshot without the required state is not a passing E2E case.

## Record Results

After each case:

- For a passing case, change only its checkbox from `- [ ]` to `- [x]`, preserve its steps and expected results, and add or update beneath its Evidence field:

  ```markdown
  - **Last run:** `YYYY-MM-DD HH:mm Asia/Taipei` — PASS
  - **Screenshot evidence:** [`e2e-evidence/E2E-001-example.png`](e2e-evidence/E2E-001-example.png)
  ```

  List every screenshot that materially supports the result. Use paths relative to `e2e-testing.md`. For non-image evidence, add a concise `Observed evidence` field with the actual URL, visible state, console/network result, download, or measurement.

- For a failed or skipped case, do not check it off. Record the result. For failure, add or update:

  ```markdown
  - **Last run:** `YYYY-MM-DD HH:mm Asia/Taipei` — FAIL
  - **Failure:** <expected versus observed behavior>
  ```

- Before recording a rerun, remove that case's stale result fields. Do not fabricate screenshot paths or leave a stale PASS after a failed rerun. Keep older screenshot files unless the user asks to remove them.

## Finish

After all requested cases have run, report the change and schema, pass/fail/skipped/total counts, updated checklist path, evidence path, browser errors, and whether the full checklist passed.

The run passes only when every required checklist case is checked and its required evidence exists. If tests fail, report case IDs, exact failed steps, expected versus observed behavior, relevant browser errors, and screenshot paths so the implementation workflow can repair the issue.

Always stop the required services started for this test run, whether it passes or fails.
