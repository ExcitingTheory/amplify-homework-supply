# Agent Skills

GitHub Copilot Agent Skills for the Homework Supply project.

**📖 [Workflows & Skills Integration Guide](../WORKFLOWS_AND_SKILLS_GUIDE.md)** - Learn how skills work with workflow prompts

## Available Skills

### [mock-data-validator](./mock-data-validator/)
Validates Storybook mock data structures match component TypeScript prop types.

**Use when**: Creating stories, updating component props, debugging rendering issues

### [semantic-file-search](./semantic-file-search/)
Natural language file discovery with relevance ranking and snippet extraction.

**Use when**: Searching for components, patterns, or implementations without knowing exact paths

### [storybook-validation](./storybook-validation/)
Autonomous validation of all Storybook stories, mock data, and rendering.

**Use when**: Testing Storybook, validating all stories, before releases

### [component-versioning](./component-versioning/)
Automates creation of versioned component copies (Component → Component2) with updated imports, exports, and feature parity checklists.

**Use when**: Creating v2 of existing components, refactoring major features, migrating to new patterns

### [feature-development-cycle](./feature-development-cycle/)
The default background process for ALL development work. Automatically activates whenever planning, building, or implementing anything. Drives spec → testing plan → TODO → implementation → audit loops until verified complete.

**Use when**: Always. This is the background process for any planning, feature work, implementation, or code changes. No explicit invocation needed — if work is happening, this cycle is running.

### [multi-model-ai-translation](./multi-model-ai-translation/)
Translates content using multiple AI models in parallel (Claude, GPT-4o, Gemma) with consensus analysis, reverse translation verification, and cryptographic proof generation.

**Use when**: Translating i18n files, validating translation quality, generating auditable translations

### [extract-code-documentation](./extract-code-documentation/)
Extracts JSDoc/TSDoc docblocks from source code, maps components to descriptions, and enriches data with metadata from code annotations.

**Use when**: Generating documentation, enriching translation metadata, auditing component documentation coverage

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

See [Workflows & Skills Integration Guide](../WORKFLOWS_AND_SKILLS_GUIDE.md) for detailed usage patterns.

### Requirements

Enable skills in VS Code settings:
```json
{
  "chat.useAgentSkills": true
}
```

## Documentation

- [Agent Skills Standard](https://agentskills.io)
- [Agent Skills Architecture](../../docs/AGENT_SKILLS_ARCHITECTURE.md)
- [Implementation Guide](../../docs/AGENT_SKILLS_IMPLEMENTATION.md)
