User: 
Using the documentation below make a planfor how to fix or improve then test each one of the following skills in [.github/skills] component-versioning extract-code-documentation mock-data-validator multi-model-ai-translation semantic-file-search storybook-validation


> ## Documentation Index
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Specification

> The complete format specification for Agent Skills.

This document defines the Agent Skills format.

## Directory structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
└── SKILL.md          # Required
```

<Tip>
  You can optionally include [additional directories](#optional-directories) such as `scripts/`, `references/`, and `assets/` to support your skill.
</Tip>

## SKILL.md format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter (required)

```yaml  theme={null}
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

With optional fields:

```yaml  theme={null}
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

| Field           | Required | Constraints                                                                                                       |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`          | Yes      | Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen.             |
| `description`   | Yes      | Max 1024 characters. Non-empty. Describes what the skill does and when to use it.                                 |
| `license`       | No       | License name or reference to a bundled license file.                                                              |
| `compatibility` | No       | Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.). |
| `metadata`      | No       | Arbitrary key-value mapping for additional metadata.                                                              |
| `allowed-tools` | No       | Space-delimited list of pre-approved tools the skill may use. (Experimental)                                      |

#### `name` field

The required `name` field:

* Must be 1-64 characters
* May only contain unicode lowercase alphanumeric characters and hyphens (`a-z` and `-`)
* Must not start or end with `-`
* Must not contain consecutive hyphens (`--`)
* Must match the parent directory name

Valid examples:

```yaml  theme={null}
name: pdf-processing
```

```yaml  theme={null}
name: data-analysis
```

```yaml  theme={null}
name: code-review
```

Invalid examples:

```yaml  theme={null}
name: PDF-Processing  # uppercase not allowed
```

```yaml  theme={null}
name: -pdf  # cannot start with hyphen
```

```yaml  theme={null}
name: pdf--processing  # consecutive hyphens not allowed
```

#### `description` field

The required `description` field:

* Must be 1-1024 characters
* Should describe both what the skill does and when to use it
* Should include specific keywords that help agents identify relevant tasks

Good example:

```yaml  theme={null}
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

Poor example:

```yaml  theme={null}
description: Helps with PDFs.
```

#### `license` field

The optional `license` field:

* Specifies the license applied to the skill
* We recommend keeping it short (either the name of a license or the name of a bundled license file)

Example:

```yaml  theme={null}
license: Proprietary. LICENSE.txt has complete terms
```

#### `compatibility` field

The optional `compatibility` field:

* Must be 1-500 characters if provided
* Should only be included if your skill has specific environment requirements
* Can indicate intended product, required system packages, network access needs, etc.

Examples:

```yaml  theme={null}
compatibility: Designed for Claude Code (or similar products)
```

```yaml  theme={null}
compatibility: Requires git, docker, jq, and access to the internet
```

<Note>
  Most skills do not need the `compatibility` field.
</Note>

#### `metadata` field

The optional `metadata` field:

* A map from string keys to string values
* Clients can use this to store additional properties not defined by the Agent Skills spec
* We recommend making your key names reasonably unique to avoid accidental conflicts

Example:

```yaml  theme={null}
metadata:
  author: example-org
  version: "1.0"
```

#### `allowed-tools` field

The optional `allowed-tools` field:

* A space-delimited list of tools that are pre-approved to run
* Experimental. Support for this field may vary between agent implementations

Example:

```yaml  theme={null}
allowed-tools: Bash(git:*) Bash(jq:*) Read
```

### Body content

The Markdown body after the frontmatter contains the skill instructions. There are no format restrictions. Write whatever helps agents perform the task effectively.

Recommended sections:

* Step-by-step instructions
* Examples of inputs and outputs
* Common edge cases

Note that the agent will load this entire file once it's decided to activate a skill. Consider splitting longer `SKILL.md` content into referenced files.

## Optional directories

### scripts/

Contains executable code that agents can run. Scripts should:

* Be self-contained or clearly document dependencies
* Include helpful error messages
* Handle edge cases gracefully

Supported languages depend on the agent implementation. Common options include Python, Bash, and JavaScript.

### references/

Contains additional documentation that agents can read when needed:

* `REFERENCE.md` - Detailed technical reference
* `FORMS.md` - Form templates or structured data formats
* Domain-specific files (`finance.md`, `legal.md`, etc.)

Keep individual [reference files](#file-references) focused. Agents load these on demand, so smaller files mean less use of context.

### assets/

Contains static resources:

* Templates (document templates, configuration templates)
* Images (diagrams, examples)
* Data files (lookup tables, schemas)

## Progressive disclosure

Skills should be structured for efficient use of context:

1. **Metadata** (\~100 tokens): The `name` and `description` fields are loaded at startup for all skills
2. **Instructions** (\< 5000 tokens recommended): The full `SKILL.md` body is loaded when the skill is activated
3. **Resources** (as needed): Files (e.g. those in `scripts/`, `references/`, or `assets/`) are loaded only when required

Keep your main `SKILL.md` under 500 lines. Move detailed reference material to separate files.

## File references

When referencing other files in your skill, use relative paths from the skill root:

```markdown  theme={null}
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains.

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate your skills:

```bash  theme={null}
skills-ref validate ./my-skill
```

This checks that your `SKILL.md` frontmatter is valid and follows all naming conventions.


GitHub Copilot: I'll analyze each skill in skills against the Agent Skills specification and create a comprehensive plan for improvements and testing.

Let me first examine the current state of each skill:      

Read skill [component-versioning](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/component-versioning/SKILL.md?vscodeLinkType%3Dskill)

Read skill [extract-code-documentation](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/extract-code-documentation/SKILL.md?vscodeLinkType%3Dskill)

Read skill [mock-data-validator](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/mock-data-validator/SKILL.md?vscodeLinkType%3Dskill)

Read skill [multi-model-ai-translation](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/multi-model-ai-translation/SKILL.md?vscodeLinkType%3Dskill)

Read skill [semantic-file-search](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/semantic-file-search/SKILL.md?vscodeLinkType%3Dskill)

Read skill [storybook-validation](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/storybook-validation/SKILL.md?vscodeLinkType%3Dskill)

Now let me check the directory structure and supporting files for each skill:      

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/component-versioning)

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/extract-code-documentation)

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/mock-data-validator)

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/multi-model-ai-translation)

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/semantic-file-search)

Read [](file:///Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply/.github/skills/storybook-validation)

Based on my analysis of the Agent Skills specification and your current skills, here's a comprehensive plan:

## **Agent Skills Improvement & Testing Plan**

### **Overall Issues Found**

All skills have these common issues:
1. ❌ **No validation** - Skills haven't been validated with `skills-ref` tool
2. ⚠️ **Scripts in wrong location** - Supporting scripts are in skill root instead of scripts subdirectory
3. ⚠️ **Missing metadata** - No `author`, `version`, or `license` fields in frontmatter
4. ⚠️ **Mixed directory structure** - Not following progressive disclosure pattern

---

## **Skill-by-Skill Analysis**

### **1. component-versioning** ✅ GOOD (341 lines)

**Status**: Mostly compliant, needs reorganization

**Issues**:
- Scripts in root: `component-versioning.ts`, `test-component-versioning-skill.ts`
- Test fixtures in `__test-fixtures__/` (should be `assets/fixtures/`)
- Long examples section could be moved to `references/EXAMPLES.md`

**Improvements**:
```
component-versioning/
├── SKILL.md (reduce to ~200 lines)
├── scripts/
│   ├── component-versioning.ts (moved from root)
│   └── test-component-versioning-skill.ts (moved from root)
├── references/
│   ├── EXAMPLES.md (move detailed examples here)
│   └── API_REFERENCE.md (input/output schemas)
├── assets/
│   └── fixtures/ (move __test-fixtures__ here)
└── component-versioning.test.ts
```

**Frontmatter additions**:
```yaml
---
name: component-versioning
description: Automates creation of versioned component copies (Component → Component2) with updated imports, exports, and feature parity checklists
license: MIT
metadata:
  author: ExcitingTheory
  version: "1.0.0"
  status: "Phase 1 MVP"
---
```

---

### **2. extract-code-documentation** ✅ GOOD (461 lines)

**Status**: Good structure, approaching line limit

**Issues**:
- Scripts in root: `extract-component-docblocks.ts`, `add-metadata-all-namespaces.ts`, `add-translation-metadata.ts`, `generate-all-metadata.ts`, `test-docblock-extraction.ts`
- Detailed output formats could be in references

**Improvements**:
```
extract-code-documentation/
├── SKILL.md (reduce to ~250 lines)
├── scripts/
│   ├── extract-component-docblocks.ts
│   ├── add-metadata-all-namespaces.ts
│   ├── add-translation-metadata.ts
│   ├── generate-all-metadata.ts
│   └── test-docblock-extraction.ts
├── references/
│   ├── OUTPUT_FORMATS.md (detailed format examples)
│   ├── INTEGRATION_PATTERNS.md (usage with other skills)
│   └── DOCBLOCK_SPEC.md (JSDoc/TSDoc requirements)
```

**Frontmatter additions**:
```yaml
metadata:
  author: ExcitingTheory
  version: "1.0.0"
  integration: "i18n-translation-workflow"
```

---

### **3. mock-data-validator** ✅ EXCELLENT (147 lines)

**Status**: Perfect length, just needs reorganization

**Issues**:
- Scripts in root: `mock-data-validator.ts`, `validate-component-mocks.ts`
- Could add more detailed examples to references

**Improvements**:
```
mock-data-validator/
├── SKILL.md (~150 lines - keep as is)
├── scripts/
│   ├── mock-data-validator.ts
│   └── validate-component-mocks.ts
├── references/
│   ├── MESSAGE_FORMAT_SPEC.md (ChatSidebar message.parts documentation)
│   └── COMMON_ISSUES.md (troubleshooting guide)
└── mock-data-validator.test.ts
```

**Frontmatter additions**:
```yaml
metadata:
  author: ExcitingTheory
  version: "1.0.0"
  related-skills: ["storybook-validation", "semantic-file-search"]
```

---

### **4. multi-model-ai-translation** ❌ NEEDS WORK (713 lines)

**Status**: **Exceeds 500 line recommendation** by 42%

**Critical Issues**:
- **713 lines** - Must reduce to <500
- Scripts in root
- Too much detail in main SKILL.md

**Improvements** (HIGH PRIORITY):
```
multi-model-ai-translation/
├── SKILL.md (reduce to ~300 lines)
│   ├── Keep: What/When/How It Works/Quick Examples
│   └── Move out: Detailed schemas, long examples, comparison tables
├── scripts/
│   ├── translate-with-proof.ts
│   ├── verify-translations.ts
│   ├── reverse-translate.ts
│   ├── generate-translation-report.ts
│   └── run-full-translation.sh
├── references/
│   ├── API_REFERENCE.md (full schemas, 200+ lines)
│   ├── EXAMPLES.md (detailed examples with all 3 scenarios)
│   ├── MODELS_COMPARISON.md (Claude vs GPT vs Gemini details)
│   ├── CONSENSUS_ALGORITHM.md (how consensus works)
│   ├── CRYPTOGRAPHIC_PROOF.md (fingerprint verification details)
│   └── TROUBLESHOOTING.md (error handling, rate limits)
└── assets/
    └── example-proofs/ (sample proof documents)
```

**Content to move FROM SKILL.md TO references/**:
- Full TypeScript interfaces (100+ lines) → `API_REFERENCE.md`
- Three detailed examples → `EXAMPLES.md`
- Translation models comparison table → `MODELS_COMPARISON.md`
- Consensus resolution strategy details → `CONSENSUS_ALGORITHM.md`
- Cryptographic proof details → `CRYPTOGRAPHIC_PROOF.md`
- Performance metrics → `PERFORMANCE.md`

**Revised SKILL.md structure** (~300 lines):
```markdown
# Multi-Model AI Translation

[Brief 2-3 sentence intro]

## When to Use
[Keep existing list]

## How It Works
[Keep 4-phase workflow summary]
[See references/CONSENSUS_ALGORITHM.md for details]

## Quick Start
[One simple example]
[See references/EXAMPLES.md for detailed scenarios]

## Input Schema
[Brief schema with link to references/API_REFERENCE.md]

## Output Schema
[Brief schema with link to references/API_REFERENCE.md]

## Translation Modes
- Fake Mode: [1 sentence]
- Provable Mode: [1 sentence]
[See references/MODELS_COMPARISON.md for model details]

## Implementation
[Point to scripts/]

## Related Skills
[Keep existing list]
```

---

### **5. semantic-file-search** ✅ GREAT (177 lines)

**Status**: Good length, already has reference doc!

**Issues**:
- Scripts in root: `semantic-file-search.ts`
- Already has `SEMANTIC_FILE_SEARCH.md` reference (good!)

**Improvements**:
```
semantic-file-search/
├── SKILL.md (~180 lines - keep mostly as is)
├── scripts/
│   └── semantic-file-search.ts
├── references/
│   ├── REFERENCE.md (rename from SEMANTIC_FILE_SEARCH.md)
│   ├── QUERY_EXPANSION_RULES.md (expansion patterns)
│   └── RELEVANCE_ALGORITHM.md (scoring details)
└── semantic-file-search.test.ts
```

**Frontmatter additions**:
```yaml
metadata:
  author: ExcitingTheory
  version: "1.0.0"
  search-strategies: ["semantic", "grep", "filename"]
```

---

### **6. storybook-validation** ✅ GOOD (465 lines)

**Status**: Best organized, approaching limit, already has good structure!

**Current Structure** (already good!):
- ✅ Has scripts directory
- ✅ Has `schemas/` directory  
- ✅ Has test directory
- ✅ Has package.json for dependencies

**Issues**:
- Still could reduce SKILL.md from 465 → ~350 lines
- Move verbose content to references

**Improvements**:
```
storybook-validation/
├── SKILL.md (reduce to ~350 lines)
├── scripts/ (✅ already exists)
│   ├── generate-story-inventory.ts
│   └── validate-component-mocks.ts
├── schemas/ (✅ already exists)
├── test/ (✅ already exists)
├── references/
│   ├── PHASE_DETAILS.md (move detailed phase descriptions)
│   ├── COMMON_ISSUES.md (move troubleshooting section)
│   └── INTEGRATION_GUIDE.md (CI/CD examples)
├── package.json (✅ already exists)
└── storybook-validation.test.ts
```

**Content to move to references/**:
- Detailed phase descriptions → `PHASE_DETAILS.md`
- Common issues section → `COMMON_ISSUES.md`  
- CI/CD integration examples → `INTEGRATION_GUIDE.md`

---

## **Testing Plan**

### **Phase 1: Setup Validation Tool**

```bash
# Install skills-ref validator (if available)
npm install -g @agentskills/skills-ref

# OR use npx
npx @agentskills/skills-ref --version
```

### **Phase 2: Validate Each Skill**

```bash
cd .github/skills

# Validate frontmatter and structure
for skill in */; do
  echo "Validating $skill..."
  npx @agentskills/skills-ref validate "$skill"
done
```

### **Phase 3: Test Functional Behavior**

```bash
# 1. component-versioning
npx tsx .github/skills/component-versioning/test-component-versioning-skill.ts

# 2. extract-code-documentation  
npx tsx .github/skills/extract-code-documentation/test-docblock-extraction.ts

# 3. mock-data-validator
npm test -- mock-data-validator.test.ts

# 4. multi-model-ai-translation
# Test fake mode (free)
npx tsx .github/skills/multi-model-ai-translation/translate-with-proof.ts --mode=fake

# 5. semantic-file-search
npm test -- semantic-file-search.test.ts

# 6. storybook-validation
npm test -- storybook-validation.test.ts
npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts
```

### **Phase 4: Integration Testing**

Test each skill via Copilot Chat:

```
@workspace /Use component-versioning to create ChatSidebar3 from ChatSidebar2
@workspace /Use extract-code-documentation to find all docblocks
@workspace /Use mock-data-validator to validate ChatSidebar mock data
@workspace /Use semantic-file-search to find DataStore subscriptions
@workspace /Use storybook-validation to run Phase 1-3
```

---

## **Implementation Checklist**

### **Priority 1: Critical (Do First)**

- [ ] **multi-model-ai-translation**: Reduce from 713 → 300 lines
  - [ ] Create `references/` directory
  - [ ] Move schemas to `references/API_REFERENCE.md`
  - [ ] Move examples to `references/EXAMPLES.md`
  - [ ] Move comparison tables to `references/MODELS_COMPARISON.md`
  - [ ] Update SKILL.md with references to new docs

### **Priority 2: Structure (All Skills)**

- [ ] Create scripts directory in each skill
- [ ] Move `.ts` implementation files to scripts
- [ ] Create `references/` directory where needed
- [ ] Add metadata to frontmatter (author, version, license)

### **Priority 3: Validation**

- [ ] Install/setup skills-ref validator
- [ ] Run validation on all skills
- [ ] Fix any validation errors
- [ ] Document validation status

### **Priority 4: Testing**

- [ ] Run unit tests for each skill
- [ ] Test via Copilot Chat integration
- [ ] Verify all scripts work from new locations
- [ ] Update relative paths in code

### **Priority 5: Documentation**

- [ ] Create `references/` docs for each skill
- [ ] Update skill descriptions in copilot-instructions.md
- [ ] Create `docs/SKILLS_TESTING_GUIDE.md`
- [ ] Add validation badge to each README

---

## **Timeline Estimate**

| Task | Time | Priority |
|------|------|----------|
| multi-model-ai-translation refactor | 2-3 hours | P0 |
| Reorganize directory structures | 1-2 hours | P1 |
| Add frontmatter metadata | 30 min | P1 |
| Create reference docs | 2-3 hours | P2 |
| Setup validation tool | 30 min | P2 |
| Run validation & fix errors | 1 hour | P2 |
| Functional testing | 1-2 hours | P3 |
| Integration testing | 1 hour | P3 |
| Documentation updates | 1 hour | P3 |

**Total: 9-13 hours**

---

## **Success Criteria**

- ✅ All SKILL.md files < 500 lines 
- ✅ All skills pass `skills-ref validate`
- ✅ All scripts in scripts subdirectory
- ✅ Progressive disclosure pattern followed
- ✅ All functional tests pass
- ✅ All skills work via Copilot Chat
- ✅ Documentation complete

---

Would you like me to:
1. **Start with Priority 1** (fix multi-model-ai-translation)?
2. **Create the directory structures** for all skills?
3. **Generate the reference documentation** files?
4. **Run validation tests** on current state first?