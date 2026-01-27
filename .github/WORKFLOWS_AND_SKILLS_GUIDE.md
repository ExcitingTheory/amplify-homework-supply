# Workflows & Skills Integration Guide

Guide to using GitHub Copilot Agent Skills with workflow prompts in this project.

## Architecture Overview

```
.github/
├── copilot-instructions.md          # Master config - lists all available skills
├── prompts/                          # High-level workflow orchestration
│   ├── i18n-translation-workflow.prompt.md
│   ├── storybook-testing-workflow.prompt.md
│   └── typescript-feature-workflow.prompt.md
└── skills/                           # Reusable, testable utilities
    ├── multi-model-ai-translation/
    │   ├── SKILL.md                 # Detailed instructions for the skill
    │   ├── translate-with-proof.ts  # Implementation
    │   └── *.test.ts                # Tests
    ├── extract-code-documentation/
    ├── storybook-validation/
    ├── semantic-file-search/
    ├── mock-data-validator/
    └── component-versioning/
```

## Relationship Between Workflows and Skills

### Workflows (`.github/prompts/*.prompt.md`)
- **Purpose**: High-level orchestration of complex, multi-step processes
- **Format**: GitHub Copilot prompt files with YAML frontmatter
- **Contains**: Step-by-step instructions, decision trees, user-facing documentation
- **Example**: "Translate all i18n files using 3 AI models, verify consensus, generate report"

### Skills (`.github/skills/*/SKILL.md`)
- **Purpose**: Reusable capabilities that can be invoked by workflows or directly by users
- **Format**: Markdown with YAML frontmatter (GitHub Copilot Agent Skills standard)
- **Contains**: Input/output schemas, detailed implementation steps, usage examples
- **Example**: "Translate text using multiple AI models in parallel with cryptographic proof"

### Key Difference
- **Workflow**: "How to translate all i18n files" (orchestration)
- **Skill**: "How to translate with multiple models" (atomic capability)

## How GitHub Copilot Discovers Skills

### 1. Skills Registry in copilot-instructions.md

When you open this workspace, GitHub Copilot reads `.github/copilot-instructions.md` and sees:

```xml
<skills>
<skill>
<name>multi-model-ai-translation</name>
<description>Translates content using multiple AI models...</description>
<file>/Users/.../amplify-homework-supply/.github/skills/multi-model-ai-translation/SKILL.md</file>
</skill>
<!-- ... 5 more skills ... -->
</skills>
```

This tells Copilot: **"When a task involves multi-model translation, read the SKILL.md file for detailed instructions."**

### 2. Automatic Skill Invocation

When you chat with Copilot, it:
1. Analyzes your request
2. Matches it against available skill descriptions
3. Uses `read_file` to load the full SKILL.md if needed
4. Follows the skill's instructions

**You don't need to manually tell it to read SKILL.md** - it knows from the skills registry.

## Usage Patterns

### Pattern 1: Invoke a Workflow Directly

**User Request:**
```
Translate i18n files to Japanese using provable mode
```

**What Happens:**
1. Copilot recognizes this matches `i18n-translation-workflow.prompt.md`
2. Reads the workflow prompt file
3. Sees steps like "Phase 2: Multi-Model Translation"
4. Realizes it needs the `multi-model-ai-translation` skill
5. Reads `.github/skills/multi-model-ai-translation/SKILL.md`
6. Executes the skill with parameters: `{namespace, source: 'en', target: 'ja', mode: 'provable'}`
7. Continues following the workflow prompt

### Pattern 2: Invoke a Skill Directly

**User Request:**
```
Use the semantic-file-search skill to find all React components that handle authentication
```

**What Happens:**
1. Copilot sees "semantic-file-search skill" mentioned explicitly
2. Reads `.github/skills/semantic-file-search/SKILL.md`
3. Follows the skill's input schema requirements  
4. Executes semantic search with query: "React components authentication"
5. Returns ranked results with snippets

### Pattern 3: Implicit Skill Usage

**User Request:**
```
Find all components that use Lexical editor and show me where they're defined
```

**What Happens:**
1. Copilot analyzes the request (code search task)
2. Checks available skills, sees `semantic-file-search` matches
3. Automatically uses the skill without you mentioning it
4. Returns results

### Pattern 4: Workflow References Skill Explicitly

In a workflow prompt file, you can explicitly direct the agent:

```markdown
### Phase 2: Component Discovery

Use the `semantic-file-search` skill with these parameters:
- query: "Lexical editor components"
- fileTypes: [".tsx", ".jsx"]
- includeSnippets: true

The skill will return ranked results with code snippets.
```

## Practical Examples

### Example 1: i18n Translation Workflow

**Full Workflow Command:**
```
Follow the i18n-translation-workflow to translate the 'auth' namespace to Japanese and Spanish in fake mode
```

**Skills Used:**
1. `extract-code-documentation` - Phase 1 (get component descriptions)
2. `multi-model-ai-translation` - Phase 2 (translate with 3 models)

**Execution Flow:**
```
Workflow Prompt
    ↓
Phase 1: Pre-Translation Analysis
    ↓
[Calls extract-code-documentation skill]
  → Scans src/ for @fileoverview comments
  → Extracts component descriptions
  → Returns docblock data
    ↓
Phase 2: Multi-Model Translation
    ↓
[Calls multi-model-ai-translation skill]
  → Runs translate-with-proof.ts (Claude, GPT, Gemma)
  → Generates consensus translation
  → Returns translation files
    ↓
Phase 3-5: Workflow continues...
```

### Example 2: Component Versioning

**User Request:**
```
Create ChatSidebar2 from ChatSidebar with all imports updated
```

**What Happens:**
1. Copilot sees "create Component2 from Component" pattern
2. Recognizes this matches `component-versioning` skill
3. Reads `.github/skills/component-versioning/SKILL.md`
4. Follows 5-step process:
   - Copy ChatSidebar.tsx → ChatSidebar2.tsx
   - Update export name
   - Find all imports of ChatSidebar
   - Generate feature parity checklist
   - Run tests

### Example 3: Storybook Validation Workflow

**Workflow Command:**
```
Follow storybook-testing-workflow to validate all Editor3 stories
```

**Skills Used:**
- `storybook-validation` - Comprehensive testing
- `mock-data-validator` - Verify mock data matches component props

**Execution Flow:**
```
Workflow Prompt
    ↓
Phase 1: Story Catalog
    ↓
[Calls storybook-validation skill - Phase 1]
  → Discovers all *.stories.tsx files
  → Counts story variants
  → Returns inventory
    ↓
Phase 2-3: Mock Data Validation
    ↓
[Calls mock-data-validator skill]
  → Compares mock data to component TypeScript interfaces
  → Reports type mismatches
    ↓
Phase 4-7: Continue validation phases...
```

## How to Reference Skills in Workflow Prompts

### Method 1: Explicit Skill Call

```markdown
### Step 3: Extract Component Documentation

Use the `extract-code-documentation` skill to scan all components:

**Input:**
- sourceDir: "src/components"
- pattern: "**/*.{ts,tsx,js,jsx}"
- excludeTests: true

**Expected Output:**
- Map of component paths → docblock descriptions
```

### Method 2: Describe the Need (Let Agent Choose)

```markdown
### Step 3: Extract Component Documentation

Scan all component files in `src/` to extract `@fileoverview` docblock comments.
This will provide component descriptions for translation metadata.
```

The agent will recognize this matches `extract-code-documentation` and use it automatically.

### Method 3: Link to SKILL.md

```markdown
### Step 3: Extract Component Documentation

Follow the detailed instructions in [extract-code-documentation SKILL.md](../skills/extract-code-documentation/SKILL.md)
to extract component docblocks for translation metadata.
```

## When to Create a Workflow vs. a Skill

### Create a Workflow When:
- ✅ Multi-step process with decision points
- ✅ Requires orchestrating multiple skills
- ✅ User-facing "how to accomplish X" guide
- ✅ Process has conditional logic based on user input
- ✅ Example: "Translate i18n files" (uses 2+ skills, has 5 phases)

### Create a Skill When:
- ✅ Single, well-defined capability
- ✅ Reusable across multiple workflows
- ✅ Can be tested independently
- ✅ Has clear input/output contract
- ✅ Example: "Translate with multiple models" (atomic, reusable)

### Example Distinction:

**Workflow:** "TypeScript Feature Development Workflow"
- Orchestrates: planning, implementation, testing, documentation
- Uses skills: component-versioning, storybook-validation, mock-data-validator
- Has phases and decision trees

**Skill:** "Component Versioning"
- Does one thing: Copy Component → Component2 with updated imports
- Can be used standalone OR as part of a workflow
- Testable in isolation

## Updating the Skills Registry

When you create a new skill, add it to `.github/copilot-instructions.md`:

```xml
<skill>
<name>your-new-skill</name>
<description>Brief description of what it does (1-2 sentences). Use when...</description>
<file>/absolute/path/to/.github/skills/your-new-skill/SKILL.md</file>
</skill>
```

Then GitHub Copilot will discover it automatically in all future chats.

## Testing Skills

All skills have companion test files:

```bash
# Test a specific skill
npm test -- .github/skills/semantic-file-search

# Test all skills
npm test -- .github/skills

# Run skill tests in watch mode
npm test -- .github/skills --watch
```

**Test Results (Current):**
- ✅ semantic-file-search: 35/35 passing
- ✅ component-versioning: 13/13 passing
- ✅ mock-data-validator: 15/15 passing
- ⚠️ storybook-validation: 38/45 passing (7 unimplemented rendering features)

## Best Practices

### 1. Keep Skills Atomic
❌ Bad: "storybook-and-i18n-validation" (does two unrelated things)
✅ Good: "storybook-validation" + "mock-data-validator" (separate concerns)

### 2. Workflows as Orchestration
✅ Workflow prompts should reference skills, not duplicate their logic
✅ If a step is reusable, extract it to a skill

### 3. Document Skill Invocation in Workflows
```markdown
### Phase 2: Translation

Use the `multi-model-ai-translation` skill:
- namespace: {from user input}
- source: en
- target: {from user input}
- mode: {from --runmode argument}

[Link to skill documentation](../skills/multi-model-ai-translation/SKILL.md)
```

### 4. Always Update Skills Registry
After creating a new skill, immediately update `<skills>` in copilot-instructions.md.

### 5. Test Before Committing
```bash
npm test -- .github/skills/your-new-skill
```

## Common Questions

### Q: Do I need to tell Copilot to "use skill X"?
**A:** No, if the skill is in the registry and your request matches its description, Copilot will use it automatically. But you *can* explicitly name a skill if you want to be certain.

### Q: Can a skill call another skill?
**A:** Yes! Skills can reference other skills in their SKILL.md instructions. Example: `storybook-validation` can invoke `mock-data-validator` for Phase 3.

### Q: Can I use skills outside of workflows?
**A:** Absolutely! Skills are designed to be used standalone. Just ask Copilot: "Use the semantic-file-search skill to find X"

### Q: What if a workflow step doesn't match any skill?
**A:** The agent will execute it using standard tools (read_file, grep_search, etc.). Not everything needs a skill.

### Q: Should scripts be in skills/ or scripts/?
**A:** If the script is tightly coupled to a skill, put it in `.github/skills/{skill-name}/`. If it's a general utility used by multiple workflows, keep it in `scripts/`.

## Summary

| Component | Purpose | Example |
|-----------|---------|---------|
| **copilot-instructions.md** | Skills registry | Lists all 6 available skills |
| **Workflow Prompts** | Orchestration | i18n-translation-workflow.prompt.md |
| **Skills** | Reusable capabilities | multi-model-ai-translation |
| **Implementation Scripts** | Actual code execution | translate-with-proof.ts |
| **Tests** | Validation | *.test.ts files |

**Usage Flow:**
```
User Request → Copilot analyzes → Matches Workflow → Workflow references Skills → Skills execute → Results returned
```

You now have a modular, testable system where complex workflows orchestrate atomic, reusable skills! 🎉
