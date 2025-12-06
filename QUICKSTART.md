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

Create a `.env` file or export your API key:

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
- Usage patterns in your TypeScript code

### 2. Generate RLS Policies (Requires API Key)

```bash
npm start generate
```

The tool will:
1. ✅ Scan migrations for table schemas
2. ✅ Scan TypeScript for Supabase usage patterns
3. ✅ Show you a summary
4. ✅ Ask for confirmation
5. ✅ Generate RLS policies using AI
6. ✅ Create a migration file
7. ✅ Create a review checklist

### 3. Review and Apply

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

✔ Found 3 tables and 0 existing RLS policies
✔ Found 5 Supabase client usage patterns

📊 Summary:
  Tables: users, projects, tasks
  Tables with user_id patterns: projects, tasks

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

## What's Next?

- Review the generated migration file
- Test the policies in development
- Verify auth context works as expected
- Check the markdown checklist for affected files
- Apply the migration when ready

For more details, see [README.md](README.md) and [EXAMPLES.md](EXAMPLES.md).
