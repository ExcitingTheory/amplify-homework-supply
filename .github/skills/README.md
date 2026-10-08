# Agent Skills

GitHub Copilot Agent Skills for the Homework Supply project.

## Available Skills

### [component-versioning](./component-versioning/)
Create a versioned component copy with bounded evidence and focused validation.

**Use when**: A rewrite, incompatible API change, or major migration — not for routine edits. Confirm the source component and target version first.

### [console-crawl-audit](./console-crawl-audit/)
Scope-aware runtime crawl with targeted log inspection.

**Use when**: Verifying changed routes after a change (default scope). Crawl all roles/routes only for schema/context changes, a release check, or an explicit request.

### [docblock-backfill](./docblock-backfill/)
Bounded docblock audit and backfill for explicitly requested files.

**Use when**: A specific file or directory is explicitly named for docblock audit/backfill — defaults to dry-run first, not an open-ended sweep.

### [extract-code-documentation](./extract-code-documentation/)
Generate only requested translation metadata using existing scripts.

**Use when**: One specific operation is needed — usage discovery, placeholder repair, or missing-metadata generation — scoped to requested namespaces.

### [feature-development-cycle](./feature-development-cycle/)
Proportionate feature workflow using focused evidence and validation.

**Use when**: Multi-surface or multi-session work needs a concise plan (scope, acceptance criteria, risks, test strategy). Localized fixes use the normal edit-test loop instead.

### [mock-data-validator](./mock-data-validator/)
Validate a specified Storybook mock against its consuming component.

**Use when**: A specific component or story target is given — checks its mocks and providers against the component's real props.

### [multi-model-ai-translation](./multi-model-ai-translation/)
Bounded multi-model translation with exception-only review.

**Use when**: Translating i18n content. Defaults to `fake` mode; `provable` mode (real model calls) requires explicit user approval for provider cost.

### [semantic-file-search](./semantic-file-search/)
Focused code discovery using one query and limited evidence reads.

**Use when**: Searching for components, patterns, or implementations without knowing exact paths — start with one natural-language query and a known scope if available.

### [storybook-audit](./storybook-audit/)
Focused Storybook audit that widens only from observed failures.

**Use when**: Requested or changed stories need validation (default scope). Use the full suite only for a requested full audit, release check, or shared Storybook infrastructure change.

## Skill Structure

Each skill directory contains:
- `SKILL.md` - Instructions for GitHub Copilot (YAML frontmatter + markdown)
- `*.ts` - TypeScript implementation (optional, for programmatic execution)
- `*.test.ts` - Test files (optional)
- Additional resources (examples, templates, etc.)

## Using Skills

### Quick Start

Skills are automatically loaded by GitHub Copilot when you work in this workspace. You can invoke them in three ways:

**1. Natural Language (Automatic)**
```
"Find all React components that use DataStore subscriptions"
```
→ Copilot recognizes this as semantic search, uses the skill automatically

**2. Explicit Skill Name**
```
"Use the mock-data-validator skill to check ChatSidebar story data"
```
→ Copilot reads `.github/skills/mock-data-validator/SKILL.md` and follows instructions

**3. Via Workflow Prompts**
```
"Follow i18n-translation-workflow to translate auth namespace to Japanese"
```
→ Workflow orchestrates multiple skills: extract-code-documentation, multi-model-ai-translation

### Examples

| Task | How to Invoke |
|------|---------------|
| Translate i18n files | `"Translate locales to Japanese using fake mode"` |
| Validate Storybook | `"Run storybook validation on Editor3 stories"` |
| Find authentication code | `"Search for components handling Cognito auth"` |
| Create Component2 | `"Create ChatSidebar2 from ChatSidebar"` |
| Check mock data types | `"Validate mock data for all stories"` |

### Requirements

Enable skills in VS Code settings:
```json
{
  "chat.useAgentSkills": true
}
```

## Documentation

- [Agent Skills Standard](https://agentskills.io)
