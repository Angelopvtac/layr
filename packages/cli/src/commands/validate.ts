import { Command } from 'commander';
import chalk from 'chalk';
import { validateIntent } from '@layr/core';
import fs from 'fs';
import path from 'path';

export const validateCommand = new Command('validate')
  .description('Validate an intent JSON file')
  .argument('<file>', 'Path to intent JSON file')
  .action(async (file) => {
    const intentPath = path.resolve(file);

    // Check if file exists
    if (!fs.existsSync(intentPath)) {
      console.error(chalk.red(`File not found: ${intentPath}`));
      process.exit(1);
    }

    try {
      // Read and parse the file
      const content = fs.readFileSync(intentPath, 'utf-8');
      const intent = JSON.parse(content);

      // Validate the intent
      const result = validateIntent(intent);

      if (result.valid) {
        console.log(chalk.green('✅ Intent is valid!\n'));

        // Display intent summary
        console.log(chalk.cyan('Intent Summary:'));
        console.log(chalk.gray('  Goal:'), intent.goal);
        console.log(chalk.gray('  Audience:'), intent.audience || 'not specified');
        console.log(chalk.gray('  Capabilities:'), (intent.capabilities || []).join(', ') || 'none');
        console.log(chalk.gray('  Auth:'), intent.auth || 'none');

        if (intent.entities && intent.entities.length > 0) {
          console.log(chalk.gray('\n  Entities:'));
          intent.entities.forEach((entity: any) => {
            console.log(chalk.gray(`    - ${entity.name} (${entity.fields.length} fields)`));
          });
        }

        if (intent.payments) {
          console.log(chalk.gray('\n  Payments:'));
          console.log(chalk.gray('    Provider:'), intent.payments.provider);
          console.log(chalk.gray('    Model:'), intent.payments.model);
        }
      } else {
        console.error(chalk.red('❌ Intent validation failed!\n'));

        if (result.errors && result.errors.length > 0) {
          console.log(chalk.yellow('Validation errors:'));
          result.errors.forEach((error: any) => {
            console.log(chalk.red('  •'), error.message);
            if (error.instancePath) {
              console.log(chalk.gray('    Path:'), error.instancePath);
            }
          });
        }

        process.exit(1);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(chalk.red('Invalid JSON:'), error.message);
      } else {
        console.error(chalk.red('Error:'), error);
      }
      process.exit(1);
    }
  });