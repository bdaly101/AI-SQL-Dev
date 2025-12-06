#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { MigrationCollector } from './collectors/migration-collector';
import { UsagePatternScanner } from './collectors/usage-pattern-scanner';
import { ClaudeService } from './ai/claude-service';
import { MigrationGenerator } from './generators/migration-generator';
import { ChecklistGenerator } from './generators/checklist-generator';

const program = new Command();

program
  .name('ai-sql-dev')
  .description('Analyze Supabase schema and generate intelligent RLS policies using AI')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate RLS policies based on your codebase')
  .option('-m, --migrations <path>', 'Path to migrations directory', 'supabase/migrations')
  .option('-s, --source <path>', 'Path to source code directory', 'src')
  .option('-o, --output <path>', 'Output directory for generated migration', 'supabase/migrations')
  .option('-k, --api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY env var)')
  .option('--no-checklist', 'Skip generating markdown checklist')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🤖 AI SQL Dev - Intelligent RLS Policy Generator\n'));

    try {
      // Step 1: Collect migration schemas
      const schemaSpinner = ora('Collecting table schemas from migrations...').start();
      const migrationCollector = new MigrationCollector(options.migrations);
      const schemas = await migrationCollector.collectSchemas();
      const rlsPolicies = await migrationCollector.collectRLSPolicies();
      schemaSpinner.succeed(`Found ${chalk.green(schemas.length)} tables and ${chalk.green(rlsPolicies.length)} existing RLS policies`);

      // Step 2: Scan TypeScript usage patterns
      const scanSpinner = ora('Scanning TypeScript files for Supabase usage patterns...').start();
      const scanner = new UsagePatternScanner(options.source);
      const usagePatterns = await scanner.scanUsagePatterns();
      scanSpinner.succeed(`Found ${chalk.green(usagePatterns.length)} Supabase client usage patterns`);

      if (schemas.length === 0) {
        console.log(chalk.yellow('\n⚠️  No table schemas found. Make sure migrations exist in the specified directory.'));
        return;
      }

      // Display summary
      console.log(chalk.cyan('\n📊 Summary:'));
      console.log(`  Tables: ${schemas.map(s => s.name).join(', ')}`);
      
      const tablesWithUserFilter = new Set(
        usagePatterns.filter(p => p.hasUserIdFilter).map(p => p.table)
      );
      const tablesWithTenantFilter = new Set(
        usagePatterns.filter(p => p.hasTenantIdFilter).map(p => p.table)
      );
      
      if (tablesWithUserFilter.size > 0) {
        console.log(`  Tables with user_id patterns: ${Array.from(tablesWithUserFilter).join(', ')}`);
      }
      if (tablesWithTenantFilter.size > 0) {
        console.log(`  Tables with tenant_id patterns: ${Array.from(tablesWithTenantFilter).join(', ')}`);
      }

      // Confirm with user
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with AI-powered RLS policy generation?',
        default: true
      }]);

      if (!confirm) {
        console.log(chalk.yellow('\nAborted.'));
        process.exit(0);
      }

      // Step 3: Generate RLS policies with Claude
      const aiSpinner = ora('Generating RLS policies with Claude AI...').start();
      const claudeService = new ClaudeService(options.apiKey);
      const migrationContext = {
        schemas,
        rlsPolicies,
        usagePatterns
      };
      
      const generatedSQL = await claudeService.generateRLSPolicies(migrationContext);
      aiSpinner.succeed('RLS policies generated');

      // Step 4: Create migration file
      const migrationSpinner = ora('Creating migration file...').start();
      const migrationGenerator = new MigrationGenerator(options.output);
      const affectedTables = Array.from(new Set([
        ...Array.from(tablesWithUserFilter),
        ...Array.from(tablesWithTenantFilter)
      ]));
      
      if (affectedTables.length === 0) {
        // If no specific patterns found, use all tables
        affectedTables.push(...schemas.map(s => s.name));
      }

      const migration = migrationGenerator.generateMigration(generatedSQL, affectedTables);
      migrationSpinner.succeed(`Migration created: ${chalk.green(migration.filename)}`);

      // Step 5: Generate checklist
      if (options.checklist) {
        const checklistSpinner = ora('Generating checklist...').start();
        const checklistGenerator = new ChecklistGenerator(options.output);
        const checklistPath = checklistGenerator.generateChecklist(migration, usagePatterns);
        checklistSpinner.succeed(`Checklist created: ${chalk.green(checklistPath)}`);
      }

      console.log(chalk.green.bold('\n✅ Done!\n'));
      console.log(chalk.cyan('Next steps:'));
      console.log('  1. Review the generated migration file');
      console.log('  2. Test in a development environment');
      console.log('  3. Apply with: supabase db push or supabase migration up');

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze codebase without generating migrations')
  .option('-m, --migrations <path>', 'Path to migrations directory', 'supabase/migrations')
  .option('-s, --source <path>', 'Path to source code directory', 'src')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🔍 Analyzing Codebase\n'));

    try {
      const migrationCollector = new MigrationCollector(options.migrations);
      const schemas = await migrationCollector.collectSchemas();
      const rlsPolicies = await migrationCollector.collectRLSPolicies();

      const scanner = new UsagePatternScanner(options.source);
      const usagePatterns = await scanner.scanUsagePatterns();

      console.log(chalk.cyan('\n📊 Analysis Results:\n'));
      
      console.log(chalk.bold('Tables:'));
      for (const schema of schemas) {
        console.log(`  - ${schema.name} (${schema.columns.length} columns)`);
      }

      console.log(chalk.bold('\nExisting RLS Policies:'));
      if (rlsPolicies.length === 0) {
        console.log('  None found');
      } else {
        for (const policy of rlsPolicies) {
          console.log(`  - ${policy.name} on ${policy.table} (${policy.operation})`);
        }
      }

      console.log(chalk.bold('\nUsage Patterns:'));
      const grouped = usagePatterns.reduce((acc, p) => {
        if (!acc[p.table]) acc[p.table] = [];
        acc[p.table].push(p);
        return acc;
      }, {} as Record<string, typeof usagePatterns>);

      for (const [table, patterns] of Object.entries(grouped)) {
        const withUserId = patterns.filter(p => p.hasUserIdFilter).length;
        const withTenantId = patterns.filter(p => p.hasTenantIdFilter).length;
        console.log(`  - ${table}: ${patterns.length} usage(s) (${withUserId} with user_id, ${withTenantId} with tenant_id)`);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
