#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createLogger } from '@layr/core';
import { createCommand } from './commands/create';
import { deployCommand } from './commands/deploy';
import { devCommand } from './commands/dev';
import { validateCommand } from './commands/validate';
import { migrateCommand } from './commands/migrate';
import { version } from '../package.json';

const logger = createLogger('layr-cli');

const program = new Command();

program
  .name('layr')
  .description('Natural language to production app in one command')
  .version(version);

// Register commands
program.addCommand(createCommand);
program.addCommand(deployCommand);
program.addCommand(devCommand);
program.addCommand(validateCommand);
program.addCommand(migrateCommand);

// Error handling
program.on('command:*', () => {
  logger.error(`Invalid command`, { command: program.args.join(' ') });
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  program.outputHelp();
  process.exit(1);
});

// Global error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  console.error(chalk.red('Fatal error occurred:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason as Error, { promise });
  console.error(chalk.red('Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Only parse if running as main module
if (require.main === module) {
  // Parse arguments
  program.parse(process.argv);

  // Show help if no command
  if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║                                       ║
║     🚀 Welcome to Layr v${version}          ║
║                                       ║
║  Natural language → Production app    ║
║                                       ║
╚═══════════════════════════════════════╝
`));
    program.outputHelp();
  }
}

export { program };