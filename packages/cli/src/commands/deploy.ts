import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AdapterFactory } from '@layr/mcp';
import path from 'path';
import fs from 'fs';

export const deployCommand = new Command('deploy')
  .description('Deploy your app to production')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('--preview', 'Deploy to preview environment')
  .option('--production', 'Deploy to production (default)')
  .action(async (options) => {
    const projectDir = path.resolve(options.project);
    const env = options.preview ? 'preview' : 'production';

    // Check if project exists
    if (!fs.existsSync(projectDir)) {
      console.error(chalk.red(`Project directory not found: ${projectDir}`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n🚀 Deploying to ${env}...\n`));

    const factory = new AdapterFactory();
    const spinner = ora();

    try {
      // Deploy to Vercel
      spinner.start('Deploying to Vercel...');
      const vercelAdapter = await factory.createVercelAdapter();
      const deployResult = await vercelAdapter.deploy(projectDir, {
        env: env as 'production' | 'preview',
      });
      spinner.succeed(`Deployed to Vercel: ${chalk.underline(deployResult.url)}`);

      // Check for environment variables to set
      const envFile = path.join(projectDir, '.env.production');
      if (fs.existsSync(envFile)) {
        spinner.start('Setting environment variables...');
        const envContent = fs.readFileSync(envFile, 'utf-8');
        const envVars: Record<string, string> = {};

        envContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        });

        if (Object.keys(envVars).length > 0) {
          await vercelAdapter.setEnvVars(envVars);
          spinner.succeed('Environment variables configured');
        } else {
          spinner.info('No environment variables to set');
        }
      }

      // Success summary
      console.log(chalk.green('\n✅ Deployment successful!\n'));
      console.log(chalk.cyan('🌐 URL:'), chalk.underline(deployResult.url));
      console.log(chalk.cyan('🆔 Deployment ID:'), deployResult.deploymentId);

      if (env === 'preview') {
        console.log(chalk.gray('\nTo deploy to production:'));
        console.log(chalk.gray('  layr deploy --production'));
      }
    } catch (error) {
      spinner.fail('Deployment failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });