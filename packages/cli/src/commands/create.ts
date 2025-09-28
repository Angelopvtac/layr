import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { AgentRunner } from '@layr/agent';
import type { Intent } from '@layr/core';
import fs from 'fs';
import path from 'path';

export const createCommand = new Command('create')
  .description('Create a new app from natural language description')
  .argument('[description]', 'App description in plain English')
  .option('-i, --intent <file>', 'Path to intent JSON file')
  .option('-o, --output <dir>', 'Output directory', './app')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (description, options) => {
    let intent: Intent;

    // Get intent from file or description
    if (options.intent) {
      try {
        const intentPath = path.resolve(options.intent);
        const content = fs.readFileSync(intentPath, 'utf-8');
        intent = JSON.parse(content);
        console.log(chalk.green('✓ Loaded intent from file'));
      } catch (error) {
        console.error(chalk.red('Failed to load intent file:'), error);
        process.exit(1);
      }
    } else if (description) {
      // Use natural language description
      const runner = new AgentRunner();
      const spinner = ora('Interpreting your request...').start();
      intent = await runner.interpretRequest(description);
      spinner.succeed('Request interpreted');
    } else {
      // Interactive mode
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'goal',
          message: 'What kind of app do you want to build?',
          validate: (input) => input.length > 0 || 'Please describe your app',
        },
        {
          type: 'list',
          name: 'audience',
          message: 'Who is your target audience?',
          choices: ['business', 'consumer', 'internal', 'developer'],
          default: 'business',
        },
        {
          type: 'checkbox',
          name: 'capabilities',
          message: 'What capabilities do you need?',
          choices: [
            { name: 'User authentication', value: 'auth' },
            { name: 'Database & CRUD operations', value: 'crud' },
            { name: 'Payment processing', value: 'payments' },
            { name: 'Email notifications', value: 'email' },
            { name: 'File uploads', value: 'files' },
            { name: 'Real-time updates', value: 'realtime' },
            { name: 'Search functionality', value: 'search' },
            { name: 'Analytics dashboard', value: 'analytics' },
          ],
        },
        {
          type: 'list',
          name: 'auth',
          message: 'What type of authentication?',
          choices: ['magic_link', 'email_password', 'oauth', 'none'],
          when: (answers) => answers.capabilities.includes('auth'),
        },
      ]);

      intent = {
        goal: answers.goal,
        audience: answers.audience,
        capabilities: answers.capabilities,
        auth: answers.auth || 'none',
      };
    }

    // Show intent summary
    console.log(chalk.cyan('\n📋 Intent Summary:'));
    console.log(chalk.gray('  Goal:'), intent.goal);
    console.log(chalk.gray('  Audience:'), intent.audience);
    console.log(chalk.gray('  Capabilities:'), (intent.capabilities || []).join(', ') || 'none');
    console.log(chalk.gray('  Auth:'), intent.auth || 'none');

    // Confirm before proceeding
    if (!options.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with app creation?',
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Cancelled'));
        process.exit(0);
      }
    }

    // Run the pipeline
    console.log(chalk.cyan('\n🚀 Starting Layr pipeline...\n'));

    const runner = new AgentRunner();
    const result = await runner.run(intent);

    if (result.success && result.previewUrl) {
      console.log(chalk.green('\n✅ Success! Your app is ready'));
      console.log(chalk.cyan('Preview URL:'), chalk.underline(result.previewUrl));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Visit your preview URL'));
      console.log(chalk.gray('  2. Test the functionality'));
      console.log(chalk.gray('  3. Run `layr deploy` to go to production'));
    } else {
      console.error(chalk.red('\n❌ Pipeline failed'));
      console.log(chalk.gray('Run with --debug for more information'));
      process.exit(1);
    }
  });