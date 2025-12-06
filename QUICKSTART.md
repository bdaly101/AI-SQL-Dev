# Quick Start Guide

Get started with AI-SQL-Dev in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- A Supabase project with migrations
- TypeScript code using Supabase client
- Anthropic API key (get one at https://console.anthropic.com/)

## Installation

```bash
# Clone or download this repository
git clone https://github.com/bdaly101/AI-SQL-Dev.git
cd AI-SQL-Dev

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Option 1: Initialize Config File (Recommended)

```bash
npm start init
```

This creates `.ai-sql-dev.json` with default settings. Customize as needed:

```json
{
  "migrations": {
    "directory": "supabase/migrations"
  },
  "ai": {
    "provider": "claude",
    "model": "claude-3-5-sonnet-20241022"
  },
  "rls": {
    "defaultPatterns": {
      "userColumn": "user_id",
      "tenantColumn": "tenant_id"
    }
  }
}
```

### Option 2: Environment Variable Only

```bash
export ANTHROPIC_API_KEY=sk-ant-...your-key-here
```

## Usage

### 1. Analyze Your Project (No API Key Required)

```bash
npm start analyze
```

This will scan your project and show:
- Tables in your database
- Existing RLS policies
- TypeScript types mapped to tables
- Usage patterns in your TypeScript code
- Security summary

### 2. Preview RLS Policies (Requires API Key)

```bash
npm start generate -- --dry-run
```

This shows what would be generated without writing files.

### 3. Generate RLS Policies (Requires API Key)

```bash
npm start generate
```

The tool will:
1. ✅ Scan migrations for table schemas
2. ✅ Extract TypeScript type definitions
3. ✅ Scan TypeScript for Supabase usage patterns
4. ✅ Show you a summary
5. ✅ Ask for confirmation
6. ✅ Generate RLS policies using AI
7. ✅ Create a migration file
8. ✅ Create a review checklist

### 4. Review and Apply

Check the generated files:
```bash
ls -la supabase/migrations/
```

Review the migration and checklist, then apply:
```bash
# For local development
supabase db reset

# For production
supabase db push
```

## Example Output

```
🤖 AI SQL Dev - Intelligent RLS Policy Generator

Using config: .ai-sql-dev.json

✔ Found 3 tables and 0 existing RLS policies
✔ Found 5 Supabase client usage patterns
✔ Found 4 types (2 mapped to tables)

📊 Summary:
  Tables: users, projects, tasks
  Tables with user_id patterns: projects, tasks
  TypeScript types mapped: User → users, Project → projects

? Proceed with AI-powered RLS policy generation? Yes
✔ RLS policies generated
✔ Migration created: 20241206173000_ai_generated_rls_policies.sql
✔ Checklist created: supabase/migrations/20241206173000_checklist.md

✅ Done!

Next steps:
  1. Review the generated migration file
  2. Test in a development environment
  3. Apply with: supabase db push or supabase migration up
```

## Custom Paths

If your project structure is different:

```bash
npm start analyze -- \
  --migrations ./database/migrations \
  --source ./app

npm start generate -- \
  --migrations ./database/migrations \
  --source ./app \
  --output ./database/migrations
```

Or configure via `.ai-sql-dev.json`:

```json
{
  "migrations": {
    "directory": "database/migrations"
  },
  "apiCollection": {
    "include": ["app/**/*.ts", "app/**/*.tsx"]
  },
  "output": {
    "directory": "database/migrations"
  }
}
```

## Troubleshooting

### "No table schemas found"
- Ensure migrations exist in `supabase/migrations/` (or your custom path)
- Check that SQL files contain `CREATE TABLE` statements

### "ANTHROPIC_API_KEY environment variable is required"
- Set the environment variable: `export ANTHROPIC_API_KEY=your-key`
- Or pass it via flag: `npm start generate -- --api-key your-key`

### "No Supabase usage patterns found"
- Ensure TypeScript files contain Supabase client usage
- The scanner looks for `.from('table')` patterns
- Check that source files are in `src/` (or your custom path)

### Config file not loading
- Ensure file is named `.ai-sql-dev.json` or `ai-sql-dev.config.json`
- Check JSON syntax is valid
- Run `npm start init` to create a fresh config

## What's Next?

- Review the generated migration file
- Test the policies in development
- Verify auth context works as expected
- Check the markdown checklist for affected files
- Apply the migration when ready

For more details, see [README.md](README.md) and [EXAMPLES.md](EXAMPLES.md).
