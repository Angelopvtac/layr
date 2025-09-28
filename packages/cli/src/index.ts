#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
import { deployCommand } from './commands/deploy';
import { devCommand } from './commands/dev';
import { validateCommand } from './commands/validate';
import { migrateCommand } from './commands/migrate';
import { version } from '../package.json';

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
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  program.outputHelp();
  process.exit(1);
});

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