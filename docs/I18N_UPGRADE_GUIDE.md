Yes, there are several approaches to flag untranslated strings in a React application:

## 1. **Development-time warnings**

Most i18n libraries have built-in options to warn about missing translations:

**react-i18next:**
```javascript
i18n.init({
  saveMissing: true,
  missingKeyHandler: (lng, ns, key, fallbackValue) => {
    console.warn(`Missing translation: ${key} in ${lng}/${ns}`);
  }
});
```

**react-intl:**
```javascript
<IntlProvider 
  messages={messages} 
  locale={locale}
  onError={(err) => {
    if (err.code === 'MISSING_TRANSLATION') {
      console.warn('Missing translation:', err.message);
    }
  }}
/>
```

## 2. **Visual flagging in development**

You can make untranslated strings visually obvious:

```javascript
// Wrap your translation function
const t = (key) => {
  const translation = i18n.t(key);
  if (process.env.NODE_ENV === 'development' && translation === key) {
    return `🚨 ${key} 🚨`; // Makes missing translations obvious
  }
  return translation;
};
```

## 3. **ESLint plugin**

Use `eslint-plugin-i18n-text` or `eslint-plugin-i18next` to catch hardcoded strings during development.

## 4. **Build-time checks**

Create a script that compares your translation files against strings used in your code, then run it as part of your CI/CD pipeline.

## 5. **Runtime monitoring**

In production, you can log missing translations to a monitoring service:

```javascript
missingKeyHandler: (lng, ns, key) => {
  // Send to analytics/monitoring
  trackEvent('missing_translation', { key, language: lng });
}
```

Which i18n library are you using? I can provide more specific implementation details.


# Internationalization (i18n) Upgrade Guide

This guide outlines the step-by-step process for adding internationalization support to the Homework Supply application.

## Overview

The application currently has hardcoded strings throughout the codebase. This guide will help you:
1. Set up i18n infrastructure using `next-i18next` and `react-i18next`
2. Detect all untranslated strings using ESLint
3. Systematically replace hardcoded strings with translation keys
4. Organize and manage translation files
5. Test and validate translations

## Current State

- **Status**: No i18n implementation
- **Existing dependency**: `react-i18next` v14.1.2 (in devDependencies)
- **Framework**: Next.js 16 with App Router support
- **UI Framework**: Material UI v7
- **Target languages**: English (primary), Japanese (secondary)

---

## Phase 1: Infrastructure Setup

### 1.1 Install Dependencies

Move `react-i18next` to regular dependencies and add Next.js integration:

```bash
npm install --save next-i18next react-i18next i18next
npm install --save-dev eslint-plugin-i18next
```

### 1.2 Create i18n Configuration

Create `next-i18next.config.js` in the project root:

```javascript
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
  },
  fallbackLng: 'en',
  ns: ['common', 'editor', 'auth', 'units', 'grades', 'chat', 'errors'],
  defaultNS: 'common',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localePath: typeof window === 'undefined' 
      ? require('path').resolve('./public/locales')
      : '/locales',
};
```

### 1.3 Update next.config.js

```javascript
const { i18n } = require('./next-i18next.config');

module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@mui/x-data-grid'],
  i18n,
};
```

### 1.4 Create Translation File Structure

```
public/
  locales/
    en/
      common.json
      editor.json
      auth.json
      units.json
      grades.json
      chat.json
      errors.json
    ja/
      common.json
      editor.json
      auth.json
      units.json
      grades.json
      chat.json
      errors.json
```

### 1.5 Initialize Translation Files

Create starter `public/locales/en/common.json`:

```json
{
  "app": {
    "name": "Homework Supply",
    "tagline": "Japanese Language Learning Platform"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "submit": "Submit",
    "close": "Close",
    "create": "Create",
    "upload": "Upload",
    "download": "Download",
    "share": "Share",
    "copy": "Copy"
  },
  "navigation": {
    "home": "Home",
    "units": "Units",
    "sections": "Sections",
    "grades": "Grades",
    "profile": "Profile"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "success": "Success",
    "error": "Error",
    "processing": "Processing..."
  }
}
```

### 1.6 Update _app.js

Wrap the app with i18n provider:

```javascript
import { appWithTranslation } from 'next-i18next';

// ... existing imports and code ...

function MyApp({ Component, pageProps }) {
  // ... existing code ...
  
  return (
    <Component {...pageProps} />
  );
}

export default appWithTranslation(MyApp);
```

---

## Phase 2: ESLint Detection Setup

### 2.1 Create .eslintrc.json

Create ESLint configuration with i18n rules:

```json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["i18next"],
  "rules": {
    "i18next/no-literal-string": [
      "warn",
      {
        "mode": "jsx-only",
        "jsx-attributes": {
          "exclude": [
            "className",
            "style",
            "type",
            "id",
            "name",
            "key",
            "ref",
            "href",
            "src",
            "alt",
            "role",
            "aria-label",
            "aria-labelledby",
            "data-testid",
            "variant",
            "color",
            "size",
            "align",
            "position",
            "direction",
            "spacing",
            "component",
            "to",
            "icon",
            "edge",
            "severity",
            "level",
            "contentType",
            "accept",
            "method",
            "target",
            "rel",
            "placeholder"
          ]
        },
        "jsx-components": {
          "exclude": [
            "Icon",
            "IconButton",
            "SvgIcon"
          ]
        },
        "ignore": [
          "^\\s*$",
          "^[0-9]+$",
          "^[A-Z_]+$",
          "^[a-z-]+$",
          "\\$\\{.*\\}",
          "^/",
          "^https?://",
          "^#",
          "^\\."
        ],
        "ignoreCallee": [
          "console.log",
          "console.warn",
          "console.error",
          "require",
          "DataStore",
          "JSON.stringify",
          "JSON.parse",
          "new Date",
          "Date",
          "Math",
          "Number",
          "parseInt",
          "parseFloat",
          "Boolean",
          "String",
          "Array",
          "Object"
        ],
        "ignoreProperty": [
          "key",
          "id",
          "type",
          "name",
          "className",
          "style",
          "props",
          "state",
          "ref"
        ]
      }
    ]
  },
  "overrides": [
    {
      "files": ["*.stories.jsx", "*.stories.tsx", "*.test.js", "*.test.jsx"],
      "rules": {
        "i18next/no-literal-string": "off"
      }
    }
  ]
}
```

### 2.2 Add ESLint Scripts to package.json

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:translate": "eslint . --ext .js,.jsx,.ts,.tsx --rule 'i18next/no-literal-string: [warn]'",
    "lint:translate:fix": "eslint . --ext .js,.jsx,.ts,.tsx --rule 'i18next/no-literal-string: [warn]' --fix",
    "lint:translate:report": "eslint . --ext .js,.jsx,.ts,.tsx --rule 'i18next/no-literal-string: [warn]' -f json -o i18n-report.json"
  }
}
```

### 2.3 Update .eslintignore

Create or update `.eslintignore`:

```
node_modules/
.next/
out/
build/
dist/
amplify/
cypress/
public/
*.config.js
*.config.ts
```

---

## Phase 3: Detection and Cataloging

### 3.1 Run Initial Detection

```bash
npm run lint:translate
```

This will show warnings for all hardcoded strings that need translation.

### 3.2 Generate Report

```bash
npm run lint:translate:report
```

This creates `i18n-report.json` with all detected strings.

### 3.3 Categorize Strings

Review the report and categorize strings by namespace:
- **common**: Buttons, actions, navigation, status messages
- **editor**: Editor UI, toolbar, plugins
- **auth**: Login, signup, password reset
- **units**: Unit creation, editing, management
- **grades**: Grading UI, feedback
- **chat**: Chat interface, AI responses
- **errors**: Error messages, validation

---

## Phase 4: Systematic Replacement

### 4.1 Create useTranslation Hook Pattern

Example component transformation:

**Before:**
```jsx
import { Button } from '@mui/material';

const MyComponent = () => {
  return (
    <Button>Save Changes</Button>
  );
};
```

**After:**
```jsx
import { Button } from '@mui/material';
import { useTranslation } from 'next-i18next';

const MyComponent = () => {
  const { t } = useTranslation('common');
  
  return (
    <Button>{t('actions.save')}</Button>
  );
};
```

### 4.2 Handle Dynamic Strings

**Interpolation:**
```jsx
// Before
<Typography>Welcome, {username}!</Typography>

// After
<Typography>{t('welcome', { username })}</Typography>

// In translation file:
{
  "welcome": "Welcome, {{username}}!"
}
```

**Pluralization:**
```jsx
// Before
<Typography>{count} {count === 1 ? 'item' : 'items'}</Typography>

// After
<Typography>{t('items', { count })}</Typography>

// In translation file:
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

### 4.3 Priority Order for Replacement

1. **High Priority** (User-facing UI):
   - Navigation menus
   - Button labels
   - Form labels and placeholders
   - Error messages
   - Success messages
   
2. **Medium Priority**:
   - Dialog titles and content
   - Tooltips
   - Help text
   - Table headers
   
3. **Low Priority**:
   - Console messages (consider skipping)
   - Developer comments
   - Non-displayed constants

### 4.4 Component-by-Component Strategy

Start with core components:
1. `pages/_app.js` - Navigation
2. `src/components/Editor3/` - Editor interface
3. `pages/units.js` - Unit management
4. `pages/grades.js` - Grading interface
5. `src/components/ChatSidebar.js` - Chat interface

---

## Phase 5: Server-Side Rendering (SSR) Support

### 5.1 Add getStaticProps to Pages

For pages without data fetching:

```javascript
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'units'])),
    },
  };
}
```

For pages with existing getServerSideProps:

```javascript
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getServerSideProps({ locale, params }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'units'])),
      // ... existing props
    },
  };
}
```

---

## Phase 6: Testing Strategy

### 6.1 Automated Testing

Create test utilities in `src/utils/testTranslations.js`:

```javascript
import { i18n } from 'next-i18next';

export function getAllTranslationKeys(namespace = 'common') {
  const keys = [];
  function extractKeys(obj, prefix = '') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object') {
        extractKeys(obj[key], fullKey);
      } else {
        keys.push(fullKey);
      }
    }
  }
  extractKeys(i18n.getResourceBundle('en', namespace));
  return keys;
}

export function validateTranslations() {
  const locales = ['en', 'ja'];
  const namespaces = ['common', 'editor', 'auth', 'units', 'grades', 'chat', 'errors'];
  const issues = [];

  namespaces.forEach(ns => {
    const enKeys = getAllTranslationKeys(ns);
    locales.forEach(locale => {
      if (locale === 'en') return;
      enKeys.forEach(key => {
        if (!i18n.exists(key, { ns, lng: locale })) {
          issues.push(`Missing ${locale} translation for ${ns}.${key}`);
        }
      });
    });
  });

  return issues;
}
```

### 6.2 Manual Testing Checklist

- [ ] Switch language in browser settings
- [ ] Verify all pages render correctly in both languages
- [ ] Test form validation messages
- [ ] Test error messages
- [ ] Test dynamic content (dates, numbers)
- [ ] Test pluralization
- [ ] Check RTL languages (if applicable)

---

## Phase 7: Japanese Translation

### 7.1 Professional Translation

For production, consider:
- Professional translation service
- Native speaker review
- Context-aware translations (formal vs informal)

### 7.2 Machine Translation (Development)

For development, use OpenAI API:

```javascript
// scripts/translate.js
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function translateFile(sourceFile, targetLang) {
  const content = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  
  async function translateObject(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object') {
        result[key] = await translateObject(value);
      } else {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional translator. Translate the following English text to Japanese for a language learning platform UI. Maintain any {{variables}} exactly as they are.' },
            { role: 'user', content: value }
          ]
        });
        result[key] = response.choices[0].message.content;
      }
    }
    return result;
  }
  
  return await translateObject(content);
}
```

---

## Phase 8: Deployment Checklist

- [ ] All ESLint warnings resolved
- [ ] Translation files complete for all languages
- [ ] SSR/SSG pages have `serverSideTranslations`
- [ ] Language switcher UI implemented
- [ ] Translations tested in all supported locales
- [ ] Browser language detection working
- [ ] Cookie/localStorage persistence configured
- [ ] Build succeeds without warnings
- [ ] Production environment variables set

---

## Maintenance

### Adding New Strings

1. Add English translation to appropriate namespace
2. Run `npm run lint:translate` to verify no hardcoded strings
3. Add translations for other languages
4. Run `npm run test:translations` to verify completeness

### Translation File Organization

Keep translation files organized by feature:
- Use nested keys: `editor.toolbar.bold` not `editorToolbarBold`
- Group related strings together
- Document context in comments where needed
- Keep keys alphabetically sorted within sections

---

## Resources

- [next-i18next Documentation](https://github.com/i18next/next-i18next)
- [react-i18next Documentation](https://react.i18next.com/)
- [eslint-plugin-i18next](https://github.com/edvardchen/eslint-plugin-i18next)
- [Material UI Localization](https://mui.com/material-ui/guides/localization/)

---

## Troubleshooting

### ESLint shows too many warnings

Adjust the `ignore` patterns in `.eslintrc.json` to exclude:
- Variable names
- Class names
- Constants
- Technical strings (file paths, URLs, etc.)

### Translations not loading in production

- Verify `localePath` is correct in `next-i18next.config.js`
- Check that `public/locales` is included in build
- Ensure `serverSideTranslations` is called in all pages

### Hydration mismatch errors

- Ensure language is detected the same way on server and client
- Use consistent date/number formatting
- Check for client-only translation calls in SSR pages

---

## Progress Tracking

Use this checklist to track implementation progress:

### Phase 1: Infrastructure
- [ ] Dependencies installed
- [ ] Configuration files created
- [ ] Translation file structure created
- [ ] _app.js updated

### Phase 2: ESLint Setup
- [ ] .eslintrc.json created
- [ ] Package scripts added
- [ ] .eslintignore configured

### Phase 3: Detection
- [ ] Initial scan completed
- [ ] Report generated
- [ ] Strings categorized

### Phase 4: Replacement
- [ ] Navigation components
- [ ] Editor components
- [ ] Unit management
- [ ] Grade management
- [ ] Chat interface
- [ ] Auth flows
- [ ] Remaining components

### Phase 5: SSR
- [ ] All pages have getStaticProps/getServerSideProps

### Phase 6: Testing
- [ ] Test utilities created
- [ ] Manual testing completed

### Phase 7: Translation
- [ ] Japanese translations completed
- [ ] Review completed

### Phase 8: Deployment
- [ ] All checklist items completed
- [ ] Deployed to production
