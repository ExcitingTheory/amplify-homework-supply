/**
 * Agent Permissions System
 *
 * Enforces non-destructive operation controls for autonomous AI agents.
 * Prevents accidental data loss, infrastructure changes, and security issues.
 *
 * @module agent-permissions
 */

import * as fs from "fs/promises";
import * as path from "path";
import { minimatch } from "minimatch";

export type Operation =
  | "read"
  | "write"
  | "delete"
  | "rename"
  | "terminal"
  | "datastore.query"
  | "datastore.save"
  | "datastore.delete"
  | "datastore.clear";

export interface PermissionCheckInput {
  operation: Operation;
  path?: string;
  command?: string;
  skill?: string;
  fileSize?: number;
}

export interface PermissionCheckResult {
  allowed: boolean;
  requiresConfirmation?: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AgentPermissionsConfig {
  version: string;
  permissions: {
    fileOperations: Record<string, any>;
    terminalCommands: {
      allowed: Record<
        string,
        { commands: string[]; blocked?: string[]; description?: string }
      >;
      blocked: Record<string, string[]>;
    };
    dataStoreOperations: Record<
      string,
      { allowed: boolean; requiresConfirmation?: boolean }
    >;
    schemaChanges: Record<string, any>;
    configurationFiles: {
      readOnly: { paths: string[] };
      modifiable: any;
    };
    agentSkills: {
      allowed: boolean;
      skillPermissions: Record<
        string,
        {
          canCreate: boolean;
          canModify: boolean;
          canDelete: boolean;
          requiresConfirmation: boolean;
        }
      >;
    };
  };
  safeModes?: {
    dryRun?: { enabled: boolean };
    confirmAll?: { enabled: boolean };
    readOnly?: { enabled: boolean };
  };
  logging?: {
    enabled: boolean;
    logPath: string;
    logLevel: string;
  };
  validation?: {
    fileSize?: {
      maxSingleFile: number;
      maxTotalBatch: number;
    };
    batchOperations?: {
      maxFilesPerBatch: number;
      requiresConfirmation: boolean;
    };
  };
  exemptions?: {
    users?: string[];
    skills?: string[];
    paths?: string[];
  };
}

/**
 * Agent Permissions Manager
 *
 * Loads and enforces permission rules for agent operations.
 */
export class AgentPermissions {
  private config!: AgentPermissionsConfig;
  private configPath: string;
  private operationLog: Array<{
    timestamp: Date;
    operation: Operation;
    path?: string;
    result: string;
  }> = [];

  constructor(configPath?: string) {
    this.configPath =
      configPath ||
      path.join(process.cwd(), ".github", "agent-permissions.json");
  }

  /**
   * Load permissions configuration from disk
   */
  async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(configData);
    } catch (error) {
      throw new Error(
        `Failed to load agent permissions config from ${this.configPath}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Check if an operation is allowed
   */
  async checkPermission(
    input: PermissionCheckInput,
  ): Promise<PermissionCheckResult> {
    if (!this.config) {
      await this.load();
    }

    // Check safe modes first
    if (
      this.config.safeModes?.readOnly?.enabled &&
      input.operation !== "read"
    ) {
      return {
        allowed: false,
        reason: "Read-only mode is enabled. All write operations are blocked.",
      };
    }

    if (this.config.safeModes?.dryRun?.enabled) {
      return {
        allowed: true,
        requiresConfirmation: false,
        reason: "Dry-run mode: operation will be simulated only",
        metadata: { dryRun: true },
      };
    }

    // Check exemptions
    if (input.skill && this.config.exemptions?.skills?.includes(input.skill)) {
      return {
        allowed: true,
        reason: "Skill is exempt from permission checks",
      };
    }

    if (input.path && this.isPathExempt(input.path)) {
      return { allowed: true, reason: "Path is exempt from permission checks" };
    }

    // Route to specific permission checker
    switch (input.operation) {
      case "read":
        return this.checkReadPermission(input.path!);
      case "write":
        return this.checkWritePermission(input.path!, input.fileSize);
      case "delete":
        return this.checkDeletePermission(input.path!);
      case "rename":
        return this.checkRenamePermission(input.path!);
      case "terminal":
        return this.checkTerminalPermission(input.command!);
      case "datastore.query":
      case "datastore.save":
      case "datastore.delete":
      case "datastore.clear":
        return this.checkDataStorePermission(input.operation);
      default:
        return {
          allowed: false,
          reason: `Unknown operation: ${input.operation}`,
        };
    }
  }

  /**
   * Check read permission for a file path
   */
  private checkReadPermission(filePath: string): PermissionCheckResult {
    const readConfig = this.config.permissions.fileOperations.read;

    if (!readConfig.allowed) {
      return { allowed: false, reason: "Read operations are disabled" };
    }

    // Check excluded paths (sensitive files)
    if (
      readConfig.excludePaths &&
      this.matchesAnyPattern(filePath, readConfig.excludePaths)
    ) {
      return {
        allowed: false,
        reason: "This file contains sensitive credentials or configuration",
      };
    }

    return { allowed: true };
  }

  /**
   * Check write permission for a file path
   */
  private checkWritePermission(
    filePath: string,
    fileSize?: number,
  ): PermissionCheckResult {
    // Check configuration file protection
    const readOnlyPaths =
      this.config.permissions.configurationFiles.readOnly.paths;
    if (this.matchesAnyPattern(filePath, readOnlyPaths)) {
      return {
        allowed: false,
        reason:
          "This is a critical configuration file and cannot be modified by agents",
      };
    }

    // Check file size limits
    if (fileSize && this.config.validation?.fileSize) {
      const maxSize = this.config.validation.fileSize.maxSingleFile;
      if (fileSize > maxSize) {
        return {
          allowed: false,
          reason: `File size (${fileSize} bytes) exceeds maximum allowed (${maxSize} bytes)`,
        };
      }
    }

    // Check schema changes (highly restricted)
    const schemaConfig = this.config.permissions.schemaChanges;
    for (const [key, config] of Object.entries(schemaConfig)) {
      if (config.paths && this.matchesAnyPattern(filePath, config.paths)) {
        if (!config.allowed) {
          return {
            allowed: false,
            reason: `Schema changes (${key}) are not allowed by agents`,
          };
        }
        if (config.requiresConfirmation) {
          return {
            allowed: true,
            requiresConfirmation: true,
            reason: `Schema change (${key}) requires explicit confirmation`,
          };
        }
      }
    }

    // Check unrestricted write paths
    const writeConfig = this.config.permissions.fileOperations.write;
    if (
      writeConfig.allowedPaths &&
      this.matchesAnyPattern(filePath, writeConfig.allowedPaths)
    ) {
      // Exclude any explicitly excluded paths
      if (
        writeConfig.excludePaths &&
        this.matchesAnyPattern(filePath, writeConfig.excludePaths)
      ) {
        return {
          allowed: false,
          reason: "This path is excluded from automatic writes",
        };
      }
      return { allowed: true, requiresConfirmation: false };
    }

    // Check restricted write paths (requires confirmation)
    const restrictedConfig =
      this.config.permissions.fileOperations.writeRestricted;
    if (
      restrictedConfig.allowedPaths &&
      this.matchesAnyPattern(filePath, restrictedConfig.allowedPaths)
    ) {
      if (
        restrictedConfig.excludePaths &&
        this.matchesAnyPattern(filePath, restrictedConfig.excludePaths)
      ) {
        return {
          allowed: false,
          reason: "This path is excluded from writes",
        };
      }
      return {
        allowed: true,
        requiresConfirmation: !this.config.safeModes?.confirmAll?.enabled
          ? true
          : false,
        reason: "Production code modification requires confirmation",
      };
    }

    // Default: deny writes to unlisted paths
    return {
      allowed: false,
      reason:
        "This path is not in the allowed write locations. Add it to agent-permissions.json if needed.",
    };
  }

  /**
   * Check delete permission for a file path
   */
  private checkDeletePermission(filePath: string): PermissionCheckResult {
    const deleteConfig = this.config.permissions.fileOperations.delete;

    if (!deleteConfig.allowed) {
      return {
        allowed: false,
        reason: "Delete operations are disabled by default",
      };
    }

    if (
      deleteConfig.allowedPaths &&
      this.matchesAnyPattern(filePath, deleteConfig.allowedPaths)
    ) {
      return {
        allowed: true,
        requiresConfirmation: deleteConfig.requiresConfirmation ?? true,
        reason: "File deletion requires explicit confirmation",
      };
    }

    return {
      allowed: false,
      reason: "This file type cannot be deleted by agents",
    };
  }

  /**
   * Check rename permission
   */
  private checkRenamePermission(filePath: string): PermissionCheckResult {
    const renameConfig = this.config.permissions.fileOperations.rename;

    if (!renameConfig.allowed) {
      return {
        allowed: false,
        reason: "Rename operations are disabled",
      };
    }

    return {
      allowed: true,
      requiresConfirmation: renameConfig.requiresConfirmation ?? true,
      reason: "File rename requires explicit confirmation",
    };
  }

  /**
   * Check terminal command permission
   */
  private checkTerminalPermission(command: string): PermissionCheckResult {
    const commandConfig = this.config.permissions.terminalCommands;

    // Check blocked commands first
    for (const [category, commands] of Object.entries(commandConfig.blocked)) {
      // Skip non-array fields like "description"
      if (!Array.isArray(commands)) continue;

      for (const blockedCmd of commands) {
        if (command.includes(blockedCmd)) {
          return {
            allowed: false,
            reason: `Blocked command (${category}): ${blockedCmd}`,
          };
        }
      }
    }

    // Check allowed commands
    for (const [category, config] of Object.entries(commandConfig.allowed)) {
      // Check if command contains any blocked sub-commands for this category
      if (config.blocked) {
        for (const blockedCmd of config.blocked) {
          if (command.includes(blockedCmd)) {
            return {
              allowed: false,
              reason: `Blocked ${category} command: ${blockedCmd}`,
            };
          }
        }
      }

      // Check if command matches allowed patterns
      if (config.commands) {
        for (const allowedCmd of config.commands) {
          if (command.includes(allowedCmd) || command.startsWith(allowedCmd)) {
            return { allowed: true };
          }
        }
      }
    }

    return {
      allowed: false,
      reason: `Command not in allowed list. Check agent-permissions.json to add it.`,
    };
  }

  /**
   * Check DataStore operation permission
   */
  private checkDataStorePermission(operation: string): PermissionCheckResult {
    const dsOperation = operation.replace("datastore.", "");
    const dsConfig = this.config.permissions.dataStoreOperations[dsOperation];

    if (!dsConfig) {
      return {
        allowed: false,
        reason: `Unknown DataStore operation: ${dsOperation}`,
      };
    }

    if (!dsConfig.allowed) {
      return {
        allowed: false,
        reason: `DataStore ${dsOperation} operations are not allowed by agents`,
      };
    }

    return {
      allowed: true,
      requiresConfirmation: dsConfig.requiresConfirmation ?? false,
      reason: dsConfig.requiresConfirmation
        ? `DataStore ${dsOperation} requires confirmation`
        : undefined,
    };
  }

  /**
   * Check if a path is exempt from permission checks
   */
  private isPathExempt(filePath: string): boolean {
    const exemptPaths = this.config.exemptions?.paths || [];
    return this.matchesAnyPattern(filePath, exemptPaths);
  }

  /**
   * Check if a path matches any of the given glob patterns
   */
  private matchesAnyPattern(filePath: string, patterns: string[]): boolean {
    return patterns.some((pattern) =>
      minimatch(filePath, pattern, { dot: true }),
    );
  }

  /**
   * Log an operation for audit trail
   */
  async logOperation(
    operation: Operation,
    filePath: string | undefined,
    result: "allowed" | "denied" | "confirmed",
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!this.config.logging?.enabled) {
      return;
    }

    const logEntry = {
      timestamp: new Date(),
      operation,
      path: filePath,
      result,
      ...metadata,
    };

    this.operationLog.push(logEntry);

    // Write to log file
    try {
      const logPath = path.join(process.cwd(), this.config.logging.logPath);
      const logDir = path.dirname(logPath);

      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });

      // Append to log file
      await fs.appendFile(logPath, JSON.stringify(logEntry) + "\n", "utf-8");
    } catch (error) {
      console.warn(
        `Failed to write operation log: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get recent operation logs
   */
  getRecentLogs(count: number = 100): Array<any> {
    return this.operationLog.slice(-count);
  }

  /**
   * Check skill-specific permissions
   */
  async checkSkillPermission(
    skillName: string,
    operation: "create" | "modify" | "delete",
  ): Promise<PermissionCheckResult> {
    if (!this.config.permissions.agentSkills.allowed) {
      return {
        allowed: false,
        reason: "Agent skills are disabled",
      };
    }

    const skillConfig =
      this.config.permissions.agentSkills.skillPermissions[skillName];
    if (!skillConfig) {
      return {
        allowed: true,
        reason: "No specific restrictions for this skill",
      };
    }

    const operationKey =
      `can${operation.charAt(0).toUpperCase() + operation.slice(1)}` as keyof typeof skillConfig;
    const allowed = skillConfig[operationKey];

    if (!allowed) {
      return {
        allowed: false,
        reason: `Skill ${skillName} is not allowed to ${operation}`,
      };
    }

    return {
      allowed: true,
      requiresConfirmation: skillConfig.requiresConfirmation ?? false,
    };
  }

  /**
   * Enable or disable safe mode
   */
  setSafeMode(
    mode: "dryRun" | "readOnly" | "confirmAll",
    enabled: boolean,
  ): void {
    if (!this.config.safeModes) {
      this.config.safeModes = {};
    }
    if (!this.config.safeModes[mode]) {
      this.config.safeModes[mode] = { enabled: false };
    }
    this.config.safeModes[mode]!.enabled = enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentPermissionsConfig {
    return this.config;
  }
}

/**
 * Global permissions instance
 */
let globalPermissions: AgentPermissions | null = null;

/**
 * Get or create global permissions instance
 */
export async function getPermissions(
  configPath?: string,
): Promise<AgentPermissions> {
  if (!globalPermissions) {
    globalPermissions = new AgentPermissions(configPath);
    await globalPermissions.load();
  }
  return globalPermissions;
}

/**
 * Convenience function to check permission
 */
export async function checkPermission(
  input: PermissionCheckInput,
): Promise<PermissionCheckResult> {
  const permissions = await getPermissions();
  return permissions.checkPermission(input);
}

/**
 * Execute an operation with automatic permission checking
 */
export async function executeWithPermissions<T>(
  operation: Operation,
  path: string | undefined,
  executor: () => Promise<T>,
  options?: {
    skill?: string;
    fileSize?: number;
    confirmPrompt?: (reason: string) => Promise<boolean>;
  },
): Promise<T> {
  const permissions = await getPermissions();

  const result = await permissions.checkPermission({
    operation,
    path,
    skill: options?.skill,
    fileSize: options?.fileSize,
  });

  if (!result.allowed) {
    await permissions.logOperation(operation, path, "denied", {
      reason: result.reason,
    });
    throw new Error(`Permission denied: ${result.reason}`);
  }

  if (result.requiresConfirmation) {
    if (!options?.confirmPrompt) {
      throw new Error(
        `Confirmation required but no prompt function provided: ${result.reason}`,
      );
    }

    const confirmed = await options.confirmPrompt(
      result.reason || "Confirm this operation?",
    );
    if (!confirmed) {
      await permissions.logOperation(operation, path, "denied", {
        reason: "User declined confirmation",
      });
      throw new Error("Operation cancelled by user");
    }

    await permissions.logOperation(operation, path, "confirmed");
  } else {
    await permissions.logOperation(operation, path, "allowed");
  }

  // Execute if dry-run is disabled
  if (result.metadata?.dryRun) {
    console.log(`[DRY RUN] Would execute: ${operation} on ${path}`);
    return null as T;
  }

  return executor();
}
