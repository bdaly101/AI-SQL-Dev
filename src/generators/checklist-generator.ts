import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { AffectedFile, GeneratedMigration, SupabaseUsagePattern } from '../types';

export class ChecklistGenerator {
  private outputDir: string;

  constructor(outputDir: string = '.') {
    // Normalize to prevent path traversal
    this.outputDir = normalize(outputDir);
  }

  generateChecklist(
    migration: GeneratedMigration,
    usagePatterns: SupabaseUsagePattern[]
  ): string {
    const affectedFiles = this.identifyAffectedFiles(migration, usagePatterns);
    // Sanitize timestamp to prevent injection
    const safeTimestamp = migration.timestamp.replace(/[^0-9]/g, '');
    const filename = `${safeTimestamp}_checklist.md`;
    const fullPath = resolve(this.outputDir, filename);
    
    // Security: Ensure the resolved path is within the output directory
    const resolvedOutputDir = resolve(this.outputDir);
    if (!fullPath.startsWith(resolvedOutputDir)) {
      throw new Error('Invalid output path detected');
    }

    const content = this.buildChecklistContent(migration, affectedFiles);

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    writeFileSync(fullPath, content, 'utf-8');

    return fullPath;
  }

  private identifyAffectedFiles(
    migration: GeneratedMigration,
    usagePatterns: SupabaseUsagePattern[]
  ): AffectedFile[] {
    const affectedFiles: AffectedFile[] = [];
    const fileMap = new Map<string, Set<string>>();

    // Group patterns by file and table
    for (const pattern of usagePatterns) {
      if (migration.affectedTables.includes(pattern.table)) {
        if (!fileMap.has(pattern.file)) {
          fileMap.set(pattern.file, new Set());
        }
        fileMap.get(pattern.file)!.add(pattern.table);
      }
    }

    // Create affected file entries
    for (const [file, tables] of fileMap.entries()) {
      affectedFiles.push({
        path: file,
        reason: `Uses table(s): ${Array.from(tables).join(', ')}`,
        requiresUpdate: true
      });
    }

    return affectedFiles;
  }

  private buildChecklistContent(
    migration: GeneratedMigration,
    affectedFiles: AffectedFile[]
  ): string {
    let content = `# RLS Policy Migration Checklist\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Migration File:** ${migration.filename}\n\n`;

    content += `## Affected Tables\n\n`;
    for (const table of migration.affectedTables) {
      content += `- [ ] ${table}\n`;
    }

    content += `\n## Migration Steps\n\n`;
    content += `- [ ] Review the generated migration file\n`;
    content += `- [ ] Test the migration in a development environment\n`;
    content += `- [ ] Apply the migration: \`supabase db push\` or \`supabase migration up\`\n`;
    content += `- [ ] Verify RLS policies are active\n`;

    content += `\n## Files Requiring Review\n\n`;
    if (affectedFiles.length === 0) {
      content += `No files require updates.\n`;
    } else {
      content += `The following files use affected tables and should be reviewed to ensure they work correctly with new RLS policies:\n\n`;
      for (const file of affectedFiles) {
        const checkbox = file.requiresUpdate ? '- [ ]' : '- [x]';
        content += `${checkbox} **${file.path}**\n`;
        content += `  - ${file.reason}\n`;
      }
    }

    content += `\n## Testing Checklist\n\n`;
    content += `- [ ] Test SELECT queries with and without auth context\n`;
    content += `- [ ] Test INSERT operations with proper user_id/tenant_id\n`;
    content += `- [ ] Test UPDATE operations respect RLS policies\n`;
    content += `- [ ] Test DELETE operations respect RLS policies\n`;
    content += `- [ ] Verify unauthorized access is properly blocked\n`;

    content += `\n## Rollback Plan\n\n`;
    content += `If issues arise, you can rollback by:\n`;
    content += `1. Creating a new migration that drops the policies\n`;
    content += `2. Or use: \`supabase db reset\` (development only)\n`;

    return content;
  }
}
