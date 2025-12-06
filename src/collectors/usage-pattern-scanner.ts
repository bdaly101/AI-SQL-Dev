import { glob } from 'glob';
import { readFileSync } from 'fs';
import { SupabaseUsagePattern } from '../types';

export class UsagePatternScanner {
  private sourceDir: string;

  constructor(sourceDir: string = 'src') {
    this.sourceDir = sourceDir;
  }

  async scanUsagePatterns(): Promise<SupabaseUsagePattern[]> {
    const patterns: SupabaseUsagePattern[] = [];
    const tsFiles = await glob(`${this.sourceDir}/**/*.{ts,tsx,js,jsx}`);

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const patternsInFile = this.extractPatterns(content, file);
      patterns.push(...patternsInFile);
    }

    return patterns;
  }

  private extractPatterns(content: string, file: string): SupabaseUsagePattern[] {
    const patterns: SupabaseUsagePattern[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Look for Supabase client usage patterns
      // Pattern: .from('table_name')
      const fromMatch = line.match(/\.from\s*\(\s*['"`](\w+)['"`]\s*\)/);
      if (!fromMatch) continue;

      const table = fromMatch[1];
      
      // Get the full statement context (may span multiple lines)
      const context = this.getStatementContext(lines, i);
      
      // Determine operation
      let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
      if (context.match(/\.select\s*\(/)) operation = 'select';
      else if (context.match(/\.insert\s*\(/)) operation = 'insert';
      else if (context.match(/\.update\s*\(/)) operation = 'update';
      else if (context.match(/\.delete\s*\(/)) operation = 'delete';

      // Check for auth filters
      const hasUserIdFilter = context.match(/user_id|userId|auth\.uid\(\)|session.*user.*id/i) !== null;
      const hasTenantIdFilter = context.match(/tenant_id|tenantId|organization_id|org_id/i) !== null;
      
      // Extract auth filter expression
      let authFilter: string | undefined;
      const eqMatch = context.match(/\.eq\s*\(\s*['"`](user_id|userId|tenant_id|tenantId)['"`]\s*,\s*([^)]+)\)/i);
      if (eqMatch) {
        authFilter = `${eqMatch[1]} = ${eqMatch[2]}`;
      }

      patterns.push({
        file,
        lineNumber,
        operation,
        table,
        authFilter,
        hasUserIdFilter,
        hasTenantIdFilter,
        code: context.trim()
      });
    }

    return patterns;
  }

  private getStatementContext(lines: string[], startIndex: number): string {
    // Get up to 5 lines of context for the statement
    let context = '';
    let depth = 0;
    let foundStart = false;

    // Look backwards for the start of the statement
    for (let i = startIndex; i >= Math.max(0, startIndex - 5); i--) {
      const line = lines[i];
      if (line.match(/supabase|const|let|var|await|return/)) {
        foundStart = true;
        depth = i;
        break;
      }
    }

    if (!foundStart) depth = startIndex;

    // Collect lines from start to a reasonable end point
    for (let i = depth; i < Math.min(lines.length, depth + 10); i++) {
      context += lines[i] + '\n';
      
      // Stop at statement terminators
      if (lines[i].match(/;$/) && i > startIndex) {
        break;
      }
    }

    return context;
  }
}
