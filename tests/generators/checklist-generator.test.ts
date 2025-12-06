import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChecklistGenerator } from '../../src/generators/checklist-generator';
import { GeneratedMigration, SupabaseUsagePattern } from '../../src/types';
import { existsSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import path from 'path';

const TEST_OUTPUT_DIR = path.join(__dirname, '../temp-output');

describe('ChecklistGenerator', () => {
  let generator: ChecklistGenerator;

  const mockMigration: GeneratedMigration = {
    timestamp: '20241206120000',
    filename: '20241206120000_ai_generated_rls_policies.sql',
    content: '-- test migration content',
    affectedTables: ['users', 'projects', 'tasks'],
  };

  const mockUsagePatterns: SupabaseUsagePattern[] = [
    {
      file: 'src/api.ts',
      lineNumber: 10,
      operation: 'select',
      table: 'users',
      hasUserIdFilter: false,
      hasTenantIdFilter: true,
      code: "supabase.from('users').select('*')",
    },
    {
      file: 'src/api.ts',
      lineNumber: 20,
      operation: 'select',
      table: 'projects',
      hasUserIdFilter: true,
      hasTenantIdFilter: false,
      code: "supabase.from('projects').select('*').eq('user_id', userId)",
    },
    {
      file: 'src/hooks/useTasks.ts',
      lineNumber: 5,
      operation: 'select',
      table: 'tasks',
      hasUserIdFilter: true,
      hasTenantIdFilter: false,
      code: "supabase.from('tasks').select('*')",
    },
  ];

  beforeEach(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    generator = new ChecklistGenerator(TEST_OUTPUT_DIR);
  });

  afterEach(() => {
    // Clean up generated files
    const checklistPath = path.join(TEST_OUTPUT_DIR, `${mockMigration.timestamp}_checklist.md`);
    if (existsSync(checklistPath)) {
      unlinkSync(checklistPath);
    }
    if (existsSync(TEST_OUTPUT_DIR)) {
      try {
        rmdirSync(TEST_OUTPUT_DIR);
      } catch {
        // Directory not empty or doesn't exist
      }
    }
  });

  describe('generateChecklist', () => {
    it('should create a checklist file', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      expect(existsSync(checklistPath)).toBe(true);
    });

    it('should use correct filename format', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      expect(checklistPath).toContain('20241206120000_checklist.md');
    });

    it('should include affected tables', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('users');
      expect(content).toContain('projects');
      expect(content).toContain('tasks');
    });

    it('should include files requiring review', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('src/api.ts');
      expect(content).toContain('src/hooks/useTasks.ts');
    });

    it('should include migration steps', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('Review the generated migration file');
      expect(content).toContain('Test the migration');
      expect(content).toContain('supabase db push');
    });

    it('should include testing checklist', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('Test SELECT queries');
      expect(content).toContain('Test INSERT operations');
      expect(content).toContain('Test UPDATE operations');
      expect(content).toContain('Test DELETE operations');
    });

    it('should include rollback plan', () => {
      const checklistPath = generator.generateChecklist(mockMigration, mockUsagePatterns);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('Rollback');
    });

    it('should handle empty usage patterns', () => {
      const checklistPath = generator.generateChecklist(mockMigration, []);
      
      const content = require('fs').readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('No files require updates');
    });
  });
});

