/**
 * Agent Permissions Tests
 * 
 * Validates permission checking logic for non-destructive agent operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentPermissions, type PermissionCheckInput } from '../../src/utils/agentPermissions';
import path from 'path';

describe('AgentPermissions', () => {
  let permissions: AgentPermissions;

  beforeEach(async () => {
    const configPath = path.join(process.cwd(), '.github', 'agent-permissions.json');
    permissions = new AgentPermissions(configPath);
    await permissions.load();
  });

  describe('Read Operations', () => {
    it('should allow reading source files', async () => {
      const result = await permissions.checkPermission({
        operation: 'read',
        path: 'src/components/MyComponent.tsx'
      });

      expect(result.allowed).toBe(true);
    });

    it('should block reading environment variables', async () => {
      const result = await permissions.checkPermission({
        operation: 'read',
        path: '.env.local'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('sensitive');
    });

    it('should block reading AWS credentials', async () => {
      const result = await permissions.checkPermission({
        operation: 'read',
        path: 'src/aws-exports.js'
      });

      expect(result.allowed).toBe(false);
    });

    it('should block reading amplify config', async () => {
      const result = await permissions.checkPermission({
        operation: 'read',
        path: 'src/amplifyconfiguration.json'
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('Write Operations - Unrestricted Paths', () => {
    it('should allow writing test files without confirmation', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/MyComponent.test.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should allow writing story files without confirmation', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/MyComponent.stories.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should allow writing documentation without confirmation', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'docs/NEW_FEATURE.md'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should allow writing mock data without confirmation', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: '.storybook/__mocks__/ui-data/testData.ts'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should allow writing translations without confirmation', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'public/locales/en/common.json'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });
  });

  describe('Write Operations - Restricted Paths', () => {
    it('should require confirmation for writing production components', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/NewComponent.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.reason).toContain('confirmation');
    });

    it('should require confirmation for writing context files', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/context/newContext.js'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should require confirmation for writing utility files', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/utils/newUtil.ts'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should require confirmation for writing page files', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'pages/new-page.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('Write Operations - Blocked Paths', () => {
    it('should block writing to critical config files', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'package.json'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('critical configuration');
    });

    it('should block writing to Amplify config', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'amplify.yml'
      });

      expect(result.allowed).toBe(false);
    });

    it('should block writing to Next.js config', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'next.config.js'
      });

      expect(result.allowed).toBe(false);
    });

    it('should block writing to environment files', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: '.env.local'
      });

      expect(result.allowed).toBe(false);
    });

    it('should block writing to unlisted random paths', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'some/random/path.txt'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in the allowed');
    });
  });

  describe('Delete Operations', () => {
    it('should require confirmation for deleting test files', async () => {
      const result = await permissions.checkPermission({
        operation: 'delete',
        path: 'src/components/MyComponent.test.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should require confirmation for deleting documentation', async () => {
      const result = await permissions.checkPermission({
        operation: 'delete',
        path: 'docs/OLD_DOC.md'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should block deleting production code', async () => {
      const result = await permissions.checkPermission({
        operation: 'delete',
        path: 'src/components/MyComponent.tsx'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot be deleted');
    });
  });

  describe('Schema Changes', () => {
    it('should block GraphQL schema modifications', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'amplify/backend/api/japanese5/schema.graphql'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Schema changes');
    });

    it('should block generated model modifications', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/models/Unit.ts'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Schema changes');
    });
  });

  describe('File Size Limits', () => {
    it('should block writing files over size limit', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/HugeComponent.tsx',
        fileSize: 2 * 1024 * 1024 // 2MB
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds maximum');
    });

    it('should allow writing files under size limit', async () => {
      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/SmallComponent.tsx',
        fileSize: 500 * 1024 // 500KB
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Terminal Commands', () => {
    it('should allow npm test commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'npm test'
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow git status commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'git status'
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow git diff commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'git diff HEAD~1'
      });

      expect(result.allowed).toBe(true);
    });

    it('should block npm install commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'npm install lodash'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('install');
    });

    it('should block git push commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'git push origin main'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('push');
    });

    it('should block dangerous rm commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'rm -rf .'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('rm');
    });

    it('should block amplify push commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'amplify push'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('push');
    });

    it('should allow amplify status commands', async () => {
      const result = await permissions.checkPermission({
        operation: 'terminal',
        command: 'amplify status'
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('DataStore Operations', () => {
    it('should allow DataStore query', async () => {
      const result = await permissions.checkPermission({
        operation: 'datastore.query'
      });

      expect(result.allowed).toBe(true);
    });

    it('should require confirmation for DataStore save', async () => {
      const result = await permissions.checkPermission({
        operation: 'datastore.save'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should require confirmation for DataStore delete', async () => {
      const result = await permissions.checkPermission({
        operation: 'datastore.delete'
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should block DataStore clear', async () => {
      const result = await permissions.checkPermission({
        operation: 'datastore.clear'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not allowed');
    });
  });

  describe('Skill Permissions', () => {
    it('should allow mock-data-validator to create files', async () => {
      const result = await permissions.checkSkillPermission('mock-data-validator', 'create');

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should allow component-versioning with confirmation', async () => {
      const result = await permissions.checkSkillPermission('component-versioning', 'create');

      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should block all operations for read-only skills', async () => {
      const result = await permissions.checkSkillPermission('semantic-file-search', 'create');

      expect(result.allowed).toBe(false);
    });

    it('should allow unknown skills by default', async () => {
      const result = await permissions.checkSkillPermission('unknown-skill', 'create');

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('No specific restrictions');
    });
  });

  describe('Safe Modes', () => {
    it('should block all writes in read-only mode', async () => {
      permissions.setSafeMode('readOnly', true);

      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/MyComponent.test.tsx'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Read-only mode');

      permissions.setSafeMode('readOnly', false);
    });

    it('should mark operations as dry-run when enabled', async () => {
      permissions.setSafeMode('dryRun', true);

      const result = await permissions.checkPermission({
        operation: 'write',
        path: 'src/components/Dangerous.tsx'
      });

      expect(result.allowed).toBe(true);
      expect(result.metadata?.dryRun).toBe(true);

      permissions.setSafeMode('dryRun', false);
    });
  });

  describe('Logging', () => {
    it('should log operations when enabled', async () => {
      await permissions.logOperation('write', 'test.txt', 'allowed');
      
      const logs = permissions.getRecentLogs(1);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].operation).toBe('write');
      expect(logs[logs.length - 1].result).toBe('allowed');
    });
  });
});
