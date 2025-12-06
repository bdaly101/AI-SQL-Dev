# Example Usage

This guide demonstrates AI-SQL-Dev with practical examples.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npm run build
   ```

2. Initialize configuration:
   ```bash
   npm start init
   ```

3. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key-here
   ```

## Example Files

### Migration Files (`supabase/migrations/`)

Example initial migration (`20240101000000_initial_schema.sql`):

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### TypeScript Files (`src/`)

Example types file (`src/types/database.ts`):

```typescript
export interface User {
  id: string;
  email: string;
  tenant_id: string;
  created_at: Date;
}

export interface Project {
  id: string;
  name: string;
  user_id: string;
  tenant_id: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  project_id: string;
  user_id: string;
  completed: boolean;
  created_at: Date;
}
```

Example API file (`src/api.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// User queries - filtered by tenant
export async function getUsers(tenantId: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId);
}

// Project queries - filtered by user
export async function getUserProjects(userId: string) {
  return supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);
}

// Task queries - filtered by user
export async function getUserTasks(userId: string) {
  return supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
}

// Insert with user context
export async function createProject(userId: string, tenantId: string, name: string) {
  return supabase
    .from('projects')
    .insert({ user_id: userId, tenant_id: tenantId, name });
}

// Update with ownership check
export async function updateTask(taskId: string, userId: string, data: Partial<Task>) {
  return supabase
    .from('tasks')
    .update(data)
    .eq('id', taskId)
    .eq('user_id', userId);
}
```

## Running the Examples

### Analyze the Codebase

```bash
npm start analyze -- -s test-src -m supabase/migrations
```

Expected output:
```
🔍 Analyzing Codebase

📊 Analysis Results:

Tables:
  - users (4 columns) tenant_id
  - projects (5 columns) user_id tenant_id
  - tasks (6 columns) user_id

Existing RLS Policies:
  ⚠️  None found - tables may be unprotected

TypeScript Types:
  - User → users (interface)
  - Project → projects (interface)
  - Task → tasks (interface)

Usage Patterns:
  - users: 1 usage(s) (0 with user_id, 1 with tenant_id)
  - projects: 2 usage(s) (2 with user_id, 1 with tenant_id)
  - tasks: 2 usage(s) (2 with user_id, 0 with tenant_id)

🔐 Security Summary:
  ⚠️  Tables without RLS: users, projects, tasks
  Multi-tenant tables: 2
  User-owned tables: 2
```

### Preview RLS Policies (Dry Run)

```bash
npm start generate -- -s test-src -m supabase/migrations --dry-run
```

### Generate RLS Policies

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

### Migration File (`supabase/migrations/YYYYMMDDHHMMSS_ai_generated_rls_policies.sql`)

```sql
-- AI Generated RLS Policies
-- Generated at: 2024-12-06T12:00:00.000Z
-- Affected tables: users, projects, tasks

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users table policies (tenant isolation)
CREATE POLICY "Users can view users in their tenant"
  ON users FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Projects table policies (user ownership + tenant)
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid() OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid() AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

-- Tasks table policies (user ownership)
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());
```

### Checklist File (`supabase/migrations/YYYYMMDDHHMMSS_checklist.md`)

```markdown
# RLS Policy Migration Checklist

**Generated:** 2024-12-06T12:00:00.000Z
**Migration File:** 20241206120000_ai_generated_rls_policies.sql

## Affected Tables

- [ ] users
- [ ] projects
- [ ] tasks

## Migration Steps

- [ ] Review the generated migration file
- [ ] Test the migration in a development environment
- [ ] Apply the migration: `supabase db push` or `supabase migration up`
- [ ] Verify RLS policies are active

## Files Requiring Review

- [ ] **src/api.ts**
  - Uses table(s): users, projects, tasks

## Testing Checklist

- [ ] Test SELECT queries with and without auth context
- [ ] Test INSERT operations with proper user_id/tenant_id
- [ ] Test UPDATE operations respect RLS policies
- [ ] Test DELETE operations respect RLS policies
- [ ] Verify unauthorized access is properly blocked

## Rollback Plan

If issues arise, you can rollback by:
1. Creating a new migration that drops the policies
2. Or use: `supabase db reset` (development only)
```

## What the AI Generates

Based on the usage patterns, the AI generates RLS policies that:

1. **Enable RLS** on all tables
2. **Tenant isolation** for users table using JWT claim
3. **User ownership** for projects and tasks using `auth.uid()`
4. **Combined patterns** where both user_id and tenant_id are present
5. **CRUD coverage** with appropriate SELECT, INSERT, UPDATE, DELETE policies

The policies will use:
- `auth.uid()` to match against `user_id` columns
- `(auth.jwt() ->> 'tenant_id')::uuid` for tenant isolation
- Standard Supabase/PostgreSQL RLS syntax

## Configuration Examples

### Multi-tenant SaaS

```json
{
  "rls": {
    "defaultPatterns": {
      "userColumn": "user_id",
      "tenantColumn": "organization_id"
    }
  }
}
```

### Single-tenant with User Ownership

```json
{
  "rls": {
    "defaultPatterns": {
      "userColumn": "owner_id",
      "tenantColumn": ""
    }
  }
}
```

### Custom Source Structure

```json
{
  "migrations": {
    "directory": "db/migrations"
  },
  "apiCollection": {
    "include": ["app/**/*.ts", "lib/**/*.ts"]
  },
  "output": {
    "directory": "db/migrations"
  }
}
```
