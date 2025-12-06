# Contributing to AI-SQL-Dev

## Architecture

### Directory Structure

```
src/
├── collectors/                    # Data collection modules
│   ├── migration-collector.ts     # Parses SQL migrations to extract schemas and RLS policies
│   ├── types-collector.ts         # Extracts TypeScript types and maps to tables
│   └── usage-pattern-scanner.ts   # Scans TypeScript files for Supabase client usage
├── ai/                            # AI integration layer
│   └── claude-service.ts          # Handles communication with Claude API
├── generators/                    # Output generation modules
│   ├── migration-generator.ts     # Creates timestamped migration files
│   └── checklist-generator.ts     # Generates markdown checklists
├── config.ts                      # Configuration file loader
├── types.ts                       # Shared TypeScript type definitions
└── index.ts                       # CLI entry point using Commander
```

### Key Components

#### Migration Collector (`collectors/migration-collector.ts`)
- Parses SQL migration files using regex patterns
- Extracts CREATE TABLE statements to build schema models
- Identifies existing RLS policies
- Returns structured data about tables, columns, constraints, and policies

#### Types Collector (`collectors/types-collector.ts`)
- Scans TypeScript files for type definitions
- Extracts interfaces, type aliases, and Zod schemas
- Detects Supabase-generated Database types
- Infers table mappings based on naming conventions and column patterns
- Returns structured type information with table mappings

#### Usage Pattern Scanner (`collectors/usage-pattern-scanner.ts`)
- Scans TypeScript/JavaScript files for Supabase client usage
- Identifies patterns like `.from('table').select()`, `.insert()`, etc.
- Detects auth-related filters (user_id, tenant_id, auth.uid())
- Builds context around each usage for better analysis

#### Config Loader (`config.ts`)
- Loads configuration from `.ai-sql-dev.json` or similar files
- Merges user config with defaults
- Supports environment variable overrides
- Provides convenience methods for common config values

#### Claude Service (`ai/claude-service.ts`)
- Interfaces with Anthropic's Claude API
- Constructs detailed prompts with schema and usage context
- Requests AI-generated RLS policies based on observed patterns
- Handles API communication and response parsing

#### Migration Generator (`generators/migration-generator.ts`)
- Creates timestamped migration files following Supabase conventions
- Formats SQL content with appropriate headers and metadata
- Ensures output directory exists

#### Checklist Generator (`generators/checklist-generator.ts`)
- Analyzes affected files based on table usage
- Creates markdown checklists for code review
- Includes testing and deployment steps
- Provides rollback guidance

## Development Workflow

1. **Make Changes**: Edit source files in `src/`
2. **Build**: Run `npm run build` to compile TypeScript
3. **Test**: Run the CLI commands to verify functionality
4. **Lint**: Run `npm run lint` to ensure code quality

## Adding New Features

### Adding a New Collector

1. Create a new file in `src/collectors/`
2. Implement collection logic with async methods
3. Export the collector class
4. Add types to `src/types.ts` if needed
5. Import and use in `src/index.ts`

Example structure:
```typescript
export class NewCollector {
  private config: CollectorConfig;

  constructor(config: CollectorConfig) {
    this.config = config;
  }

  async collect(): Promise<CollectedData[]> {
    // Implementation
  }
}
```

### Adding a New Generator

1. Create a new file in `src/generators/`
2. Implement generation logic with appropriate output formatting
3. Export the generator class
4. Import and use in `src/index.ts`

### Adding a New CLI Command

1. Add a new `.command()` block in `src/index.ts`
2. Define options and description
3. Implement the action handler
4. Use existing collectors, AI services, and generators
5. Integrate with ConfigLoader for configuration

Example:
```typescript
program
  .command('new-command')
  .description('Description of the command')
  .option('-o, --option <value>', 'Option description')
  .action(async (options) => {
    const configLoader = new ConfigLoader('.');
    // Implementation
  });
```

### Adding Config Options

1. Add the new option to `AppConfig` interface in `src/config.ts`
2. Add default value in `DEFAULT_CONFIG`
3. Update `mergeConfig()` to handle the new option
4. Add convenience getter if needed
5. Update `.ai-sql-dev.json` documentation

## Testing

Manual testing approach:

1. Create test directories: `supabase/migrations/` and `test-src/`
2. Add sample SQL migrations
3. Add sample TypeScript files with Supabase client usage
4. Run `npm start init` to create config
5. Run `npm start analyze` to verify scanning
6. Run `npm start generate -- --dry-run` to preview output
7. Run `npm start generate` (with API key) to test full flow

### Test Cases to Cover

- [ ] Config file loading and merging
- [ ] TypeScript type extraction (interfaces, types, Zod)
- [ ] Supabase Database type detection
- [ ] Table mapping inference
- [ ] SQL schema parsing
- [ ] RLS policy detection
- [ ] Usage pattern scanning
- [ ] AI prompt construction
- [ ] Migration file generation
- [ ] Checklist generation

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use async/await for asynchronous operations
- Add appropriate error handling
- Use chalk for colored terminal output
- Use ora for loading indicators
- Use inquirer for user prompts

### Naming Conventions

- Classes: PascalCase (e.g., `MigrationCollector`)
- Interfaces: PascalCase (e.g., `TableSchema`)
- Functions: camelCase (e.g., `collectSchemas`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_CONFIG`)
- Files: kebab-case (e.g., `migration-collector.ts`)

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure `npm run build` and `npm run lint` pass
5. Test your changes manually
6. Update documentation if needed
7. Submit a pull request with clear description

### PR Checklist

- [ ] Code compiles without errors
- [ ] Linting passes
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Types updated if needed
- [ ] Config options documented

## Future Enhancement Ideas

See [ROADMAP.md](ROADMAP.md) for planned features including:
- OpenAI provider support
- Watch mode for auto-detection
- VS Code extension
- Policy validation
- Migration diffing

<!-- Test improved detection -->
