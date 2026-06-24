#!/usr/bin/env tsx
/**
 * @fileoverview Automated Story Inventory Generator
 *
 * Parses all Storybook story files and generates a comprehensive markdown manifest
 * documenting all stories, variants, and their metadata.
 *
 * Usage:
 *   npx tsx .github/skills/storybook-audit/scripts/generate-story-inventory.ts
 *
 * Output: docs/STORYBOOK_INVENTORY.md
 *
 * @module storybook-audit/scripts/generate-story-inventory
 */

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { glob } from "glob";

interface StoryVariant {
  name: string;
  hasPlayFunction: boolean;
  hasParameters: boolean;
  line: number;
}

interface StoryFile {
  filePath: string;
  relativePath: string;
  title: string;
  component: string;
  variants: StoryVariant[];
  totalVariants: number;
  hasInteractionTests: boolean;
  category: string;
}

/**
 * Extract story metadata from a TypeScript/JavaScript file
 */
function analyzeStoryFile(filePath: string, rootDir: string): StoryFile | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );

  let title = "";
  let component = "";
  const variants: StoryVariant[] = [];
  let category = "Uncategorized";

  /**
   * Visit AST nodes to extract story exports and metadata
   */
  function visit(node: ts.Node) {
    // Find default export with meta configuration
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      const metaNode = node.expression;
      if (ts.isObjectLiteralExpression(metaNode)) {
        metaNode.properties.forEach((prop) => {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const propName = prop.name.text;
            if (propName === "title" && ts.isStringLiteral(prop.initializer)) {
              title = prop.initializer.text;
              // Extract category from title (e.g., "📝 Components/Editor")
              const titleParts = title.split("/");
              if (titleParts.length > 1) {
                category =
                  titleParts[0].replace(/[^\w\s]/g, "").trim() || "Components";
              }
            } else if (
              propName === "component" &&
              ts.isIdentifier(prop.initializer)
            ) {
              component = prop.initializer.text;
            }
          }
        });
      }
    }

    // Find named exports (story variants)
    if (ts.isVariableStatement(node)) {
      const modifiers = ts.getModifiers(node);
      const isExported = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );

      if (isExported) {
        node.declarationList.declarations.forEach((decl) => {
          if (ts.isIdentifier(decl.name) && decl.name.text !== "default") {
            const variantName = decl.name.text;
            let hasPlayFunction = false;
            let hasParameters = false;

            // Check if the story has a play function or parameters
            if (
              decl.initializer &&
              ts.isObjectLiteralExpression(decl.initializer)
            ) {
              decl.initializer.properties.forEach((prop) => {
                if (
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name)
                ) {
                  if (prop.name.text === "play") {
                    hasPlayFunction = true;
                  } else if (prop.name.text === "parameters") {
                    hasParameters = true;
                  }
                }
              });
            }

            const lineNumber =
              sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line +
              1;
            variants.push({
              name: variantName,
              hasPlayFunction,
              hasParameters,
              line: lineNumber,
            });
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!title) {
    return null; // Not a valid story file
  }

  const relativePath = path.relative(rootDir, filePath);
  const hasInteractionTests = variants.some((v) => v.hasPlayFunction);

  return {
    filePath,
    relativePath,
    title,
    component,
    variants,
    totalVariants: variants.length,
    hasInteractionTests,
    category,
  };
}

/**
 * Generate markdown inventory from story analysis
 */
function generateInventoryMarkdown(stories: StoryFile[]): string {
  const categories = new Map<string, StoryFile[]>();

  // Group stories by category
  stories.forEach((story) => {
    const cat = story.category;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(story);
  });

  // Sort categories alphabetically
  const sortedCategories = Array.from(categories.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const totalStories = stories.length;
  const totalVariants = stories.reduce((sum, s) => sum + s.totalVariants, 0);
  const storiesWithTests = stories.filter((s) => s.hasInteractionTests).length;

  let markdown = `# Storybook Story Inventory

**Generated:** ${new Date().toISOString()}
**Total Story Files:** ${totalStories}
**Total Story Variants:** ${totalVariants}
**Stories with Interaction Tests:** ${storiesWithTests} (${((storiesWithTests / totalStories) * 100).toFixed(1)}%)

## Summary by Category

| Category | Story Files | Total Variants | With Tests |
|----------|-------------|----------------|------------|
`;

  sortedCategories.forEach(([category, categoryStories]) => {
    const variantCount = categoryStories.reduce(
      (sum, s) => sum + s.totalVariants,
      0,
    );
    const withTests = categoryStories.filter(
      (s) => s.hasInteractionTests,
    ).length;
    markdown += `| ${category} | ${categoryStories.length} | ${variantCount} | ${withTests} |\n`;
  });

  markdown += `\n## Stories by Category\n\n`;

  sortedCategories.forEach(([category, categoryStories]) => {
    markdown += `### ${category}\n\n`;

    categoryStories.forEach((story) => {
      const testBadge = story.hasInteractionTests ? "🧪" : "⚪";
      markdown += `#### ${testBadge} [${story.title}](${story.relativePath})\n\n`;
      markdown += `**Component:** \`${story.component || "Unknown"}\`\n`;
      markdown += `**Variants:** ${story.totalVariants}\n`;
      markdown += `**File:** \`${story.relativePath}\`\n\n`;

      if (story.variants.length > 0) {
        markdown += `| Variant | Line | Play Function | Parameters |\n`;
        markdown += `|---------|------|---------------|------------|\n`;
        story.variants.forEach((variant) => {
          const play = variant.hasPlayFunction ? "✅" : "⬜";
          const params = variant.hasParameters ? "✅" : "⬜";
          markdown += `| ${variant.name} | L${variant.line} | ${play} | ${params} |\n`;
        });
        markdown += `\n`;
      }
    });
  });

  markdown += `\n## Priority Components for Interaction Testing

Based on the automation plan, these components should receive interaction tests:

- [ ] ChatSidebar
- [ ] Editor
- [ ] Workbook
- [ ] Section Detail
- [ ] File Manager
- [ ] Unit List
- [ ] Grade View
- [ ] Assignment Manager
- [ ] Question Bank
- [ ] Dictionary Editor
- [ ] Recording Studio
- [ ] PDF Viewer
- [ ] Vocabulary Review
- [ ] Quiz Block
- [ ] Meaning Association
- [ ] Answer Block
- [ ] Custom Answer Block
- [ ] Main Toolbar
- [ ] Section Assigner

---

*Generated by .github/skills/storybook-audit/scripts/generate-story-inventory.ts*
`;

  return markdown;
}

/**
 * Main execution
 */
async function main() {
  const rootDir = path.resolve(process.cwd());
  const storyPattern = "src/**/*.stories.@(ts|tsx|js|jsx)";

  console.log("🔍 Finding story files...");
  const storyFiles = await glob(storyPattern, { cwd: rootDir });

  console.log(`📚 Found ${storyFiles.length} story files`);
  console.log("🔬 Analyzing stories...");

  const stories: StoryFile[] = [];

  for (const file of storyFiles) {
    const absolutePath = path.join(rootDir, file);
    const story = analyzeStoryFile(absolutePath, rootDir);
    if (story) {
      stories.push(story);
      console.log(`  ✓ ${story.title} (${story.totalVariants} variants)`);
    }
  }

  console.log("📝 Generating inventory markdown...");
  const markdown = generateInventoryMarkdown(stories);

  const outputPath = path.join(rootDir, "docs", "STORYBOOK_INVENTORY.md");
  fs.writeFileSync(outputPath, markdown, "utf-8");

  console.log(`✅ Inventory generated at: ${outputPath}`);
  console.log(
    `📊 Total: ${stories.length} stories, ${stories.reduce((sum, s) => sum + s.totalVariants, 0)} variants`,
  );
}

main().catch(console.error);
