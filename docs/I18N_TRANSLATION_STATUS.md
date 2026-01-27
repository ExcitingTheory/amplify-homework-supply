# i18n Translation Implementation Status

**Last Updated**: 2026-01-27  
**Overall Status**: 🟡 In Progress  
**Phase**: 1 - Filtering False Positives & Creating Namespace Structure

## Problem Statement

The codebase has 785 locations where literal strings need to be replaced with i18n translation tags `{t('namespace.key')}` following the react-i18next pattern. This implementation follows the TypeScript Feature Workflow to ensure comprehensive, validated translation coverage.

## Implementation Approach

### Namespace Strategy

Create path-based namespaces following existing pattern:
- `pages.*` - For pages/ directory files (e.g., pages.grades, pages.index, pages.privacy)
- `components.*` - For src/components/ files (e.g., components.chat, components.editor)
- Reuse existing namespaces where appropriate: common, auth, units, grades, chat, editor

### Phase Breakdown

**Phase 1**: Filter false positives, organize by namespace  
**Phase 2**: Create new namespace JSON files  
**Phase 3**: Add translation keys to namespace files  
**Phase 4**: Add t() calls to pages  
**Phase 5**: Add t() calls to components  
**Phase 6**: TypeScript validation after each change  
**Phase 7**: Final validation and testing  

## False Positive Filter Results

### ❌ Do NOT Translate

**CSS/Theme Strings** (118 instances filtered out):
- Color values: `'success.main'`, `'info.main'`, `'warning.main'`, `'error.main'`
- CSS properties: `'grayscale(1)'`, `display="flex"`, `direction="row"`
- Theme keys: Material-UI color references

**Technical Attributes** (42 instances filtered out):
- HTML attributes: `lang="en"`, `aria-*`, `data-*`
- Border styles: `border="solid"`, `borderBottom="solid"`
- Owner/identity placeholders in test/mock files

**Total False Positives**: 160 instances (20% of original 785)

### ✅ Must Translate

**Remaining**: 625 actual user-facing strings requiring translation

Organized by priority:

#### High Priority (280 strings)
- Button labels (Save, Cancel, Delete, Edit, etc.)
- Page headings (Grades, Units, Profile, etc.)
- Form field labels
- Dialog titles
- Error messages

#### Medium Priority (245 strings)
- Helper text
- Tooltips
- Empty state messages
- Success messages
- Instructions

#### Low Priority (100 strings)
- Debug messages (console.log - may not need translation)
- Developer-facing text
- Meta descriptions

## Namespace Mapping

### Existing Namespaces (Keep)
- `/public/locales/en/common.json` ✅ (extensive)
- `/public/locales/en/auth.json` ✅
- `/public/locales/en/units.json` ✅
- `/public/locales/en/grades.json` ✅
- `/public/locales/en/chat.json` ✅
- `/public/locales/en/editor.json` ✅
- `/public/locales/en/errors.json` ✅
- `/public/locales/en/stories.json` ✅

### New Namespaces (Create)
- `pages.json` - For page-specific strings not in common
- `components.json` - For component-specific strings not covered
- `profile.json` - Profile page strings
- `privacy.json` - Privacy policy strings
- `sections.json` - Section management strings
- `workbook.json` - Workbook-specific strings

## Detailed TODO Breakdown

### Phase 1: Organization ✅ COMPLETE

- [x] Analyze I18N_TRANSLATION_TODOS.md
- [x] Filter CSS/theme strings
- [x] Filter technical attributes
- [x] Categorize by priority
- [x] Map to namespaces
- [x] Create this status document

### Phase 2: Create Namespace Files ✅ COMPLETE

#### Phase2_Task1: Create pages.json ✅
- [x] Created `/public/locales/en/pages.json` (7.0K)
- [x] Organized by page sections: grades, index, privacy, profile, sections, sectionDetail, units, unitDetail, workbook
- [x] Validation: JSON syntax valid

#### Phase2_Task2: Create components.json ✅
- [x] Created `/public/locales/en/components.json` (9.2K)
- [x] Organized by component names with nested structure
- [x] Covers 80+ components from I18N_TRANSLATION_TODOS.md
- [x] Validation: JSON syntax valid

#### Decision: Merged into pages.json and components.json
- ✅ profile.json → Merged into pages.json under "profile" key
- ✅ privacy.json → Merged into pages.json under "privacy" key  
- ✅ sections.json → Merged into pages.json under "sections" and "sectionDetail" keys
- ✅ workbook.json → Merged into pages.json under "workbook" key

**Rationale**: Fewer namespace files = simpler imports, better organization by feature rather than arbitrary file splits

### Phase 3: Populate Namespace Files ❌ NOT STARTED

Extract strings from I18N_TRANSLATION_TODOS.md and organize into JSON structure.

### Phase 4: Implement Pages Translation ❌ NOT STARTED

For each page file:
1. Import useTranslation hook
2. Add namespace to hook: `const { t } = useTranslation('pages')`
3. Replace literal strings with t() calls
4. Run `tsc --noEmit` to verify
5. Test rendering

#### Phase4_Task1: pages/grades.js
- [ ] Import useTranslation
- [ ] Replace 7 strings
- [ ] Run tsc --noEmit
- [ ] Verify changes

#### Phase4_Task2-9: Remaining pages
- [ ] pages/index.js (28 strings)
- [ ] pages/privacy.js (54 strings)
- [ ] pages/profile.js (20 strings)
- [ ] pages/section/[id].js (31 strings)
- [ ] pages/sections.js (7 strings)
- [ ] pages/unit/[id].js (1 string)
- [ ] pages/units.js (17 strings)
- [ ] pages/workbook/[id].js (4 strings)

### Phase 5: Implement Components Translation ❌ NOT STARTED

#### Phase5_Task1: High-impact components first
- [ ] src/components/ChatSidebar.js (52 strings)
- [ ] src/components/Editor3/components/FileManager2.js (71+ strings)

#### Phase5_Task2-N: Remaining components
[See I18N_TRANSLATION_TODOS.md for full list - 80+ component files]

### Phase 6: Validation ❌ NOT STARTED

**After Each File Change**:
```bash
# MANDATORY: Run TypeScript compilation
tsc --noEmit --project tsconfig.json

# If errors, STOP and fix before proceeding
```

### Phase 7: Final Validation ❌ NOT STARTED

- [ ] Run full test suite: `npm test`
- [ ] Test language switching in UI
- [ ] Verify all translations render correctly
- [ ] Check for missing translation keys (should show key name if missing)
- [ ] Run i18n lint: `npm run lint:translate:report`
- [ ] Update ONBOARDING docs with i18n usage patterns

## Implementation Status by File

### Pages (1/10 complete)

**Progress**: 7 of 169 strings completed (4%)

| File | Strings | Status | Notes |
|------|---------|--------|-------|
| pages/_document.js | 1 | ❌ Not Started | lang attribute - may not need translation |
| pages/grades.js | 7 | ✅ Complete | Implemented with t('pages:grades.*') |
| pages/index.js | 28 | ❌ Not Started | High priority - main dashboard |
| pages/privacy.js | 54 | ❌ Not Started | Legal text - needs careful translation |
| pages/profile.js | 20 | ❌ Not Started | |
| pages/section/[id].js | 31 | ❌ Not Started | |
| pages/sections.js | 7 | ❌ Not Started | |
| pages/unit/[id].js | 1 | ❌ Not Started | |
| pages/units.js | 17 | ❌ Not Started | |
| pages/workbook/[id].js | 4 | ❌ Not Started | |

### Components (0/80+ complete)

Top priority components:
| Component | Strings | Status | Priority |
|-----------|---------|--------|----------|
| ChatSidebar.js | 52 | ❌ Not Started | HIGH |
| FileManager2.js | 71+ | ❌ Not Started | HIGH |
| RecordingStudio3.jsx | 16 | ❌ Not Started | MEDIUM |
| QuestionsReview2.tsx | 17 | ❌ Not Started | MEDIUM |
| VocabularyReview2.tsx | 17 | ❌ Not Started | MEDIUM |

[See I18N_TRANSLATION_TODOS.md for complete list of 80+ components]

## Testing Strategy

### Unit Tests
- [ ] Test that t() returns expected English strings
- [ ] Test that missing keys show key name (not blank)
- [ ] Test namespace loading

### Integration Tests
- [ ] Test language switching (EN → JA → ZH)
- [ ] Test that all pages render without errors
- [ ] Test that forms still submit correctly

### E2E Tests  
- [ ] Navigate through all pages in different languages
- [ ] Verify tooltips and helper text display correctly
- [ ] Test accessibility with screen readers

## Risks & Mitigations

### Risk: Breaking existing functionality
**Mitigation**: 
- TypeScript validation after each change (MANDATORY)
- Run tests frequently
- Use git branches for each phase

### Risk: Missing translations
**Mitigation**:
- i18next configured to show key name if translation missing
- Lint check: `npm run lint:translate:report`
- Manual QA of all pages

### Risk: Incorrect namespace usage
**Mitigation**:
- Document namespace conventions in this file
- Code review before merging
- Storybook stories to verify components

## Related Documentation

- [I18N_TRANSLATION_TODOS.md](../I18N_TRANSLATION_TODOS.md) - Original audit report
- [TypeScript Feature Workflow](.github/prompts/typescript-feature-workflow.prompt.md) - Process being followed
- [package.json](../package.json) - i18n dependencies and lint script
- [public/locales/](../public/locales/) - Translation files

## Verification Commands

```bash
# Check TypeScript compilation
tsc --noEmit --project tsconfig.json

# Run i18n lint
npm run lint:translate:report

# Find files still using literal strings (after implementation)
grep -r "Grades</h1>" pages/ src/

# Test language switching
npm run dev
# Navigate to http://localhost:3000 and test language selector
```

## Next Steps

1. ✅ DONE: Create this status document with false positive filter results
2. ⏭️ NEXT: Create Phase 2 namespace files (pages.json, components.json, etc.)
3. Then: Populate namespace files with translation keys
4. Then: Implement pages translation (Phase 4)
5. Then: Implement components translation (Phase 5)
6. Finally: Comprehensive validation (Phase 6-7)

---

**Notes**:
- Following TypeScript Feature Workflow: `tsc --noEmit` MANDATORY after every file change
- Using #todo format for tracking individual translation tag additions
- Path-based namespaces align with existing codebase structure
- 625 actual strings to translate (after filtering 160 false positives)
