# Testing Guide

This guide helps you test the AI-SQL-Dev CLI tool.

> **Note**: When testing, create feature branches that target the `dev` branch.

## Manual Testing

Since this is a CLI tool, manual testing is the recommended approach.

### Test Setup

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Initialize config** (optional):
   ```bash
   node dist/index.js init
   ```

3. **Create test data**:
   - Example migrations are in `supabase/migrations/`
   - Example TypeScript code is in `test-src/`

### Test Cases

#### Test 1: Help Commands

```bash
# Test main help
node dist/index.js --help

# Test version
node dist/index.js --version

# Test init help
node dist/index.js init --help

# Test analyze help
node dist/index.js analyze --help

# Test generate help
node dist/index.js generate --help
```

**Expected**: Help text displays correctly with all options.

#### Test 2: Init Command

```bash
# Test init (creates config file)
node dist/index.js init

# Test init with force flag
node dist/index.js init --force
```

**Expected**:
- ✅ Creates `.ai-sql-dev.json` config file
- ✅ Shows success message
- ✅ Fails gracefully if file exists (without --force)

#### Test 3: Analyze Command (No API Key Required)

```bash
# Test with default paths
node dist/index.js analyze

# Test with custom paths
node dist/index.js analyze -s test-src -m supabase/migrations

# Test JSON output
node dist/index.js analyze -o json
```

**Expected**:
- ✅ Displays "Analyzing Codebase" header
- ✅ Shows tables found with column counts
- ✅ Shows user_id/tenant_id badges on tables
- ✅ Shows existing RLS policies (or "None found")
- ✅ Shows TypeScript types mapped to tables
- ✅ Shows usage patterns by table
- ✅ Shows security summary
- ✅ Loads config file if present

#### Test 4: Analyze with Missing Directories

```bash
# Test with non-existent migrations directory
node dist/index.js analyze -m nonexistent/path
```

**Expected**: 
- Should complete without errors
- Should show "No tables found" or 0 tables

#### Test 5: Generate Command - Dry Run

```bash
export ANTHROPIC_API_KEY=your-key-here
node dist/index.js generate -s test-src -m supabase/migrations --dry-run
```

**Expected**:
- ✅ Shows progress spinners
- ✅ Displays summary
- ✅ Prompts for confirmation
- ✅ Shows generated SQL
- ✅ Does NOT create any files
- ✅ Shows "Dry run complete" message

#### Test 6: Generate Command (Requires API Key)

```bash
export ANTHROPIC_API_KEY=your-key-here
node dist/index.js generate -s test-src -m supabase/migrations
```

**Expected**:
- ✅ Displays header with emoji
- ✅ Shows config file being used (if present)
- ✅ Shows progress spinners
- ✅ Displays summary of tables, types, and patterns
- ✅ Prompts for confirmation
- ✅ (If confirmed) Calls Claude API
- ✅ Creates migration file with timestamp
- ✅ Creates checklist markdown file
- ✅ Shows "Done!" message with next steps

#### Test 7: Generate with --no-checklist

```bash
export ANTHROPIC_API_KEY=your-key-here
node dist/index.js generate -s test-src -m supabase/migrations --no-checklist
```

**Expected**:
- ✅ Does NOT create checklist file
- ✅ Still creates migration file

#### Test 8: Generate without API Key

```bash
unset ANTHROPIC_API_KEY
node dist/index.js generate -s test-src
```

**Expected**:
- ❌ Should fail with error: "ANTHROPIC_API_KEY environment variable is required"

#### Test 9: Config File Loading

```bash
# Create config file
echo '{"migrations":{"directory":"custom/path"}}' > .ai-sql-dev.json

# Run analyze
node dist/index.js analyze

# Clean up
rm .ai-sql-dev.json
```

**Expected**:
- ✅ Shows "Using config: .ai-sql-dev.json"
- ✅ Uses custom migrations path from config

#### Test 10: Build and Lint

```bash
# Test build
npm run build

# Test lint
npm run lint
```

**Expected**:
- ✅ Build completes without errors
- ✅ Lint shows no errors (warnings about TypeScript version are OK)

### Verification Checklist

After running tests, verify:

- [ ] Init command creates valid JSON config
- [ ] All commands show proper help text
- [ ] Analyze command works without API key
- [ ] Analyze shows TypeScript types
- [ ] Generate command requires API key
- [ ] Generate --dry-run doesn't write files
- [ ] Config file is loaded when present
- [ ] CLI options override config values
- [ ] Colored output displays correctly
- [ ] Spinners work properly
- [ ] Generated files have correct naming (timestamp format)
- [ ] Generated migration contains SQL
- [ ] Generated checklist is valid markdown
- [ ] Error messages are clear and helpful
- [ ] Build produces no errors
- [ ] Lint produces no errors

### File Structure Verification

After running generate, check:

```bash
ls -la supabase/migrations/
```

You should see:
- Original migration: `20240101000000_initial_schema.sql`
- Generated migration: `YYYYMMDDHHMMSS_ai_generated_rls_policies.sql`
- Checklist: `YYYYMMDDHHMMSS_checklist.md` (if --no-checklist was not used)

### Content Verification

Verify generated migration file contains:
- [ ] Header comment with timestamp
- [ ] List of affected tables
- [ ] SQL statements (ALTER TABLE, CREATE POLICY, etc.)
- [ ] Proper RLS policy syntax

Verify checklist contains:
- [ ] Title and metadata
- [ ] Affected tables list with checkboxes
- [ ] Migration steps
- [ ] Files requiring review
- [ ] Testing checklist
- [ ] Rollback plan

### Config File Verification

Verify `.ai-sql-dev.json` contains:
- [ ] Valid JSON syntax
- [ ] All expected sections (migrations, ai, typeCollection, etc.)
- [ ] Correct default values

## Integration Testing

To test the full workflow:

1. Start with a real Supabase project
2. Point the tool at your actual migrations and source
3. Run `init` to create config
4. Run `analyze` to verify detection
5. Run `generate --dry-run` to preview
6. Run `generate` to create policies
7. Test the generated migration in Supabase local dev
8. Verify RLS policies work as expected

## Troubleshooting Tests

### Colors Not Showing
- Ensure terminal supports ANSI colors
- Try: `export FORCE_COLOR=1`

### Spinners Not Working
- Some CI environments don't support spinners
- The tool should still work, just without animations

### TypeScript Version Warning
- Warning about TypeScript version is expected
- Does not affect functionality
- Can be ignored for this project

### Config File Not Found
- Ensure file is in project root
- Valid names: `.ai-sql-dev.json`, `ai-sql-dev.config.json`
- Check JSON syntax

## Clean Up

After testing:

```bash
# Remove generated test files
rm -f supabase/migrations/*_ai_generated_rls_policies.sql
rm -f supabase/migrations/*_checklist.md

# Remove test config
rm -f .ai-sql-dev.json
```
