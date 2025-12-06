# AI-SQL-Dev

CLI tool that analyzes your Supabase schema and TypeScript codebase to generate intelligent database migrations and Row Level Security policies. Reads migrations, types, and API usage patterns, then uses Claude/GPT to propose SQL changes, RLS policies based on tenant_id/user_id patterns, and generates checklists for required code updates.

## Features

- 📊 **SQL Migration Parser**: Extracts table schemas and RLS policies from `supabase/migrations/`
- 🔍 **TypeScript Scanner**: Scans TS files for Supabase client usage patterns (from/select/insert with auth filters)
- 🤖 **AI-Powered**: Uses Claude API via @anthropic-ai/sdk to analyze patterns and generate intelligent RLS policies
- 📝 **Migration Generator**: Creates timestamped migration files with RLS policies based on user_id/tenant_id patterns
- ✅ **Markdown Checklists**: Outputs checklists of affected files for review

## Installation

```bash
npm install
npm run build
```

## Configuration

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

Or pass it via the `--api-key` flag.

## Usage

### Analyze Your Codebase

Analyze your Supabase schema and TypeScript usage patterns without generating migrations:

```bash
npm start analyze
```

With custom paths:

```bash
npm start analyze --migrations supabase/migrations --source src
```

### Generate RLS Policies

Generate AI-powered RLS policies based on your codebase:

```bash
npm start generate
```

This will:
1. Scan your migrations for table schemas
2. Scan TypeScript files for Supabase client usage patterns
3. Identify user_id and tenant_id filtering patterns
4. Use Claude AI to generate appropriate RLS policies
5. Create a timestamped migration file
6. Generate a markdown checklist of affected files

### Options

```bash
npm start generate [options]

Options:
  -m, --migrations <path>  Path to migrations directory (default: "supabase/migrations")
  -s, --source <path>      Path to source code directory (default: "src")
  -o, --output <path>      Output directory for generated migration (default: "supabase/migrations")
  -k, --api-key <key>      Anthropic API key (or set ANTHROPIC_API_KEY env var)
  --no-checklist           Skip generating markdown checklist
```

## Project Structure

```
src/
├── collectors/          # Data collection modules
│   ├── migration-collector.ts    # Parses SQL migrations
│   └── usage-pattern-scanner.ts  # Scans TypeScript usage
├── ai/                  # AI integration
│   └── claude-service.ts         # Claude API integration
├── generators/          # Output generators
│   ├── migration-generator.ts    # Creates migration files
│   └── checklist-generator.ts    # Creates markdown checklists
├── types.ts            # TypeScript type definitions
└── index.ts            # CLI entry point
```

## Example Workflow

1. **Analyze your project**:
   ```bash
   npm start analyze
   ```

2. **Generate RLS policies**:
   ```bash
   npm start generate
   ```

3. **Review the generated files**:
   - Migration file: `supabase/migrations/YYYYMMDDHHMMSS_ai_generated_rls_policies.sql`
   - Checklist: `supabase/migrations/YYYYMMDDHHMMSS_checklist.md`

4. **Test in development**:
   ```bash
   supabase db reset
   ```

5. **Apply the migration**:
   ```bash
   supabase db push
   # or
   supabase migration up
   ```

## How It Works

1. **Schema Collection**: Parses CREATE TABLE statements from migration files to understand your database structure
2. **Policy Detection**: Identifies existing RLS policies in your migrations
3. **Usage Analysis**: Scans TypeScript files for patterns like:
   - `.from('table').select().eq('user_id', userId)`
   - `.from('table').insert({ user_id, ... })`
   - Authentication filter usage (auth.uid(), user_id, tenant_id)
4. **AI Generation**: Sends context to Claude AI which analyzes patterns and generates appropriate RLS policies
5. **Migration Creation**: Generates timestamped SQL migration files
6. **Checklist Creation**: Creates markdown checklists of files that may need review

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

# Lint
npm run lint
```

## License

MIT
