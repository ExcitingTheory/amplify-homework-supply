#!/usr/bin/env node
/**
 * Agent Permissions CLI
 * 
 * Command-line tool for checking and enforcing agent operation permissions.
 * 
 * Usage:
 *   npx agent-cli check --operation write --path src/components/NewComponent.tsx
 *   npx agent-cli execute-skill storybook-validation --dry-run
 *   npx agent-cli logs --recent 50
 */

import { Command } from 'commander';
import { getPermissions, executeWithPermissions } from '../src/utils/agentPermissions';
import * as readline from 'readline';
import chalk from 'chalk';

const program = new Command();

/**
 * Prompt user for confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`\n⚠️  ${message}\n\nAllow this operation? [y/N] `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Format permission check result
 */
function formatResult(result: any): string {
  if (!result.allowed) {
    return chalk.red(`❌ Permission Denied\n   Reason: ${result.reason}`);
  }
  
  if (result.requiresConfirmation) {
    return chalk.yellow(`⚠️  Confirmation Required\n   Reason: ${result.reason || 'Manual approval needed'}`);
  }
  
  return chalk.green(`✅ Allowed${result.reason ? `\n   Note: ${result.reason}` : ''}`);
}

program
  .name('agent-cli')
  .description('Agent permissions management CLI')
  .version('1.0.0');

// Check command
program
  .command('check')
  .description('Check if an operation is allowed')
  .requiredOption('--operation <type>', 'Operation type (read, write, delete, rename, terminal)')
  .option('--path <path>', 'File path')
  .option('--command <cmd>', 'Terminal command')
  .option('--skill <name>', 'Agent skill name')
  .option('--size <bytes>', 'File size in bytes')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      
      const result = await permissions.checkPermission({
        operation: options.operation,
        path: options.path,
        command: options.command,
        skill: options.skill,
        fileSize: options.size ? parseInt(options.size) : undefined
      });

      console.log('\n' + chalk.bold('Permission Check Result:'));
      console.log(formatResult(result));
      
      if (result.metadata) {
        console.log(chalk.dim(`\nMetadata: ${JSON.stringify(result.metadata, null, 2)}`));
      }

      process.exit(result.allowed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Execute command
program
  .command('execute')
  .description('Execute a file operation with permission checks')
  .requiredOption('--operation <type>', 'Operation type (read, write, delete, rename)')
  .requiredOption('--path <path>', 'File path')
  .option('--skill <name>', 'Agent skill name')
  .option('--dry-run', 'Simulate operation without executing')
  .option('--no-confirm', 'Skip confirmation prompts (danger!)')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      
      if (options.dryRun) {
        permissions.setSafeMode('dryRun', true);
      }

      const result = await permissions.checkPermission({
        operation: options.operation,
        path: options.path,
        skill: options.skill
      });

      console.log('\n' + chalk.bold('Permission Check:'));
      console.log(formatResult(result));

      if (!result.allowed) {
        process.exit(1);
      }

      if (result.requiresConfirmation && !options.dryRun) {
        const confirmed = options.confirm !== false 
          ? await promptConfirmation(result.reason || 'Confirm this operation?')
          : true;

        if (!confirmed) {
          console.log(chalk.red('\n❌ Operation cancelled by user'));
          process.exit(1);
        }
      }

      if (options.dryRun) {
        console.log(chalk.cyan(`\n[DRY RUN] Would execute: ${options.operation} on ${options.path}`));
      } else {
        console.log(chalk.green(`\n✅ Operation allowed - proceed with execution`));
      }

      await permissions.logOperation(options.operation, options.path, 'allowed', {
        skill: options.skill,
        dryRun: options.dryRun
      });

      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Logs command
program
  .command('logs')
  .description('View recent operation logs')
  .option('--recent <count>', 'Number of recent logs to show', '50')
  .option('--operation <type>', 'Filter by operation type')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      let logs = permissions.getRecentLogs(parseInt(options.recent));

      if (options.operation) {
        logs = logs.filter(log => log.operation === options.operation);
      }

      if (logs.length === 0) {
        console.log(chalk.dim('\nNo logs found'));
        process.exit(0);
      }

      console.log(chalk.bold(`\nRecent Operations (${logs.length}):\n`));
      
      logs.forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const resultColor = log.result === 'allowed' ? chalk.green 
          : log.result === 'denied' ? chalk.red 
          : chalk.yellow;

        console.log(`${chalk.dim(`${index + 1}.`)} ${chalk.bold(log.operation)} ${log.path || ''}`);
        console.log(`   ${chalk.dim('Time:')} ${timestamp}`);
        console.log(`   ${chalk.dim('Result:')} ${resultColor(log.result)}`);
        if (log.reason) {
          console.log(`   ${chalk.dim('Reason:')} ${log.reason}`);
        }
        console.log('');
      });

      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Safe mode command
program
  .command('safe-mode')
  .description('Enable or disable safe modes')
  .requiredOption('--mode <type>', 'Safe mode (dryRun, readOnly, confirmAll)')
  .requiredOption('--enable <bool>', 'Enable (true) or disable (false)')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      const enable = options.enable === 'true';
      
      permissions.setSafeMode(options.mode, enable);
      
      const status = enable ? chalk.green('enabled') : chalk.red('disabled');
      console.log(chalk.bold(`\n${options.mode} mode ${status}`));
      
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Skill command
program
  .command('skill')
  .description('Check skill-specific permissions')
  .requiredOption('--name <name>', 'Skill name')
  .requiredOption('--operation <type>', 'Operation (create, modify, delete)')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      
      const result = await permissions.checkSkillPermission(
        options.name,
        options.operation
      );

      console.log(chalk.bold(`\nSkill Permission Check: ${options.name}`));
      console.log(formatResult(result));

      process.exit(result.allowed ? 0 : 1);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Display current permissions configuration')
  .option('--section <name>', 'Show specific section only')
  .action(async (options) => {
    try {
      const permissions = await getPermissions();
      const config = permissions.getConfig();

      console.log(chalk.bold('\nAgent Permissions Configuration:\n'));

      if (options.section) {
        console.log(JSON.stringify(config[options.section], null, 2));
      } else {
        console.log(chalk.dim('Version:'), config.version);
        console.log(chalk.dim('Description:'), config.description);
        console.log('\n' + chalk.bold('Available Sections:'));
        console.log('  - permissions');
        console.log('  - safeModes');
        console.log('  - logging');
        console.log('  - validation');
        console.log('  - exemptions');
        console.log('\nUse --section <name> to view details');
      }

      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.bold('\nAgent CLI Usage Examples:\n'));
    
    console.log(chalk.cyan('Check if you can write a file:'));
    console.log('  agent-cli check --operation write --path src/components/NewComponent.tsx\n');
    
    console.log(chalk.cyan('Check if a terminal command is allowed:'));
    console.log('  agent-cli check --operation terminal --command "npm test"\n');
    
    console.log(chalk.cyan('Execute operation with confirmation:'));
    console.log('  agent-cli execute --operation write --path test.txt\n');
    
    console.log(chalk.cyan('Dry-run mode (simulate only):'));
    console.log('  agent-cli execute --operation write --path dangerous.txt --dry-run\n');
    
    console.log(chalk.cyan('Check skill permissions:'));
    console.log('  agent-cli skill --name mock-data-validator --operation create\n');
    
    console.log(chalk.cyan('View recent operation logs:'));
    console.log('  agent-cli logs --recent 20\n');
    
    console.log(chalk.cyan('Enable read-only safe mode:'));
    console.log('  agent-cli safe-mode --mode readOnly --enable true\n');
    
    console.log(chalk.cyan('View configuration:'));
    console.log('  agent-cli config\n');
    console.log('  agent-cli config --section permissions\n');
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
