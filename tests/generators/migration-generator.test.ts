import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MigrationGenerator } from '../../src/generators/migration-generator';
import { existsSync, unlinkSync, mkdirSync, rmdirSync, readFileSync } from 'fs';
import path from 'path';

const TEST_OUTPUT_DIR = path.join(__dirname, '../temp-migrations');

describe('MigrationGenerator', () => {
  let generator: MigrationGenerator;

  const mockSQLContent = `
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (id = auth.uid());
`;

  const mockAffectedTables = ['users', 'projects'];

  beforeEach(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    generator = new MigrationGenerator(TEST_OUTPUT_DIR);
  });

  afterEach(() => {
    // Clean up generated files
    if (existsSync(TEST_OUTPUT_DIR)) {
      const files = require('fs').readdirSync(TEST_OUTPUT_DIR);
      files.forEach((file: string) => {
        unlinkSync(path.join(TEST_OUTPUT_DIR, file));
      });
      try {
        rmdirSync(TEST_OUTPUT_DIR);
      } catch {
        // Directory not empty or doesn't exist
      }
    }
  });

  describe('generateMigration', () => {
    it('should create a migration file', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      const filePath = path.join(TEST_OUTPUT_DIR, migration.filename);
      
      expect(existsSync(filePath)).toBe(true);
    });

    it('should use timestamp format for filename', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      
      // Filename should match pattern: YYYYMMDDHHMMSS_ai_generated_rls_policies.sql
      expect(migration.filename).toMatch(/^\d{14}_ai_generated_rls_policies\.sql$/);
    });

    it('should return migration metadata', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      
      expect(migration.timestamp).toBeDefined();
      expect(migration.timestamp.length).toBe(14);
      expect(migration.filename).toBeDefined();
      expect(migration.content).toBeDefined();
      expect(migration.affectedTables).toEqual(mockAffectedTables);
    });

    it('should include header comment', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      const filePath = path.join(TEST_OUTPUT_DIR, migration.filename);
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('AI Generated RLS Policies');
      expect(content).toContain('Generated at:');
    });

    it('should include affected tables in header', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      const filePath = path.join(TEST_OUTPUT_DIR, migration.filename);
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('Affected tables: users, projects');
    });

    it('should include the SQL content', () => {
      const migration = generator.generateMigration(mockSQLContent, mockAffectedTables);
      const filePath = path.join(TEST_OUTPUT_DIR, migration.filename);
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('CREATE POLICY');
    });

    it('should create output directory if it does not exist', () => {
      const newOutputDir = path.join(TEST_OUTPUT_DIR, 'nested', 'dir');
      const nestedGenerator = new MigrationGenerator(newOutputDir);
      
      const migration = nestedGenerator.generateMigration(mockSQLContent, mockAffectedTables);
      
      expect(existsSync(newOutputDir)).toBe(true);
      expect(existsSync(path.join(newOutputDir, migration.filename))).toBe(true);
      
      // Clean up nested directory
      unlinkSync(path.join(newOutputDir, migration.filename));
      rmdirSync(path.join(TEST_OUTPUT_DIR, 'nested', 'dir'));
      rmdirSync(path.join(TEST_OUTPUT_DIR, 'nested'));
    });
  });

  describe('timestamp generation', () => {
    it('should generate unique timestamps for sequential calls', async () => {
      const migration1 = generator.generateMigration(mockSQLContent, mockAffectedTables);
      
      // Wait 1 second to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const migration2 = generator.generateMigration(mockSQLContent, mockAffectedTables);
      
      expect(migration1.timestamp).not.toBe(migration2.timestamp);
    });
  });
});

