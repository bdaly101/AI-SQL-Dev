# AI-SQL-Dev - Development Roadmap

> A CLI tool that analyzes your Supabase schema and TypeScript codebase to generate intelligent migration files and RLS policies.

---

## Project Overview

### What This Tool Does

1. **Reads** your current database schema from Supabase migrations and TypeScript types/API usage
2. **Proposes** SQL schema changes and RLS policies based on patterns like `tenant_id`, `user_id`
3. **Generates** complete migration files and actionable checklists for required code updates

### Target Users

- Developers using Supabase with TypeScript
- Teams needing consistent RLS policy generation
- Projects requiring migration assistance with multi-tenant patterns

---

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

---

## Current Implementation Status

### Project Structure

```
AI-SQL-Dev/
├── src/
│   ├── index.ts                       # CLI entry point (init, analyze, generate)
│   ├── config.ts                      # Configuration file loader
│   ├── types.ts                       # Shared type definitions
│   ├── collectors/
│   │   ├── migration-collector.ts     # Parse SQL migrations
│   │   ├── types-collector.ts         # Extract TypeScript types
│   │   └── usage-pattern-scanner.ts   # Analyze API usage patterns
│   ├── ai/
│   │   └── claude-service.ts          # Claude API integration
│   └── generators/
│       ├── migration-generator.ts     # Write migration files
│       └── checklist-generator.ts     # Generate update checklist
├── .ai-sql-dev.json                   # Config file (generated)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Project Setup & Core Infrastructure ✅ COMPLETE

### 1.1 Initialize Project ✅

- [x] TypeScript project setup
- [x] CLI framework (commander)
- [x] Core dependencies installed

**Dependencies:**

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "glob": "^10.3.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "chalk": "^4.1.2",
    "ora": "^5.4.1",
    "inquirer": "^8.2.6"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.0.0"
  }
}
```

### 1.2 Core Types Definition ✅

- [x] TableSchema, Column types
- [x] RLSPolicy types
- [x] SupabaseUsagePattern types
- [x] MigrationContext types
- [x] TypeDefinition types
- [x] Configuration types

---

## Phase 2: Context Collectors ✅ COMPLETE

### 2.1 Schema Collector ✅

**File:** `src/collectors/migration-collector.ts`

- [x] Find all `.sql` files in migrations directory
- [x] Parse CREATE TABLE statements
- [x] Extract column definitions
- [x] Parse CREATE POLICY statements
- [x] Track constraints

### 2.2 TypeScript Types Collector ✅

**File:** `src/collectors/types-collector.ts`

- [x] Scan TypeScript files for type definitions
- [x] Extract interfaces and type aliases
- [x] Detect Supabase Database types
- [x] Extract Zod schemas
- [x] Infer table mappings from naming conventions
- [x] Configurable include/exclude patterns

### 2.3 API Usage Collector ✅

**File:** `src/collectors/usage-pattern-scanner.ts`

- [x] Find Supabase client usage patterns
- [x] Extract `.from('table')` queries
- [x] Detect user_id and tenant_id filters
- [x] Identify CRUD operations
- [x] Build usage context

---

## Phase 3: AI Integration ✅ COMPLETE

### 3.1 Claude Implementation ✅

**File:** `src/ai/claude-service.ts`

- [x] Initialize Anthropic SDK
- [x] Build context-aware prompts
- [x] Generate RLS policies
- [x] Configurable model selection

### 3.2 Provider Abstraction

- [x] Claude provider implemented
- [ ] ~~OpenAI provider~~ (Deferred - not needed for MVP)

---

## Phase 4: Output Generators ✅ COMPLETE

### 4.1 Migration File Writer ✅

**File:** `src/generators/migration-generator.ts`

- [x] Generate timestamped filenames
- [x] Format SQL with comments
- [x] Write to migrations directory

### 4.2 Checklist Generator ✅

**File:** `src/generators/checklist-generator.ts`

- [x] Analyze affected files
- [x] Generate prioritized checklist
- [x] Output as Markdown
- [x] Include testing steps
- [x] Include rollback plan

---

## Phase 5: CLI Implementation ✅ COMPLETE

### 5.1 Commands ✅

**File:** `src/index.ts`

- [x] `init` - Initialize configuration file
- [x] `analyze` - Analyze codebase without generating
- [x] `generate` - Generate RLS policies with AI
- [x] `--dry-run` flag for preview
- [x] `--output json` for CI/CD integration
- [x] `--no-checklist` option

### 5.2 Features ✅

- [x] Progress spinners (ora)
- [x] Colored output (chalk)
- [x] Interactive prompts (inquirer)
- [x] Security summary in analyze
- [x] TypeScript type display

---

## Phase 6: Testing Strategy ✅ COMPLETE

### 6.1 Manual Testing ✅

**File:** `TESTING.md`

- [x] Test documentation created
- [x] Test cases defined
- [x] Verification checklists

### 6.2 Automated Tests ✅

- [x] Install vitest
- [x] Unit tests for collectors (30 tests)
- [x] Unit tests for generators (16 tests)
- [x] Config tests (16 tests)
- [x] Test fixtures created

### 6.3 Test Fixtures

```
tests/fixtures/sample-project/
├── supabase/
│   └── migrations/
│       └── 20240101000000_initial.sql
├── src/
│   ├── types/
│   │   └── database.ts
│   └── api.ts
```

---

## Phase 7: Configuration & Polish ✅ COMPLETE

### 7.1 Configuration File ✅

**File:** `src/config.ts`

- [x] `.ai-sql-dev.json` support
- [x] Environment variable overrides
- [x] Merge user config with defaults
- [x] Convenience getters

**Config Structure:**

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

### 7.2 Environment Variables ✅

```bash
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=claude
AI_MODEL=claude-3-5-sonnet-20241022
```

---

## Implementation Checklist

### ✅ Completed
1. [x] Project setup with TypeScript and dependencies
2. [x] Core types definition
3. [x] Schema collector (SQL parsing)
4. [x] Basic CLI structure
5. [x] TypeScript types collector
6. [x] API usage collector
7. [x] Context aggregation
8. [x] Claude implementation
9. [x] Prompt templates (embedded)
10. [x] Migration file writer
11. [x] RLS generator
12. [x] Checklist generator
13. [x] Full CLI commands (init, analyze, generate)
14. [x] Configuration file support
15. [x] Documentation (README, QUICKSTART, etc.)
16. [x] Vitest for automated testing
17. [x] Test fixtures created
18. [x] Unit tests for collectors (30 tests)
19. [x] Unit tests for generators (16 tests)
20. [x] Config tests (16 tests)

### 🎯 Ready for Use
The tool is feature-complete and tested. Run `npm start` to use.

### ⏳ Deferred (Not Needed for MVP)
- [ ] ~~OpenAI provider~~ - Claude sufficient
- [ ] ~~Separate `migrate` command~~ - `generate` covers this
- [ ] ~~Separate `rls` command~~ - Integrated into `generate`
- [ ] ~~Handlebars templates~~ - String templates sufficient
- [ ] ~~Deep directory structure~~ - Flat structure works

---

## Usage Examples

### Initialize Config

```bash
npx ai-sql-dev init
```

### Analyze Project

```bash
npx ai-sql-dev analyze
npx ai-sql-dev analyze --output json
```

### Generate RLS Policies

```bash
# Preview (dry run)
npx ai-sql-dev generate --dry-run

# Generate
npx ai-sql-dev generate

# Without checklist
npx ai-sql-dev generate --no-checklist
```

### Custom Paths

```bash
npx ai-sql-dev generate \
  --migrations ./database/migrations \
  --source ./app \
  --output ./database/migrations
```

---

## Future Enhancements

These features are out of scope for MVP but could be added later:

1. **Watch Mode**: Auto-detect schema changes and suggest updates
2. **VS Code Extension**: Inline suggestions and quick fixes
3. **Policy Validation**: Check for common RLS mistakes
4. **Migration Diffing**: Compare schema versions
5. **Supabase CLI Integration**: Direct `supabase` command integration
6. **OpenAI Support**: Alternative AI provider
7. **Team Sharing**: Share RLS patterns across projects

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Syntax](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Anthropic API Docs](https://docs.anthropic.com)

## Suggestions from AI Reviews

### From PR #8

**Source:** [PR #8](https://github.com/bdaly101/AI-SQL-Dev/pull/8)

- [ ] Consider expanding the note to include a brief example or link to a more detailed explanation of how to work with the three-branch workflow.
- [ ] Add a section about branch naming conventions if applicable, to further guide new contributors.
- [ ] Include a brief explanation or rationale behind using this specific branching strategy, to give contributors context and understanding of its benefits.
- [ ] Consider adding a visual representation of the branch workflow to make it easier to understand at a glance.

### From PR #10

**Source:** [PR #10](https://github.com/bdaly101/AI-SQL-Dev/pull/10)

- [ ] Consider adding a section on branch naming conventions to further standardize workflow.
- [ ] Include examples of branch names that follow the recommended workflow.
- [ ] Expand the testing guide to include automated testing strategies if applicable.
- [ ] Consider linking to additional resources or tools that facilitate the recommended workflow.
- [ ] Review other documentation files to ensure consistency in guidance and instructions.

### From PR #19

**Source:** [PR #19](https://github.com/bdaly101/AI-SQL-Dev/pull/19)

- [ ] Ensure that the addition to the .gitignore file aligns with the project's long-term needs. If the 'Fixed test' files are temporary, consider alternative cleanup methods.
- [ ] Review the project's documentation or README to ensure it reflects this change, especially if the 'Fixed test' files are relevant to other contributors.
- [ ] If the 'Fixed test' files are generated by a common tool or process within the project, document this process to help new contributors understand why these files are ignored.

### From PR #19

**Source:** [PR #19](https://github.com/bdaly101/AI-SQL-Dev/pull/19)

- [ ] Ensure that the addition to the .gitignore file aligns with the project's long-term needs. If the 'Fixed test' files are temporary, consider alternative cleanup methods.
- [ ] Review the project's documentation or README to ensure it reflects this change, especially if the 'Fixed test' files are relevant to other contributors.
- [ ] If the 'Fixed test' files are generated by a common tool or process within the project, document this process to help new contributors understand why these files are ignored.

### From PR #19

**Source:** [PR #19](https://github.com/bdaly101/AI-SQL-Dev/pull/19)

- [ ] Ensure that the addition to the .gitignore file aligns with the project's long-term needs. If the 'Fixed test' files are temporary, consider alternative cleanup methods.
- [ ] Review the project's documentation or README to ensure it reflects this change, especially if the 'Fixed test' files are relevant to other contributors.
- [ ] If the 'Fixed test' files are generated by a common tool or process within the project, document this process to help new contributors understand why these files are ignored.

### From PR #19

**Source:** [PR #19](https://github.com/bdaly101/AI-SQL-Dev/pull/19)

- [ ] Ensure that the addition to the .gitignore file aligns with the project's long-term needs. If the 'Fixed test' files are temporary, consider alternative cleanup methods.
- [ ] Review the project's documentation or README to ensure it reflects this change, especially if the 'Fixed test' files are relevant to other contributors.
- [ ] If the 'Fixed test' files are generated by a common tool or process within the project, document this process to help new contributors understand why these files are ignored.

### From PR #19

**Source:** [PR #19](https://github.com/bdaly101/AI-SQL-Dev/pull/19)

- [ ] Ensure that the addition to the .gitignore file aligns with the project's long-term needs. If the 'Fixed test' files are temporary, consider alternative cleanup methods.
- [ ] Review the project's documentation or README to ensure it reflects this change, especially if the 'Fixed test' files are relevant to other contributors.
- [ ] If the 'Fixed test' files are generated by a common tool or process within the project, document this process to help new contributors understand why these files are ignored.

