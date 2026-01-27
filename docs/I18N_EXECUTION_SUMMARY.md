# 🚀 i18n Translation Implementation - Ready to Execute

**Status**: ✅ **ALL DELEGATION FILES CREATED - READY TO SPAWN AGENTS**  
**Created**: 2026-01-27  
**Workload**: 625 strings across 82 files  
**Strategy**: 5 parallel agents working simultaneously

---

## 📋 Quick Start for Project Manager

### Step 1: Spawn 5 Parallel Agents

Create 5 independent subagents and give each their instruction file:

| Agent | Instruction File | Focus | Files | Est. Time |
|-------|-----------------|-------|-------|-----------|
| **Agent 1** | `docs/I18N_AGENT_1_INSTRUCTIONS.md` | Pages namespace | 9 | 2-3h |
| **Agent 2** | `docs/I18N_AGENT_2_INSTRUCTIONS.md` | Chat/AI components | 10 | 2-3h |
| **Agent 3** | `docs/I18N_AGENT_3_INSTRUCTIONS.md` | Editor3 core | 20 | 3-4h |
| **Agent 4** | `docs/I18N_AGENT_4_INSTRUCTIONS.md` | Editor3 plugins | 22 | 2-3h |
| **Agent 5** | `docs/I18N_AGENT_5_INSTRUCTIONS.md` | Misc components | 18 | 2h |

### Step 2: Each Agent Executes

Each agent will:
1. Create their branch from the instruction file
2. Work through their file list sequentially
3. Commit after each file with descriptive messages
4. Update `docs/I18N_TRANSLATION_STATUS.md` after each file
5. Push their branch when complete

### Step 3: Merge Strategy

**Sequential merging** to avoid conflicts:

```bash
# 1. Agent 1 merges first (pages namespace)
git checkout main
git merge i18n/pages-namespace

# 2. Agents 2-5 merge in any order (components namespace)
git merge i18n/components-chat
git merge i18n/components-editor3-core
git merge i18n/components-editor3-plugins
git merge i18n/components-misc

# 3. Final validation
npm run lint:translate:report
# Should show 0 warnings for completed files
```

### Step 4: Final Validation

After all merges:
- [ ] Run TypeScript: `tsc --noEmit --project tsconfig.json`
- [ ] Run tests: `npm test`
- [ ] Test language switching in UI
- [ ] Check for missing keys: `npm run lint:translate:report`

---

## 📊 Workload Distribution

### Total Workload
- **Files**: 82 files
- **Strings**: ~625 translatable strings
- **Namespaces**: 2 (`pages`, `components`)

### Per Agent
| Agent | Files | Strings | % of Total |
|-------|-------|---------|------------|
| Agent 1 | 9 | ~169 | 27% |
| Agent 2 | 10 | ~100 | 16% |
| Agent 3 | 20 | ~150 | 24% |
| Agent 4 | 22 | ~120 | 19% |
| Agent 5 | 18 | ~85 | 14% |

---

## ✅ Completed Setup

### Phase 1: Planning ✅
- [x] Analyzed 785 warnings from ESLint
- [x] Filtered 160 false positives (CSS, technical attributes)
- [x] Identified 625 actual translatable strings
- [x] Created namespace strategy

### Phase 2: Namespace Files ✅
- [x] `public/locales/en/pages.json` (7.0K)
- [x] `public/locales/en/components.json` (9.2K)
- [x] Validated JSON syntax

### Phase 3: Delegation Structure ✅
- [x] `docs/I18N_DELEGATION_PLAN.md` - Master coordination plan
- [x] `docs/I18N_AGENT_1_INSTRUCTIONS.md` - Pages (9 files)
- [x] `docs/I18N_AGENT_2_INSTRUCTIONS.md` - Chat/AI (10 files)
- [x] `docs/I18N_AGENT_3_INSTRUCTIONS.md` - Editor3 core (20 files)
- [x] `docs/I18N_AGENT_4_INSTRUCTIONS.md` - Editor3 plugins (22 files)
- [x] `docs/I18N_AGENT_5_INSTRUCTIONS.md` - Misc components (18 files)

### Phase 4: Example Implementation ✅
- [x] `pages/grades.js` - Completed as reference example

---

## 🎯 Success Metrics

### Definition of Done
- [ ] All 82 files have translation tags
- [ ] All `t()` calls reference valid keys
- [ ] No literal user-facing strings remain
- [ ] TypeScript compiles with 0 errors
- [ ] All tests pass
- [ ] Language switching works in UI
- [ ] Documentation updated

### Quality Gates
- Each file must pass before proceeding to next
- TypeScript validation after every change
- Git commits must be descriptive
- Status document must stay updated

---

## 🔍 Reference Documentation

### For All Agents
- **Namespace files**: `public/locales/en/pages.json`, `public/locales/en/components.json`
- **Original audit**: `I18N_TRANSLATION_TODOS.md`
- **Status tracker**: `docs/I18N_TRANSLATION_STATUS.md`
- **Workflow**: `.github/prompts/typescript-feature-workflow.prompt.md`
- **Example completed**: `pages/grades.js` (see git diff)

### Coordination
- **Master plan**: `docs/I18N_DELEGATION_PLAN.md`
- **Merge conflicts**: None expected (different files)
- **Status updates**: Each agent updates status doc after each file

---

## ⚠️ Critical Warnings

### DO NOT Translate
- CSS values: `'success.main'`, `display="flex"`, `border="solid"`
- Technical attributes: `lang="en"`, `aria-*`, `data-*`
- Theme color strings
- Test placeholders

### Special Attention Required
- **ChatSidebar.js** (Agent 2): DO NOT modify `message.parts` parsing logic
- **FileManager2.js** (Agent 3): Largest file (71 strings) - work incrementally

---

## 📈 Timeline

### Sequential Approach (original)
- Total time: 15-20 hours
- Single person working through all files

### Parallel Approach (delegated)
- Total time: 3-4 hours
- 5 agents working simultaneously
- **Speedup: ~5x faster** ⚡

---

## 🎬 Execute Command

To start the parallel implementation:

```bash
# Project manager runs:
echo "Spawning 5 parallel agents for i18n translation implementation..."

# Agent 1: Pages
# Read and execute: docs/I18N_AGENT_1_INSTRUCTIONS.md

# Agent 2: Chat/AI
# Read and execute: docs/I18N_AGENT_2_INSTRUCTIONS.md

# Agent 3: Editor3 Core
# Read and execute: docs/I18N_AGENT_3_INSTRUCTIONS.md

# Agent 4: Editor3 Plugins
# Read and execute: docs/I18N_AGENT_4_INSTRUCTIONS.md

# Agent 5: Misc Components
# Read and execute: docs/I18N_AGENT_5_INSTRUCTIONS.md
```

---

## 📞 Support

If any agent encounters:
- **Ambiguous string**: Document in commit message, continue
- **Missing key**: Add to namespace JSON first, then use
- **Complex component**: Break into smaller commits
- **Merge conflict**: Should not happen (different files), but check with other agents

---

**Status**: 🟢 READY TO EXECUTE  
**Next Action**: Spawn 5 agents and begin parallel implementation  
**Expected Completion**: 3-4 hours from start
