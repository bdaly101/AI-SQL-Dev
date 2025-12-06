# Testing Guide

This guide helps you test the AI-SQL-Dev CLI tool.

## Manual Testing

Since this is a CLI tool without automated tests, manual testing is the recommended approach.

### Test Setup

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Create test data**:
   - Example migrations are in `supabase/migrations/`
   - Example TypeScript code is in `test-src/`

### Test Cases

#### Test 1: Help Commands

```bash
# Test main help
node dist/index.js --help

# Test version
node dist/index.js --version

# Test analyze help
node dist/index.js analyze --help

# Test generate help
node dist/index.js generate --help
```

**Expected**: Help text displays correctly with all options.

#### Test 2: Analyze Command (No API Key Required)

```bash
# Test with default paths
node dist/index.js analyze

# Test with custom paths
node dist/index.js analyze -s test-src -m supabase/migrations
```

**Expected**:
- ✅ Displays "Analyzing Codebase" header
- ✅ Shows tables found (users, projects, tasks)
- ✅ Shows column counts
- ✅ Shows existing RLS policies (should be "None found")
- ✅ Shows usage patterns by table
- ✅ Shows user_id/tenant_id filter counts

#### Test 3: Analyze with Missing Directories

```bash
# Test with non-existent migrations directory
node dist/index.js analyze -m nonexistent/path
```

**Expected**: 
- Should complete without errors
- Should show "No table schemas found" or 0 tables

#### Test 4: Generate Command (Requires API Key)

```bash
# Set API key
export ANTHROPIC_API_KEY=your-key-here

# Test generate
node dist/index.js generate -s test-src -m supabase/migrations
```

**Expected**:
- ✅ Displays header with emoji
- ✅ Shows progress spinners
- ✅ Displays summary of tables and patterns
- ✅ Prompts for confirmation
- ✅ (If confirmed) Calls Claude API
- ✅ Creates migration file with timestamp
- ✅ Creates checklist markdown file
- ✅ Shows "Done!" message

#### Test 5: Generate with --no-checklist

```bash
export ANTHROPIC_API_KEY=your-key-here
node dist/index.js generate -s test-src -m supabase/migrations --no-checklist
```

**Expected**:
- ✅ Does NOT create checklist file
- ✅ Still creates migration file

#### Test 6: Generate without API Key

```bash
unset ANTHROPIC_API_KEY
node dist/index.js generate -s test-src
```

**Expected**:
- ❌ Should fail with error: "ANTHROPIC_API_KEY environment variable is required"

#### Test 7: Build and Lint

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

- [ ] All commands show proper help text
- [ ] Analyze command works without API key
- [ ] Generate command requires API key
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

## Integration Testing

To test the full workflow:

1. Start with a real Supabase project
2. Point the tool at your actual migrations and source
3. Run analyze to verify detection
4. Run generate to create policies
5. Test the generated migration in Supabase local dev
6. Verify RLS policies work as expected

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

## Clean Up

After testing:

```bash
# Remove generated test files
rm -f supabase/migrations/*_ai_generated_rls_policies.sql
rm -f supabase/migrations/*_checklist.md
```
