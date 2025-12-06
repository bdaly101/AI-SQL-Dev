# AI-SQL-Dev

> AI-powered Supabase migration and RLS policy generator

A CLI tool that analyzes your Supabase schema and TypeScript codebase to generate intelligent migration files and Row Level Security (RLS) policies.

## What This Tool Does

1. **Reads** your current database schema from Supabase migrations and TypeScript types/API usage
2. **Proposes** SQL schema changes and RLS policies based on patterns like `tenant_id`, `user_id`
3. **Generates** complete migration files and actionable checklists for required code updates

## Features

- 📊 **Schema Parser**: Extracts table schemas and RLS policies from `supabase/migrations/`
- 🔍 **TypeScript Scanner**: Scans TS files for Supabase client usage patterns (from/select/insert with auth filters)
- 📝 **Types Collector**: Extracts TypeScript type definitions and maps them to database tables
- 🤖 **AI-Powered**: Uses Claude API to analyze patterns and generate intelligent RLS policies
- 📁 **Migration Generator**: Creates timestamped migration files following Supabase conventions
- ✅ **Checklist Generator**: Outputs markdown checklists of affected files for review
- ⚙️ **Config File Support**: Customize behavior via `.ai-sql-dev.json`

## Installation

```bash
npm install
npm run build
```

## Configuration

### Quick Setup

```bash
# Initialize config file
npm start init

# Set your API key
export ANTHROPIC_API_KEY=your-api-key-here
```

### Config File (`.ai-sql-dev.json`)

```json
{
  "projectPath": ".",
  "migrations": {
    "directory": "supabase/migrations",
    "timestampFormat": "YYYYMMDDHHmmss"
  },
  "ai": {
    "provider": "claude",
    "model": "claude-3-5-sonnet-20241022"
  },
  "typeCollection": {
    "include": ["src/**/*.ts", "src/**/*.tsx", "types/**/*.ts"],
    "exclude": ["**/*.test.ts", "**/*.spec.ts"]
  },
  "apiCollection": {
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "supabaseImports": ["@supabase/supabase-js", "~/lib/supabase"]
  },
  "rls": {
    "defaultPatterns": {
      "userColumn": "user_id",
      "tenantColumn": "tenant_id"
    }
  },
  "output": {
    "directory": "supabase/migrations",
    "generateChecklist": true
  }
}
```

### Environment Variables

Copy `.env.example` to `.env` and add your API key:

```bash
cp .env.example .env
```

Or set directly:

```bash
# Required: Your Anthropic API key (get one at https://console.anthropic.com/)
export ANTHROPIC_API_KEY=your-api-key-here

# Optional overrides
export AI_PROVIDER=claude
export AI_MODEL=claude-3-5-sonnet-20241022
```

> ⚠️ **Never commit API keys to version control!** The `.env` file is already in `.gitignore`.

## Usage

### Initialize Configuration

```bash
npm start init
```

Creates a `.ai-sql-dev.json` config file with default settings.

### Analyze Your Codebase

Analyze your Supabase schema and TypeScript usage patterns without generating migrations:

```bash
npm start analyze
```

With custom paths:

```bash
npm start analyze -- --migrations supabase/migrations --source src
```

JSON output:

```bash
npm start analyze -- --output json
```

### Generate RLS Policies

Generate AI-powered RLS policies based on your codebase:

```bash
npm start generate
```

Preview without writing files:

```bash
npm start generate -- --dry-run
```

This will:
1. Scan your migrations for table schemas
2. Scan TypeScript files for Supabase client usage patterns
3. Extract TypeScript type definitions
4. Identify user_id and tenant_id filtering patterns
5. Use Claude AI to generate appropriate RLS policies
6. Create a timestamped migration file
7. Generate a markdown checklist of affected files

### CLI Options

```bash
npm start generate [options]

Options:
  -m, --migrations <path>  Path to migrations directory
  -s, --source <path>      Path to source code directory
  -o, --output <path>      Output directory for generated migration
  -k, --api-key <key>      Anthropic API key (or set ANTHROPIC_API_KEY env var)
  --no-checklist           Skip generating markdown checklist
  --dry-run                Preview without writing files
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                              │
│                      (commander)                                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Context Collector                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Schema Parser   │  │ TypeScript      │  │ API Usage           │  │
│  │ (SQL migrations)│  │ Type Extractor  │  │ Analyzer            │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                      │              │
│           └────────────────────┴──────────────────────┘              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI Provider                                   │
│              (Claude API)                                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Output Generator                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ Migration File  │  │ RLS Policies    │  │ Checklist           │  │
│  │ Writer          │  │ Generator       │  │ Generator           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── collectors/                    # Data collection modules
│   ├── migration-collector.ts     # Parses SQL migrations
│   ├── types-collector.ts         # Extracts TypeScript types
│   └── usage-pattern-scanner.ts   # Scans TypeScript usage
├── ai/                            # AI integration
│   └── claude-service.ts          # Claude API integration
├── generators/                    # Output generators
│   ├── migration-generator.ts     # Creates migration files
│   └── checklist-generator.ts     # Creates markdown checklists
├── config.ts                      # Configuration loader
├── types.ts                       # TypeScript type definitions
└── index.ts                       # CLI entry point
```

## How It Works

1. **Schema Collection**: Parses CREATE TABLE statements from migration files
2. **Type Extraction**: Extracts TypeScript interfaces/types and maps them to tables
3. **Usage Analysis**: Scans TypeScript files for Supabase client patterns
4. **AI Generation**: Sends context to Claude AI for intelligent policy generation
5. **Migration Creation**: Generates timestamped SQL migration files
6. **Checklist Creation**: Creates markdown checklists for code review

## Example Workflow

```bash
# 1. Initialize config
npm start init

# 2. Analyze your project
npm start analyze

# 3. Preview RLS policies
npm start generate -- --dry-run

# 4. Generate RLS policies
npm start generate

# 5. Review generated files
cat supabase/migrations/*_ai_generated_rls_policies.sql

# 6. Test in development
supabase db reset

# 7. Apply the migration
supabase db push
```

## Target Users

- Developers using Supabase with TypeScript
- Teams needing consistent RLS policy generation
- Projects requiring migration assistance with multi-tenant patterns

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

Issues and pull requests are appreciated.

## Dependencies

- **commander**: CLI framework
- **glob**: File pattern matching
- **chalk**: Terminal colors
- **ora**: Loading spinners
- **inquirer**: Interactive prompts
- **@anthropic-ai/sdk**: Claude AI integration

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Lint
npm run lint
```

## Security

### API Key Safety

- **Never commit API keys** to version control
- Use environment variables or `.env` files (already in `.gitignore`)
- See [SECURITY.md](SECURITY.md) for our security policy

### Generated SQL Review

⚠️ **Always review AI-generated RLS policies before applying them!**

The generated policies are suggestions based on code analysis. Before applying:
1. Review the generated SQL carefully
2. Test in a development environment
3. Validate against your actual authentication setup
4. Ensure policies match your security requirements

### What This Tool Does NOT Do

- ❌ Store or transmit your API keys (beyond the AI provider)
- ❌ Execute generated SQL automatically
- ❌ Modify your existing database

### What This Tool DOES

- ✅ Read local files (migrations, TypeScript code)
- ✅ Send schema/code context to Claude for analysis
- ✅ Generate new migration files locally

## License

MIT

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Syntax](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Anthropic API Docs](https://docs.anthropic.com)
