# Example Usage

This directory contains example files to demonstrate the AI-SQL-Dev CLI tool.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npm run build
   ```

2. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key-here
   ```

## Example Files

### Migration Files (supabase/migrations/)

- `20240101000000_initial_schema.sql` - Contains CREATE TABLE statements for users, projects, and tasks

### TypeScript Files (test-src/)

- `api.ts` - Contains Supabase client usage with user_id filtering patterns

## Running the Examples

### Analyze the Codebase

```bash
npm start analyze -- -s test-src -m supabase/migrations
```

This will output:
- Tables found in migrations
- Existing RLS policies
- Usage patterns with user_id/tenant_id filters

### Generate RLS Policies (Requires API Key)

```bash
npm start generate -- -s test-src -m supabase/migrations -o supabase/migrations
```

This will:
1. Analyze your migrations and code
2. Ask for confirmation
3. Use Claude AI to generate RLS policies
4. Create a timestamped migration file
5. Generate a markdown checklist

## Expected Output

After running `generate`, you'll get:
- `supabase/migrations/YYYYMMDDHHMMSS_ai_generated_rls_policies.sql` - SQL migration with RLS policies
- `supabase/migrations/YYYYMMDDHHMMSS_checklist.md` - Checklist of affected files and testing steps

## What the AI Generates

Based on the usage patterns in `test-src/api.ts`, the AI should generate RLS policies that:

1. Enable RLS on tables (users, projects, tasks)
2. Create SELECT policies that filter by user_id
3. Create INSERT policies that enforce user_id matching
4. Create UPDATE policies that restrict updates to user's own records
5. Create DELETE policies that restrict deletions to user's own records

The policies will use `auth.uid()` to match against `user_id` columns.
