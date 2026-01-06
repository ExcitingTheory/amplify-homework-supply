# Internationalization (i18n) Setup - Complete

## ✅ What's Been Set Up

### 1. ESLint Configuration
- **File**: [eslint.config.mjs](../eslint.config.mjs)
- **Plugin**: `eslint-plugin-i18next` installed
- **Parser**: `@babel/eslint-parser` for JSX support
- **Mode**: `jsx-only` (detects hardcoded strings in JSX/TSX only)

### 2. NPM Scripts Available

```bash
# Show all untranslated strings (warnings)
npm run lint:translate

# Generate JSON report of all issues
npm run lint:translate:report
```

### 3. Initial Translation Structure
Created starter translation files:
```
public/locales/
├── en/
│   ├── common.json      # UI actions, navigation, status
│   ├── editor.json      # Editor toolbar and blocks
│   ├── units.json       # Unit management
│   ├── grades.json      # Grading interface
│   ├── chat.json        # Chat interface
│   ├── auth.json        # Authentication
│   └── errors.json      # Error messages
└── ja/
    └── (ready for Japanese translations)
```

### 4. Documentation

- **[I18N_UPGRADE_GUIDE.md](I18N_UPGRADE_GUIDE.md)** - Complete implementation guide (8 phases)
- **[I18N_QUICK_REFERENCE.md](I18N_QUICK_REFERENCE.md)** - Quick start and troubleshooting

## 🚀 Next Steps

### Immediate (Now)
1. **Run detection** to see current state:
   ```bash
   npm run lint:translate
   ```

2. **Review the output** - You'll see warnings like:
   ```
   src/components/ChatSidebar.js
     123:12  warning  disallow literal string: "Send"  i18next/no-literal-string
   ```

3. **Generate report** for analysis:
   ```bash
   npm run lint:translate:report
   ```
   This creates `i18n-report.json` with full details.

### Short Term (Before Implementation)
4. **Install full i18n dependencies**:
   ```bash
   npm install next-i18next i18next
   npm install --save-dev @types/i18next  # if using TypeScript
   ```

5. **Create i18n config** - Follow Phase 1 of the [upgrade guide](I18N_UPGRADE_GUIDE.md#phase-1-infrastructure-setup)

6. **Update _app.js** to wrap with i18n provider

### Medium Term (During Implementation)
7. **Start small** - Pick 2-3 high-impact components:
   - Navigation/menu components
   - Button labels
   - Error messages

8. **Follow the pattern**:
   ```jsx
   // Before
   <Button>Save</Button>
   
   // After
   import { useTranslation } from 'next-i18next';
   const { t } = useTranslation('common');
   <Button>{t('actions.save')}</Button>
   ```

9. **Add translations** to JSON files as you go

### Long Term (Completion)
10. **Systematically work through** all components
11. **Add Japanese translations** (professional service or AI-assisted)
12. **Test** in both languages
13. **Deploy** with language switcher

## 📊 Current State Analysis

Run this to count strings needing translation:
```bash
npm run lint:translate 2>&1 | grep "warning" | wc -l
```

To see which files have the most issues:
```bash
npm run lint:translate 2>&1 | grep "warning" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20
```

## ⚙️ Configuration Details

### What Gets Detected
✅ **User-facing strings in JSX**:
- Button labels: `<Button>Save</Button>`
- Text content: `<Typography>Welcome!</Typography>`
- Headings: `<h1>Dashboard</h1>`
- Conditional text: `{error ? "Failed" : "Success"}`

### What's Automatically Excluded
❌ **Technical values** (won't be flagged):
- CSS properties and values
- HTML attributes (className, id, etc.)
- File paths and URLs
- Console.log statements
- Variable names
- Test files and stories

### Fine-Tuning
Edit [eslint.config.mjs](../eslint.config.mjs) to:
- Add more patterns to `ignore` array
- Exclude specific components
- Adjust severity (warn vs error)

## 📚 Resources

- **Implementation Guide**: [docs/I18N_UPGRADE_GUIDE.md](I18N_UPGRADE_GUIDE.md)
- **Quick Reference**: [docs/I18N_QUICK_REFERENCE.md](I18N_QUICK_REFERENCE.md)
- **next-i18next**: https://github.com/i18next/next-i18next
- **eslint-plugin-i18next**: https://github.com/edvardchen/eslint-plugin-i18next

## 🎯 Success Criteria

Your i18n implementation will be complete when:
- [ ] `npm run lint:translate` shows 0 warnings
- [ ] All translation JSON files have entries for detected strings
- [ ] Japanese translations are complete
- [ ] All pages load correctly in both languages
- [ ] Language switcher works
- [ ] Build succeeds without errors

## 💡 Tips

1. **Start small**: Don't try to translate everything at once
2. **Group related strings**: Use nested keys in JSON (e.g., `editor.toolbar.bold`)
3. **Reuse common strings**: Same translations across components save time
4. **Test frequently**: Switch languages after each component
5. **Document context**: Add comments in JSON for ambiguous strings

## ❓ Questions?

Refer to:
- [I18N_UPGRADE_GUIDE.md](I18N_UPGRADE_GUIDE.md) for detailed implementation
- [I18N_QUICK_REFERENCE.md](I18N_QUICK_REFERENCE.md) for quick answers
- Or ask in team chat!
