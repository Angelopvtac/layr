import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const devCommand = new Command('dev')
  .description('Start development server')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('-P, --port <port>', 'Port to run on', '3000')
  .action(async (options) => {
    const projectDir = path.resolve(options.project);
    const packageJsonPath = path.join(projectDir, 'package.json');

    // Check if project exists
    if (!fs.existsSync(packageJsonPath)) {
      console.error(chalk.red(`No package.json found in: ${projectDir}`));
      process.exit(1);
    }

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Check for dev script
    if (!packageJson.scripts?.dev) {
      console.error(chalk.red('No "dev" script found in package.json'));
      console.log(chalk.gray('Add a dev script to your package.json:'));
      console.log(chalk.gray('  "scripts": {'));
      console.log(chalk.gray('    "dev": "next dev"'));
      console.log(chalk.gray('  }'));
      process.exit(1);
    }

    console.log(chalk.cyan('\n🚀 Starting development server...\n'));

    // Set environment variables
    const env = { ...process.env };
    if (options.port) {
      env.PORT = options.port;
    }

    // Determine package manager
    let command = 'npm';
    let args = ['run', 'dev'];

    if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
      command = 'pnpm';
      args = ['dev'];
    } else if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
      command = 'yarn';
      args = ['dev'];
    }

    // Spawn the dev server
    const devProcess = spawn(command, args, {
      cwd: projectDir,
      env,
      stdio: 'inherit',
      shell: true,
    });

    devProcess.on('error', (error) => {
      console.error(chalk.red('Failed to start dev server:'), error);
      process.exit(1);
    });

    devProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`Dev server exited with code ${code}`));
        process.exit(code || 1);
      }
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nShutting down dev server...'));
      devProcess.kill('SIGINT');
      process.exit(0);
    });
  });