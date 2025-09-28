import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AdapterFactory } from '@layr/mcp';
import fs from 'fs';
import path from 'path';

export const migrateCommand = new Command('migrate')
  .description('Run database migrations')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('-f, --file <file>', 'Migration file to run')
  .option('-d, --dir <dir>', 'Migrations directory', 'migrations')
  .option('--dry-run', 'Show migrations without running them')
  .action(async (options) => {
    const projectDir = path.resolve(options.project);
    const migrationsDir = path.join(projectDir, options.dir);

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(chalk.red(`Migrations directory not found: ${migrationsDir}`));
      console.log(chalk.gray('Create a migrations directory with SQL files'));
      process.exit(1);
    }

    // Get migration files
    let migrationFiles: string[] = [];

    if (options.file) {
      // Single file specified
      const filePath = path.join(migrationsDir, options.file);
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`Migration file not found: ${filePath}`));
        process.exit(1);
      }
      migrationFiles = [options.file];
    } else {
      // All SQL files in directory
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    }

    if (migrationFiles.length === 0) {
      console.log(chalk.yellow('No migration files found'));
      process.exit(0);
    }

    console.log(chalk.cyan('\n📦 Database Migrations\n'));
    console.log(chalk.gray('Found migrations:'));
    migrationFiles.forEach(file => {
      console.log(chalk.gray(`  • ${file}`));
    });

    if (options.dryRun) {
      console.log(chalk.yellow('\n[DRY RUN] Migrations not executed'));
      process.exit(0);
    }

    const spinner = ora();
    const factory = new AdapterFactory();

    try {
      // Initialize Supabase adapter
      spinner.start('Connecting to database...');

      // Look for Supabase credentials
      const envFile = path.join(projectDir, '.env.local');
      let supabaseConfig: any = {};

      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf-8');
        const lines = envContent.split('\n');

        lines.forEach(line => {
          if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseConfig.url = line.split('=')[1].trim();
          }
          if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            supabaseConfig.serviceKey = line.split('=')[1].trim();
          }
        });
      }

      const supabaseAdapter = await factory.createSupabaseAdapter(supabaseConfig);
      spinner.succeed('Connected to database');

      // Run migrations
      const migrations: string[] = [];
      for (const file of migrationFiles) {
        spinner.start(`Running ${file}...`);
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        migrations.push(content);
      }

      const success = await supabaseAdapter.runMigrations(migrations);

      if (success) {
        spinner.succeed(`Ran ${migrationFiles.length} migrations`);
        console.log(chalk.green('\n✅ All migrations completed successfully'));
      } else {
        spinner.fail('Migration failed');
        process.exit(1);
      }

      // Record migration history
      const historyFile = path.join(projectDir, '.layr', 'migration-history.json');
      const historyDir = path.dirname(historyFile);

      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }

      let history: any[] = [];
      if (fs.existsSync(historyFile)) {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      }

      migrationFiles.forEach(file => {
        history.push({
          file,
          appliedAt: new Date().toISOString(),
        });
      });

      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
      console.log(chalk.gray('Migration history updated'));

    } catch (error) {
      spinner.fail('Migration failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });