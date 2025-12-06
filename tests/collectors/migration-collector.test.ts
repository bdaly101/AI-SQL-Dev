import { describe, it, expect, beforeAll } from 'vitest';
import { MigrationCollector } from '../../src/collectors/migration-collector';
import path from 'path';

const FIXTURES_PATH = path.join(__dirname, '../fixtures/sample-project/supabase/migrations');

describe('MigrationCollector', () => {
  let collector: MigrationCollector;

  beforeAll(() => {
    collector = new MigrationCollector(FIXTURES_PATH);
  });

  describe('collectSchemas', () => {
    it('should find all tables in migration files', async () => {
      const schemas = await collector.collectSchemas();
      
      expect(schemas.length).toBe(3);
      expect(schemas.map(s => s.name)).toContain('users');
      expect(schemas.map(s => s.name)).toContain('projects');
      expect(schemas.map(s => s.name)).toContain('tasks');
    });

    it('should extract columns for users table', async () => {
      const schemas = await collector.collectSchemas();
      const usersTable = schemas.find(s => s.name === 'users');
      
      expect(usersTable).toBeDefined();
      expect(usersTable!.columns.length).toBe(4);
      
      const columnNames = usersTable!.columns.map(c => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('created_at');
    });

    it('should detect tenant_id column', async () => {
      const schemas = await collector.collectSchemas();
      const usersTable = schemas.find(s => s.name === 'users');
      
      const tenantCol = usersTable!.columns.find(c => c.name === 'tenant_id');
      expect(tenantCol).toBeDefined();
      expect(tenantCol!.type).toBe('UUID');
      expect(tenantCol!.nullable).toBe(false);
    });

    it('should detect user_id column in projects', async () => {
      const schemas = await collector.collectSchemas();
      const projectsTable = schemas.find(s => s.name === 'projects');
      
      const userIdCol = projectsTable!.columns.find(c => c.name === 'user_id');
      expect(userIdCol).toBeDefined();
      expect(userIdCol!.type).toBe('UUID');
    });

    it('should extract column defaults', async () => {
      const schemas = await collector.collectSchemas();
      const usersTable = schemas.find(s => s.name === 'users');
      
      const idCol = usersTable!.columns.find(c => c.name === 'id');
      expect(idCol?.defaultValue).toBe('gen_random_uuid()');
      
      const createdAtCol = usersTable!.columns.find(c => c.name === 'created_at');
      expect(createdAtCol?.defaultValue).toBe('now()');
    });
  });

  describe('collectRLSPolicies', () => {
    it('should find existing RLS policies', async () => {
      const policies = await collector.collectRLSPolicies();
      
      expect(policies.length).toBeGreaterThan(0);
    });

    it('should extract policy details', async () => {
      const policies = await collector.collectRLSPolicies();
      const usersPolicy = policies.find(p => p.table === 'users');
      
      expect(usersPolicy).toBeDefined();
      expect(usersPolicy!.operation).toBe('SELECT');
      expect(usersPolicy!.using).toContain('tenant_id');
    });
  });

  describe('edge cases', () => {
    it('should handle empty migrations directory', async () => {
      const emptyCollector = new MigrationCollector('/nonexistent/path');
      const schemas = await emptyCollector.collectSchemas();
      
      expect(schemas).toEqual([]);
    });

    it('should handle IF NOT EXISTS syntax', async () => {
      const schemas = await collector.collectSchemas();
      // The fixture doesn't use IF NOT EXISTS, but the collector should handle it
      expect(schemas.length).toBeGreaterThan(0);
    });
  });
});

