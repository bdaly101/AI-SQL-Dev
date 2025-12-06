#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { writeFileSync, existsSync } from 'fs';
import { MigrationCollector } from './collectors/migration-collector';
import { UsagePatternScanner } from './collectors/usage-pattern-scanner';
import { TypesCollector } from './collectors/types-collector';
import { ClaudeService } from './ai/claude-service';
import { MigrationGenerator } from './generators/migration-generator';
import { ChecklistGenerator } from './generators/checklist-generator';
import { ConfigLoader, generateDefaultConfig } from './config';

const program = new Command();

program
  .name('ai-sql-dev')
  .description('AI-powered Supabase migration and RLS policy generator')
  .version('1.0.0');

// Init command - create config file
program
  .command('init')
  .description('Initialize configuration file')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n⚙️  AI SQL Dev - Configuration Setup\n'));
    
    const configPath = '.ai-sql-dev.json';
    
    if (existsSync(configPath) && !options.force) {
      console.log(chalk.yellow(`Config file ${configPath} already exists. Use --force to overwrite.`));
      process.exit(1);
    }
    
    const configContent = generateDefaultConfig();
    writeFileSync(configPath, configContent, 'utf-8');
    
    console.log(chalk.green(`✅ Created ${configPath}`));
    console.log(chalk.cyan('\nYou can now customize the config file for your project.'));
    console.log(chalk.cyan('Run `ai-sql-dev analyze` to scan your codebase.'));
  });

program
  .command('generate')
  .description('Generate RLS policies based on your codebase')
  .option('-m, --migrations <path>', 'Path to migrations directory')
  .option('-s, --source <path>', 'Path to source code directory')
  .option('-o, --output <path>', 'Output directory for generated migration')
  .option('-k, --api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY env var)')
  .option('--no-checklist', 'Skip generating markdown checklist')
  .option('--dry-run', 'Preview without writing files')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🤖 AI SQL Dev - Intelligent RLS Policy Generator\n'));

    try {
      // Load config
      const configLoader = new ConfigLoader('.');
      if (configLoader.hasConfigFile()) {
        console.log(chalk.gray(`Using config: ${configLoader.getConfigPath()}`));
      }
      
      // Use CLI options or fall back to config
      const migrationsPath = options.migrations || configLoader.getMigrationsPath();
      const sourcePath = options.source || configLoader.getSourcePath();
      const outputPath = options.output || configLoader.getOutputPath();
      const apiKey = options.apiKey || configLoader.getAPIKey();

      // Step 1: Collect migration schemas
      const schemaSpinner = ora('Collecting table schemas from migrations...').start();
      const migrationCollector = new MigrationCollector(migrationsPath);
      const schemas = await migrationCollector.collectSchemas();
      const rlsPolicies = await migrationCollector.collectRLSPolicies();
      schemaSpinner.succeed(`Found ${chalk.green(schemas.length)} tables and ${chalk.green(rlsPolicies.length)} existing RLS policies`);

      // Step 2: Scan TypeScript usage patterns
      const scanSpinner = ora('Scanning TypeScript files for Supabase usage patterns...').start();
      const scanner = new UsagePatternScanner(sourcePath);
      const usagePatterns = await scanner.scanUsagePatterns();
      scanSpinner.succeed(`Found ${chalk.green(usagePatterns.length)} Supabase client usage patterns`);

      // Step 3: Collect TypeScript types
      const typesSpinner = ora('Extracting TypeScript type definitions...').start();
      const typesCollector = new TypesCollector(sourcePath);
      const typeDefinitions = await typesCollector.collectTypes();
      const mappedTypes = typeDefinitions.filter(t => t.supabaseTable);
      typesSpinner.succeed(`Found ${chalk.green(typeDefinitions.length)} types (${mappedTypes.length} mapped to tables)`);

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
      if (mappedTypes.length > 0) {
        console.log(`  TypeScript types mapped: ${mappedTypes.map(t => `${t.name} → ${t.supabaseTable}`).join(', ')}`);
      }

      // Confirm with user
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: options.dryRun 
          ? 'Preview AI-powered RLS policy generation?' 
          : 'Proceed with AI-powered RLS policy generation?',
        default: true
      }]);

      if (!confirm) {
        console.log(chalk.yellow('\nAborted.'));
        process.exit(0);
      }

      // Step 4: Generate RLS policies with Claude
      const aiSpinner = ora('Generating RLS policies with Claude AI...').start();
      const claudeService = new ClaudeService(apiKey, configLoader.getAIModel());
      const migrationContext = {
        schemas,
        rlsPolicies,
        usagePatterns
      };
      
      const generatedSQL = await claudeService.generateRLSPolicies(migrationContext);
      aiSpinner.succeed('RLS policies generated');

      // Dry run - just show the output
      if (options.dryRun) {
        console.log(chalk.cyan('\n📝 Generated SQL (dry run):\n'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(generatedSQL);
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.yellow('\nDry run complete. No files were written.'));
        return;
      }

      // Step 5: Create migration file
      const migrationSpinner = ora('Creating migration file...').start();
      const migrationGenerator = new MigrationGenerator(outputPath);
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

      // Step 6: Generate checklist
      if (options.checklist && configLoader.shouldGenerateChecklist()) {
        const checklistSpinner = ora('Generating checklist...').start();
        const checklistGenerator = new ChecklistGenerator(outputPath);
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
  .option('-m, --migrations <path>', 'Path to migrations directory')
  .option('-s, --source <path>', 'Path to source code directory')
  .option('-o, --output <format>', 'Output format (table|json)', 'table')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🔍 Analyzing Codebase\n'));

    try {
      // Load config
      const configLoader = new ConfigLoader('.');
      if (configLoader.hasConfigFile()) {
        console.log(chalk.gray(`Using config: ${configLoader.getConfigPath()}\n`));
      }

      const migrationsPath = options.migrations || configLoader.getMigrationsPath();
      const sourcePath = options.source || configLoader.getSourcePath();

      const migrationCollector = new MigrationCollector(migrationsPath);
      const schemas = await migrationCollector.collectSchemas();
      const rlsPolicies = await migrationCollector.collectRLSPolicies();

      const scanner = new UsagePatternScanner(sourcePath);
      const usagePatterns = await scanner.scanUsagePatterns();

      const typesCollector = new TypesCollector(sourcePath);
      const typeDefinitions = await typesCollector.collectTypes();

      // JSON output
      if (options.output === 'json') {
        console.log(JSON.stringify({
          tables: schemas,
          rlsPolicies,
          usagePatterns,
          typeDefinitions,
        }, null, 2));
        return;
      }

      // Table output
      console.log(chalk.cyan('📊 Analysis Results:\n'));
      
      console.log(chalk.bold('Tables:'));
      if (schemas.length === 0) {
        console.log('  No tables found');
      } else {
        for (const schema of schemas) {
          const hasUserCol = schema.columns.some(c => c.name === configLoader.getUserColumn());
          const hasTenantCol = schema.columns.some(c => c.name === configLoader.getTenantColumn());
          const badges = [];
          if (hasUserCol) badges.push(chalk.blue('user_id'));
          if (hasTenantCol) badges.push(chalk.magenta('tenant_id'));
          console.log(`  - ${schema.name} (${schema.columns.length} columns) ${badges.join(' ')}`);
        }
      }

      console.log(chalk.bold('\nExisting RLS Policies:'));
      if (rlsPolicies.length === 0) {
        console.log(chalk.yellow('  ⚠️  None found - tables may be unprotected'));
      } else {
        for (const policy of rlsPolicies) {
          console.log(`  - ${policy.name} on ${policy.table} (${policy.operation})`);
        }
      }

      console.log(chalk.bold('\nTypeScript Types:'));
      const mappedTypes = typeDefinitions.filter(t => t.supabaseTable);
      if (mappedTypes.length === 0) {
        console.log('  No types mapped to tables');
      } else {
        for (const type of mappedTypes) {
          console.log(`  - ${type.name} → ${type.supabaseTable} (${type.kind})`);
        }
      }

      console.log(chalk.bold('\nUsage Patterns:'));
      const grouped = usagePatterns.reduce((acc, p) => {
        if (!acc[p.table]) acc[p.table] = [];
        acc[p.table].push(p);
        return acc;
      }, {} as Record<string, typeof usagePatterns>);

      if (Object.keys(grouped).length === 0) {
        console.log('  No Supabase client usage found');
      } else {
        for (const [table, patterns] of Object.entries(grouped)) {
          const withUserId = patterns.filter(p => p.hasUserIdFilter).length;
          const withTenantId = patterns.filter(p => p.hasTenantIdFilter).length;
          console.log(`  - ${table}: ${patterns.length} usage(s) (${withUserId} with user_id, ${withTenantId} with tenant_id)`);
        }
      }

      // Security summary
      console.log(chalk.bold('\n🔐 Security Summary:'));
      const tablesWithoutRLS = schemas.filter(s => 
        !rlsPolicies.some(p => p.table === s.name)
      );
      if (tablesWithoutRLS.length > 0) {
        console.log(chalk.yellow(`  ⚠️  Tables without RLS: ${tablesWithoutRLS.map(t => t.name).join(', ')}`));
      } else if (schemas.length > 0) {
        console.log(chalk.green('  ✅ All tables have RLS policies'));
      }

      const tablesWithUserCol = schemas.filter(s => 
        s.columns.some(c => c.name === configLoader.getUserColumn())
      );
      const tablesWithTenantCol = schemas.filter(s => 
        s.columns.some(c => c.name === configLoader.getTenantColumn())
      );
      
      console.log(`  Multi-tenant tables: ${tablesWithTenantCol.length}`);
      console.log(`  User-owned tables: ${tablesWithUserCol.length}`);

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
