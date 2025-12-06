import { describe, it, expect, beforeAll } from 'vitest';
import { UsagePatternScanner } from '../../src/collectors/usage-pattern-scanner';
import path from 'path';

const FIXTURES_PATH = path.join(__dirname, '../fixtures/sample-project/src');

describe('UsagePatternScanner', () => {
  let scanner: UsagePatternScanner;

  beforeAll(() => {
    scanner = new UsagePatternScanner(FIXTURES_PATH);
  });

  describe('scanUsagePatterns', () => {
    it('should find Supabase client usage', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should detect table names from .from() calls', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const tables = [...new Set(patterns.map(p => p.table))];
      expect(tables).toContain('users');
      expect(tables).toContain('projects');
      expect(tables).toContain('tasks');
    });

    it('should detect SELECT operations', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const selectOps = patterns.filter(p => p.operation === 'select');
      expect(selectOps.length).toBeGreaterThan(0);
    });

    it('should detect INSERT operations', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const insertOps = patterns.filter(p => p.operation === 'insert');
      expect(insertOps.length).toBeGreaterThan(0);
    });

    it('should detect UPDATE operations', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const updateOps = patterns.filter(p => p.operation === 'update');
      expect(updateOps.length).toBeGreaterThan(0);
    });

    it('should detect DELETE operations', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const deleteOps = patterns.filter(p => p.operation === 'delete');
      expect(deleteOps.length).toBeGreaterThan(0);
    });

    it('should detect user_id filters', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const withUserFilter = patterns.filter(p => p.hasUserIdFilter);
      expect(withUserFilter.length).toBeGreaterThan(0);
      
      // Projects and tasks should have user_id filters
      const projectPatterns = patterns.filter(p => p.table === 'projects');
      expect(projectPatterns.some(p => p.hasUserIdFilter)).toBe(true);
    });

    it('should detect tenant_id filters', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      const withTenantFilter = patterns.filter(p => p.hasTenantIdFilter);
      expect(withTenantFilter.length).toBeGreaterThan(0);
      
      // Users query has tenant_id filter
      const userPatterns = patterns.filter(p => p.table === 'users');
      expect(userPatterns.some(p => p.hasTenantIdFilter)).toBe(true);
    });

    it('should capture code context', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      patterns.forEach(p => {
        expect(p.code).toBeDefined();
        expect(p.code.length).toBeGreaterThan(0);
      });
    });

    it('should capture line numbers', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      patterns.forEach(p => {
        expect(p.lineNumber).toBeGreaterThan(0);
      });
    });

    it('should capture file paths', async () => {
      const patterns = await scanner.scanUsagePatterns();
      
      patterns.forEach(p => {
        expect(p.file).toBeDefined();
        expect(p.file).toContain('api.ts');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory', async () => {
      const emptyScanner = new UsagePatternScanner('/nonexistent/path');
      const patterns = await emptyScanner.scanUsagePatterns();
      
      expect(patterns).toEqual([]);
    });
  });
});

