# Integration Patterns

How to integrate extract-code-documentation with other skills and workflows.

## Integration with i18n Translation Workflow

### Step 1: Extract Component Metadata
```bash
npx tsx scripts/extract-component-docblocks.ts src/components/
```

### Step 2: Add Translation Metadata
```bash
npx tsx scripts/add-translation-metadata.ts \
  --namespace components \
  --output public/locales/en/translation.json
```

### Step 3: Use multi-model-ai-translation
```bash
npx tsx ../multi-model-ai-translation/scripts/translate-with-proof.ts \
  --source public/locales/en/translation.json \
  --target ja,es,fr \
  --mode provable
```

---

## Integration with Storybook

### Generate Story Metadata
```typescript
// Auto-generated from docblocks
import { extractDocblocks } from '../scripts/extract-component-docblocks';

const metadata = await extractDocblocks({
  pattern: 'src/components/**/*.tsx',
  namespace: 'components'
});

// Use in Storybook story generation
metadata.components.forEach(component => {
  const story = `
    export default {
      title: '${component.namespace}/${component.name}',
      component: ${component.name},
      parameters: {
        docs: {
          description: {
            component: '${component.docblock.description}'
          }
        }
      }
    } satisfies Meta<typeof ${component.name}>;
  `;
});
```

---

## Integration with TypeDoc

### Generate TypeDoc Markdown
```bash
# Extract docblocks
npx tsx scripts/extract-component-docblocks.ts \
  --format markdown \
  --output docs/api/

# Run TypeDoc
npx typedoc --out docs/typedoc src/
```

---

## Integration with Component Versioning

### Extract Features for Checklist
```typescript
import { extractDocblocks } from '../extract-code-documentation/scripts/extract-component-docblocks';

// Extract features from original component
const metadata = await extractDocblocks({
  files: ['src/components/ChatSidebar.tsx']
});

const features = metadata.components[0].features;
// ['streaming', 'tool-calls', 'accessibility']

// Use in component-versioning checklist
const checklist = features.map(f => ({
  description: `Verify ${f} functionality`,
  priority: 'high'
}));
```

---

## Integration with Mock Data Validator

### Extract Prop Types for Validation
```typescript
// Extract component props
const metadata = await extractDocblocks({
  files: ['src/components/ChatSidebar.tsx']
});

const propTypes = metadata.components[0].props;
// [{ name: 'messages', type: 'Message[]', required: true }]

// Use in mock-data-validator
import { validateMockData } from '../mock-data-validator/scripts/mock-data-validator';

validateMockData({
  mockDataPath: '.storybook/__mocks__/ui-data/chatMessages.ts',
  expectedTypes: propTypes
});
```

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - 'src/**/*.tsx'
      - 'src/**/*.ts'

jobs:
  extract-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Extract Docblocks
        run: |
          npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts \
            --format json \
            --output docs/components.json
      
      - name: Generate Markdown Docs
        run: |
          npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts \
            --format markdown \
            --output docs/api/
      
      - name: Commit Changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/
          git commit -m "docs: update component documentation"
          git push
```

---

## Pre-commit Hook Integration

### .husky/pre-commit
```bash
#!/bin/sh

# Extract docblocks before commit
npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts \
  --format json \
  --output docs/components.json

# Add to commit
git add docs/components.json
```

---

## VSCode Integration

### tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Extract Component Docs",
      "type": "shell",
      "command": "npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts --format markdown",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

---

## Custom Namespace Integration

### Add Custom Namespace
```typescript
// In scripts/add-metadata-all-namespaces.ts

const customNamespaces = [
  {
    name: 'amplify-functions',
    pattern: 'amplify/backend/function/**/*.ts',
    description: 'Lambda function handlers'
  },
  {
    name: 'graphql-resolvers',
    pattern: 'amplify/backend/api/**/resolvers/**/*.ts',
    description: 'GraphQL custom resolvers'
  }
];

// Extract from custom namespaces
for (const ns of customNamespaces) {
  await extractDocblocks({
    pattern: ns.pattern,
    namespace: ns.name,
    output: `docs/${ns.name}.json`
  });
}
```

---

## API Documentation Generation

### Generate OpenAPI-style Docs
```typescript
import { extractDocblocks } from './scripts/extract-component-docblocks';

const metadata = await extractDocblocks({
  pattern: 'pages/api/**/*.ts',
  namespace: 'api-routes'
});

// Convert to OpenAPI format
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Homework Supply API',
    version: '1.0.0'
  },
  paths: metadata.components.reduce((paths, component) => {
    paths[`/api/${component.name}`] = {
      post: {
        summary: component.docblock.description,
        parameters: component.props.map(p => ({
          name: p.name,
          in: 'body',
          required: p.required,
          schema: { type: p.type }
        }))
      }
    };
    return paths;
  }, {})
};
```
