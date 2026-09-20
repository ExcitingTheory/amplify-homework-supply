# Test Guide

- Test behavior at the smallest owning boundary. Prefer a focused unit or story test before integration and end-to-end suites.
- Never remove error overlays, mutate the DOM, swallow unexpected exceptions, or add arbitrary sleeps to make a test pass. Fix the underlying runtime error or synchronization condition.
- Use semantic queries and observable states. Wait for a condition, request, or accessible element rather than elapsed time.
- Keep fixture IDs stable and representative of runtime data. Storybook mock shapes are defined under `.storybook/__mocks__/`.
- Use targeted pipes to reduce repetitive passing output, but preserve the command's exit status, failure details, and final summary. If a check fails, inspect its complete captured output before diagnosing it; do not rely on a truncated `head`, `tail`, or grep excerpt alone.
- Distinguish environment or harness defects from product defects and record that distinction in the test or final report.
- Do not broaden a focused command after it passes unless the change affects shared contracts.
