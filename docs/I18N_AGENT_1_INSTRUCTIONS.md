# Agent 1 Instructions: Pages Namespace Translation

**Agent ID**: Agent 1  
**Assignment**: Pages namespace - all page files  
**Branch**: `i18n/pages-namespace`  
**Estimated Time**: 2-3 hours  
**Priority**: HIGH (includes main dashboard)

## Your Mission

Implement i18n translation tags in all 9 page files using the `pages` namespace.

## Setup

```bash
# 1. Create your branch
cd /path/to/amplify-homework-supply
git checkout -b i18n/pages-namespace

# 2. Verify namespace file exists
cat public/locales/en/pages.json
# Should show: grades, index, privacy, profile, sections, sectionDetail, units, unitDetail, workbook
```

## Files to Complete (in order)

### ✅ DONE: pages/grades.js (7 strings)
Already completed as example. Review the implementation:
```bash
git diff main pages/grades.js
```

### File 1: pages/index.js (28 strings - HIGH PRIORITY)

**Actual translatable strings** (after filtering false positives):
- Line 275: "Homework Supply"
- Line 314: "Assignments"
- Line 404, 615, 744: "View Workbook" (3 instances)
- Line 448: "Completed Assignments"
- Line 662: "My Assignments"
- Line 768: "Edit Unit"
- Line 828: "No Sections Yet"
- Line 844: "Join Section?"
- Line 860: "Create New Section"
- Line 882: "My Sections"
- Line 919, 1029: "Untitled Section" (2 instances)
- Line 922, 1032: "No description" (2 instances)
- Line 947, 1057: "View Section" (2 instances)
- Line 992: "Sections"

**SKIP (false positives)**:
- Lines 492-495: Theme colors ('success.main', 'info.main', 'warning.main', 'error.main')
- Line 631: CSS filter 'grayscale(1)'

**Implementation**:
```javascript
// 1. Add import at top
import { useTranslation } from 'next-i18next';

// 2. In component function
function Index({ signOut, user }) {
    const { t } = useTranslation('pages');
    // ... rest of component

// 3. Replace strings
"Homework Supply" → {t('index.title')}
"Assignments" → {t('index.assignments')}
"View Workbook" → {t('index.viewWorkbook')}
// etc. - see public/locales/en/pages.json for all keys
```

**After completion**:
```bash
git add pages/index.js
git commit -m "i18n: Add translations to pages/index.js (28 strings)"
```

### File 2: pages/units.js (17 strings)

Strings to translate:
- "Units", "Create New", "No Published Units Yet", "Create New Unit"
- "Published Units", "Untitled Unit", "View Workbook", "Edit Unit"
- "My Drafts", "Archived Units"

```javascript
const { t } = useTranslation('pages');
// Use t('units.title'), t('units.createNew'), etc.
```

**After completion**:
```bash
git add pages/units.js
git commit -m "i18n: Add translations to pages/units.js (17 strings)"
```

### File 3: pages/sections.js (7 strings)

Strings: "Sections", "Create New", "No Sections Yet", "Create New Section", etc.

```javascript
const { t } = useTranslation('pages');
// Use t('sections.*')
```

**After completion**:
```bash
git add pages/sections.js
git commit -m "i18n: Add translations to pages/sections.js (7 strings)"
```

### File 4: pages/section/[id].js (31 strings)

Strings: "No featured image set", "Join Code:", "Student View", "Instructor View", "Students", etc.

```javascript
const { t } = useTranslation('pages');
// Use t('sectionDetail.*')
```

**After completion**:
```bash
git add pages/section/\[id\].js
git commit -m "i18n: Add translations to pages/section/[id].js (31 strings)"
```

### File 5: pages/profile.js (20 strings)

Strings: "My Profile", "User Id", "Identity Id", "Cancel", "Update Profile", etc.

```javascript
const { t } = useTranslation('pages');
// Use t('profile.*')
```

**After completion**:
```bash
git add pages/profile.js
git commit -m "i18n: Add translations to pages/profile.js (20 strings)"
```

### File 6: pages/unit/[id].js (1 string)

String: "Loading…"

```javascript
const { t } = useTranslation('pages');
// Use t('unitDetail.loading')
```

**After completion**:
```bash
git add pages/unit/\[id\].js
git commit -m "i18n: Add translations to pages/unit/[id].js (1 string)"
```

### File 7: pages/workbook/[id].js (4 strings)

Strings: "Click the button below to start...", "Start", "Loading…"

```javascript
const { t } = useTranslation('pages');
// Use t('workbook.*')
```

**After completion**:
```bash
git add pages/workbook/\[id\].js
git commit -m "i18n: Add translations to pages/workbook/[id].js (4 strings)"
```

### File 8: pages/privacy.js (54 strings - LEGAL TEXT)

⚠️ **IMPORTANT**: Legal/policy text - translate carefully

All section headings and content paragraphs. Use nested keys from pages.json:

```javascript
const { t } = useTranslation('pages');
// t('privacy.title')
// t('privacy.introduction.heading')
// t('privacy.introduction.content')
// etc.
```

**After completion**:
```bash
git add pages/privacy.js
git commit -m "i18n: Add translations to pages/privacy.js (54 strings)"
```

## Quality Checklist (for each file)

After completing each file:

- [ ] Imported `useTranslation` from 'next-i18next'
- [ ] Added `const { t } = useTranslation('pages');`
- [ ] All literal strings replaced with `t('key')` calls
- [ ] Verified keys exist in `public/locales/en/pages.json`
- [ ] Ran `git diff pages/[filename]` to review changes
- [ ] Skipped CSS values and technical attributes
- [ ] Committed with descriptive message

## Update Status Document

After each file, update `docs/I18N_TRANSLATION_STATUS.md`:

```markdown
| pages/index.js | 28 | ✅ Complete - Agent 1 | Implemented with t('pages:index.*') |
```

## Final Steps

When all files complete:

```bash
# 1. Review all changes
git log --oneline

# 2. Push your branch
git push origin i18n/pages-namespace

# 3. Update status document final stats
# Pages (9/10 complete) - Agent 1 finished
```

## Reference

- **Namespace file**: `public/locales/en/pages.json`
- **Example completed**: `pages/grades.js` (already done)
- **False positives list**: See `docs/I18N_TRANSLATION_STATUS.md` "False Positive Filter Results"
- **Original audit**: `I18N_TRANSLATION_TODOS.md` lines 11-93

## Questions?

If you encounter issues:
1. Check `pages.json` for the correct key path
2. Review `pages/grades.js` for the pattern
3. Document any ambiguous strings in commit messages
4. Skip and flag any strings you're unsure about

## Success Criteria

✅ All 9 page files have translation tags  
✅ All `t()` calls reference valid keys in `pages.json`  
✅ No literal user-facing strings remain  
✅ Clean git history with descriptive commits  
✅ Status document updated
