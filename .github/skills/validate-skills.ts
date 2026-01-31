#!/usr/bin/env tsx
/**
 * Agent Skills Validator
 * Validates skills against the Agent Skills specification from agentskills.io
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

interface ValidationProblem {
  severity: 'error' | 'warning';
  field: string;
  message: string;
  location?: string;
}

interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string | string[]>;
  'allowed-tools'?: string;
}

interface ValidationResult {
  skillPath: string;
  skillName: string;
  problems: ValidationProblem[];
  valid: boolean;
}

/**
 * Validate skill name
 */
function validateName(name: string): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  
  if (!name) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: 'Name field is required'
    });
    return problems;
  }
  
  if (name.length > 64) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: `Name must be max 64 characters (found ${name.length})`
    });
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: 'Name must only contain lowercase letters, numbers, and hyphens'
    });
  }
  
  if (name.startsWith('-') || name.endsWith('-')) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: 'Name must not start or end with hyphen'
    });
  }
  
  if (name.includes('--')) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: 'Name must not contain consecutive hyphens'
    });
  }
  
  return problems;
}

/**
 * Validate description
 */
function validateDescription(description: string): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  
  if (!description) {
    problems.push({
      severity: 'error',
      field: 'description',
      message: 'Description field is required'
    });
    return problems;
  }
  
  if (description.length > 1024) {
    problems.push({
      severity: 'error',
      field: 'description',
      message: `Description must be max 1024 characters (found ${description.length})`
    });
  }
  
  if (description.length < 20) {
    problems.push({
      severity: 'warning',
      field: 'description',
      message: 'Description should be descriptive and include when to use it'
    });
  }
  
  return problems;
}

/**
 * Validate frontmatter
 */
function validateFrontmatter(frontmatter: SkillFrontmatter, dirName: string): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  
  // Validate name
  problems.push(...validateName(frontmatter.name));
  
  // Check name matches directory
  if (frontmatter.name !== dirName) {
    problems.push({
      severity: 'error',
      field: 'name',
      message: `Name "${frontmatter.name}" must match directory name "${dirName}"`
    });
  }
  
  // Validate description
  problems.push(...validateDescription(frontmatter.description));
  
  // Validate optional fields
  if (frontmatter.compatibility && frontmatter.compatibility.length > 500) {
    problems.push({
      severity: 'error',
      field: 'compatibility',
      message: `Compatibility must be max 500 characters (found ${frontmatter.compatibility.length})`
    });
  }
  
  return problems;
}

/**
 * Parse SKILL.md file and extract frontmatter
 */
function parseSkillFile(skillPath: string): { frontmatter: SkillFrontmatter | null; content: string; problems: ValidationProblem[] } {
  const problems: ValidationProblem[] = [];
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  if (!fs.existsSync(skillMdPath)) {
    problems.push({
      severity: 'error',
      field: 'SKILL.md',
      message: 'SKILL.md file not found'
    });
    return { frontmatter: null, content: '', problems };
  }
  
  const content = fs.readFileSync(skillMdPath, 'utf-8');
  
  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    problems.push({
      severity: 'error',
      field: 'frontmatter',
      message: 'SKILL.md must start with YAML frontmatter (---)'
    });
    return { frontmatter: null, content, problems };
  }
  
  let frontmatter: SkillFrontmatter;
  try {
    frontmatter = yaml.parse(frontmatterMatch[1]);
  } catch (error) {
    problems.push({
      severity: 'error',
      field: 'frontmatter',
      message: `Invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`
    });
    return { frontmatter: null, content, problems };
  }
  
  return { frontmatter, content, problems };
}

/**
 * Check file size and line count
 */
function validateFileSize(skillPath: string): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  if (!fs.existsSync(skillMdPath)) {
    return problems;
  }
  
  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const lines = content.split('\n');
  
  if (lines.length > 500) {
    problems.push({
      severity: 'warning',
      field: 'SKILL.md',
      message: `SKILL.md has ${lines.length} lines (recommended max 500). Consider moving content to references/`
    });
  }
  
  return problems;
}

/**
 * Validate directory structure
 */
function validateStructure(skillPath: string): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  
  // Check for recommended directories
  const scriptsDir = path.join(skillPath, 'scripts');
  const referencesDir = path.join(skillPath, 'references');
  const assetsDir = path.join(skillPath, 'assets');
  
  // Check for scripts in root (should be in scripts/)
  const rootFiles = fs.readdirSync(skillPath);
  const scriptsInRoot = rootFiles.filter(f => 
    (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.py')) && 
    f !== 'SKILL.md' &&
    !f.endsWith('.test.ts') &&
    !f.endsWith('.test.js')
  );
  
  if (scriptsInRoot.length > 0) {
    problems.push({
      severity: 'warning',
      field: 'structure',
      message: `Found ${scriptsInRoot.length} script(s) in root: ${scriptsInRoot.join(', ')}. Consider moving to scripts/`
    });
  }
  
  return problems;
}

/**
 * Validate a single skill
 */
function validateSkill(skillPath: string): ValidationResult {
  const skillName = path.basename(skillPath);
  const problems: ValidationProblem[] = [];
  
  // Parse SKILL.md
  const { frontmatter, content, problems: parseProblems } = parseSkillFile(skillPath);
  problems.push(...parseProblems);
  
  // Validate frontmatter if parsed successfully
  if (frontmatter) {
    problems.push(...validateFrontmatter(frontmatter, skillName));
  }
  
  // Validate file size
  problems.push(...validateFileSize(skillPath));
  
  // Validate directory structure
  problems.push(...validateStructure(skillPath));
  
  const valid = problems.filter(p => p.severity === 'error').length === 0;
  
  return {
    skillPath,
    skillName,
    problems,
    valid
  };
}

/**
 * Main execution
 */
async function main() {
  const skillsDir = path.join(__dirname);
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  
  const skillDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => path.join(skillsDir, e.name));
  
  console.log(`\n🔍 Validating ${skillDirs.length} skills...\n`);
  
  const results: ValidationResult[] = [];
  
  for (const skillPath of skillDirs) {
    const result = validateSkill(skillPath);
    results.push(result);
    
    const icon = result.valid ? '✅' : '❌';
    const errorCount = result.problems.filter(p => p.severity === 'error').length;
    const warningCount = result.problems.filter(p => p.severity === 'warning').length;
    
    console.log(`${icon} ${result.skillName}`);
    
    if (result.problems.length > 0) {
      for (const problem of result.problems) {
        const symbol = problem.severity === 'error' ? '  ❌' : '  ⚠️ ';
        console.log(`${symbol} ${problem.field}: ${problem.message}`);
      }
      console.log();
    }
  }
  
  // Summary
  console.log('─'.repeat(60));
  const validCount = results.filter(r => r.valid).length;
  const totalErrors = results.reduce((sum, r) => sum + r.problems.filter(p => p.severity === 'error').length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.problems.filter(p => p.severity === 'warning').length, 0);
  
  console.log(`\n📊 Validation Summary:`);
  console.log(`   Valid: ${validCount}/${results.length}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}\n`);
  
  if (validCount === results.length && totalErrors === 0) {
    console.log('🎉 All skills pass validation!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some skills have validation issues.\n');
    process.exit(totalErrors > 0 ? 1 : 0);
  }
}

main().catch(console.error);
