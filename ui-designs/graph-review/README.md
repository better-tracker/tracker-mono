# Graph page review

The implemented `/graph` page uses the `graph.` heading and Graph navigation on desktop and mobile.

- [Desktop near](desktop-near.png): 1440 × 1000 viewport, full-page capture, with task labels visible.
- [Desktop far](desktop-far.png): the same fixture and task selection, with labels fully faded into the node overview.
- [Mobile](mobile.png): 390 × 844 viewport, full-page capture, with the inspector stacked below the graph and reduced motion enabled.

Captures come from `apps/web/tests/e2e/graph.spec.ts` using the deterministic workspace in `apps/web/tests/fixtures/graph.ts` and a fixed clock. The desktop captures select “Review dashboard wireframes”. Automatic orbit is off, and capture waits for fonts and the graph to settle.

Regenerate with `pnpm test:e2e`; the generated files appear under `apps/web/test-results/graph-review/`. These copies keep the reviewed UI visible in the pull request.

Verification used Chromium, including emulated multi-touch. Physical devices, Safari and Firefox were not exercised. Dense labels are culled for readability; all matching tasks and subtasks remain available in List mode.
