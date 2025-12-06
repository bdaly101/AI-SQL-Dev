export interface TableSchema {
  name: string;
  columns: Column[];
  constraints: string[];
  sourceFile: string;
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface RLSPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  sourceFile: string;
}

export interface SupabaseUsagePattern {
  file: string;
  lineNumber: number;
  operation: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  authFilter?: string;
  hasUserIdFilter: boolean;
  hasTenantIdFilter: boolean;
  code: string;
}

export interface MigrationContext {
  schemas: TableSchema[];
  rlsPolicies: RLSPolicy[];
  usagePatterns: SupabaseUsagePattern[];
}

export interface GeneratedMigration {
  timestamp: string;
  filename: string;
  content: string;
  affectedTables: string[];
}

export interface AffectedFile {
  path: string;
  reason: string;
  requiresUpdate: boolean;
}

// TypeScript type extraction types
export interface TypeDefinition {
  name: string;
  filePath: string;
  properties: PropertyDefinition[];
  supabaseTable?: string;
  kind: 'interface' | 'type' | 'zod' | 'supabase-generated';
}

export interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
}

// Extended context with type information
export interface FullProjectContext extends MigrationContext {
  typeDefinitions: TypeDefinition[];
}
