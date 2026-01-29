Plan: Automate Storybook Testing Workflow

Transform the 7-phase manual Storybook testing workflow into an automated pipeline using existing test infrastructure. Current manual process takes ~70 hours per full validation cycle; automation will reduce this to ~5 hours with 76 hours one-time setup investment.

Steps
Install missing test tools - Run npx storybook add @storybook/addon-vitest to enable automated story rendering checks and interaction testing capabilities already configured in vitest.config.ts.

Create story inventory automation - Build scripts/generate-story-inventory.ts using TypeScript Compiler API to parse all *.stories.* files, extract exports/variants, and generate STORYBOOK_INVENTORY.md manifest automatically on pre-commit or CI.

Add Zod schema validation for mocks - Define schemas in .storybook/mocks/schemas/ for all mock data structures (messages, lexical state, parsed content), create test/storybook/validate-mocks.test.ts suite to validate every mock file against schemas using existing Zod dependency.

Configure test-runner for rendering validation - Set up .storybook/test-runner.ts config to check all stories render without errors, detect console errors/warnings, run a11y checks via existing package.json:82, and generate STORYBOOK_TESTING_RESULTS.md report.

Integrate Chromatic visual regression in CI - Create .github/workflows/chromatic.yml workflow using existing chromatic.config.json and project token to run visual diffs on every PR, replacing manual Phase 4 visual inspection with automated baseline comparison.

Add interaction tests to priority stories - Write play functions in ChatSidebar.stories.jsx, Editor.stories.jsx, and 18 other high-priority stories following pattern from Page.stories.ts to automate Phase 5 deep dive validations using userEvent and expect from storybook/test.

Create CI workflow for full validation - Build .github/workflows/storybook-validation.yml to run inventory script → mock validation → typecheck → test-runner → Chromatic on every PR, enforcing automated validation before merge.

Further Considerations
Phased rollout vs. big bang? - Option A: Implement all automation at once (76 hour sprint), Option B: Start with quick wins (inventory + test-runner, 12 hours) and expand incrementally, Option C: Automate Phases 1-4 first (28 hours), defer interaction testing (Phase 5) until high-value stories identified. Recommendation: Option B for faster ROI and learning.

Chromatic cost management? - Free tier provides 5,000 snapshots/month; current 210+ story variants × 4 PR/week = ~840 snapshots/month (well under limit). Consider snapshot bundling or selective visual testing if usage grows. Track via Chromatic dashboard.

Story interaction test coverage strategy? - Not all 56 story files need play functions. Prioritize: critical paths: ChatSidebar, Editor, Workbook, Section Detail, File Manager

