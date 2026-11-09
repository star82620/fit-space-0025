# E2E Testing Checklist

## Test Setup

- **Start URL / route:** <!-- Exact URL or route; use TBD if not yet knowable -->
- **Viewport(s):** <!-- Desktop/mobile dimensions required by this change -->
- **Test data / accounts:** <!-- Required roles, records, fixtures, or seed state -->
- **Prerequisites:** <!-- Server commands, environment, mocks, or dependencies -->

## 1. <!-- Test Group Name -->

- [ ] E2E-001 <!-- User-observable behavior -->
  - **Priority:** <!-- Critical / High / Medium / Low -->
  - **Prerequisites:** <!-- State required before this case starts -->
  - **Steps:**
    1. <!-- Open a route or perform a visible user action. -->
    2. <!-- Continue with labels, roles, visible text, or stable test IDs. -->
  - **Expected results:**
    1. <!-- Observable state, text, URL, download, or other result. -->
  - **Evidence:** <!-- Meaningful screenshot/state plus console or network checks when relevant -->
  - **Cleanup:** <!-- Reset persistent state, or state "None" -->

- [ ] E2E-002 <!-- Another independent user-observable behavior -->
  - **Priority:** <!-- Critical / High / Medium / Low -->
  - **Prerequisites:** <!-- State required before this case starts -->
  - **Steps:**
    1. <!-- Perform visible user actions in execution order. -->
  - **Expected results:**
    1. <!-- State the observable outcome. -->
  - **Evidence:** <!-- Evidence Playwright MCP should retain -->
  - **Cleanup:** <!-- Reset persistent state, or state "None" -->

## Traceability

| Spec scenario | E2E case(s) | Notes |
|---|---|---|
| `<!-- capability: scenario -->` | `E2E-001` | <!-- Coverage or lower-level verification rationale --> |
