import { glob } from 'glob';
import { readFileSync } from 'fs';
import { TableSchema, RLSPolicy, Column } from '../types';

export class MigrationCollector {
  private migrationsPath: string;

  constructor(migrationsPath: string = 'supabase/migrations') {
    this.migrationsPath = migrationsPath;
  }

  async collectSchemas(): Promise<TableSchema[]> {
    const schemas: TableSchema[] = [];
    const migrationFiles = await glob(`${this.migrationsPath}/**/*.sql`);

    for (const file of migrationFiles) {
      const content = readFileSync(file, 'utf-8');
      const tablesInFile = this.parseTableSchemas(content, file);
      schemas.push(...tablesInFile);
    }

    return schemas;
  }

  async collectRLSPolicies(): Promise<RLSPolicy[]> {
    const policies: RLSPolicy[] = [];
    const migrationFiles = await glob(`${this.migrationsPath}/**/*.sql`);

    for (const file of migrationFiles) {
      const content = readFileSync(file, 'utf-8');
      const policiesInFile = this.parseRLSPolicies(content, file);
      policies.push(...policiesInFile);
    }

    return policies;
  }

  private parseTableSchemas(content: string, sourceFile: string): TableSchema[] {
    const schemas: TableSchema[] = [];
    
    // Match CREATE TABLE statements
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1].replace(/["'`]/g, '');
      const tableBody = match[2];
      
      const columns = this.parseColumns(tableBody);
      const constraints = this.parseConstraints(tableBody);

      schemas.push({
        name: tableName,
        columns,
        constraints,
        sourceFile
      });
    }

    return schemas;
  }

  private parseColumns(tableBody: string): Column[] {
    const columns: Column[] = [];
    const lines = tableBody.split(',').map(l => l.trim());

    for (const line of lines) {
      // Skip constraint lines
      if (line.match(/^\s*(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)/i)) {
        continue;
      }

      const columnMatch = line.match(/^([^\s]+)\s+([^\s]+)(.*)$/);
      if (columnMatch) {
        const name = columnMatch[1].replace(/["'`]/g, '');
        const type = columnMatch[2];
        const rest = columnMatch[3];

        const nullable = !rest.match(/NOT\s+NULL/i);
        const defaultMatch = rest.match(/DEFAULT\s+(.+?)(?:\s|$)/i);
        const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

        columns.push({
          name,
          type,
          nullable,
          defaultValue
        });
      }
    }

    return columns;
  }

  private parseConstraints(tableBody: string): string[] {
    const constraints: string[] = [];
    const constraintRegex = /(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT).*?(?=,|$)/gi;
    let match;

    while ((match = constraintRegex.exec(tableBody)) !== null) {
      constraints.push(match[0].trim());
    }

    return constraints;
  }

  private parseRLSPolicies(content: string, sourceFile: string): RLSPolicy[] {
    const policies: RLSPolicy[] = [];
    
    // Match CREATE POLICY statements - handles multi-line and quoted names
    // Pattern: CREATE POLICY "name" ON table FOR operation USING (...) WITH CHECK (...)
    const policyRegex = /CREATE\s+POLICY\s+["']([^"']+)["']\s+ON\s+(\w+)\s+FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\s+(?:USING\s*\(([^;]+?)\))?(?:\s+WITH\s+CHECK\s*\(([^;]+?)\))?/gis;
    let match;

    while ((match = policyRegex.exec(content)) !== null) {
      const name = match[1];
      const table = match[2];
      const operation = match[3].toUpperCase() as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
      const using = match[4]?.trim();
      const withCheck = match[5]?.trim();

      policies.push({
        name,
        table,
        operation,
        using,
        withCheck,
        sourceFile
      });
    }

    return policies;
  }
}
