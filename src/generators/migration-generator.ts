import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { GeneratedMigration } from '../types';

export class MigrationGenerator {
  private outputDir: string;

  constructor(outputDir: string = 'supabase/migrations') {
    // Normalize and resolve the output directory to prevent path traversal
    this.outputDir = normalize(outputDir);
  }

  generateMigration(sqlContent: string, affectedTables: string[]): GeneratedMigration {
    const timestamp = this.generateTimestamp();
    // Sanitize filename to prevent injection
    const safeTimestamp = timestamp.replace(/[^0-9]/g, '');
    const filename = `${safeTimestamp}_ai_generated_rls_policies.sql`;
    const fullPath = resolve(this.outputDir, filename);
    
    // Security: Ensure the resolved path is within the output directory
    const resolvedOutputDir = resolve(this.outputDir);
    if (!fullPath.startsWith(resolvedOutputDir)) {
      throw new Error('Invalid output path detected');
    }

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Add header comment to migration
    const content = `-- AI Generated RLS Policies
-- Generated at: ${new Date().toISOString()}
-- Affected tables: ${affectedTables.join(', ')}

${sqlContent}
`;

    // Write the migration file
    writeFileSync(fullPath, content, 'utf-8');

    return {
      timestamp,
      filename,
      content,
      affectedTables
    };
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
