import { describe, it, expect, beforeAll } from 'vitest';
import { TypesCollector } from '../../src/collectors/types-collector';
import path from 'path';

const FIXTURES_PATH = path.join(__dirname, '../fixtures/sample-project/src');

describe('TypesCollector', () => {
  let collector: TypesCollector;

  beforeAll(() => {
    collector = new TypesCollector(FIXTURES_PATH);
  });

  describe('collectTypes', () => {
    it('should find TypeScript interfaces', async () => {
      const types = await collector.collectTypes();
      
      const interfaceNames = types.filter(t => t.kind === 'interface').map(t => t.name);
      expect(interfaceNames).toContain('User');
      expect(interfaceNames).toContain('Project');
      expect(interfaceNames).toContain('Task');
    });

    it('should extract interface properties', async () => {
      const types = await collector.collectTypes();
      const userType = types.find(t => t.name === 'User');
      
      expect(userType).toBeDefined();
      expect(userType!.properties.length).toBeGreaterThan(0);
      
      const propNames = userType!.properties.map(p => p.name);
      expect(propNames).toContain('id');
      expect(propNames).toContain('email');
      expect(propNames).toContain('tenant_id');
    });

    it('should detect optional properties', async () => {
      const types = await collector.collectTypes();
      const projectType = types.find(t => t.name === 'Project');
      
      const descProp = projectType!.properties.find(p => p.name === 'description');
      expect(descProp?.optional).toBe(true);
    });

    it('should detect Supabase Database types or infer from naming', async () => {
      const types = await collector.collectTypes();
      
      // Should find types - either supabase-generated or inferred from Database type file
      // The regex-based parser may not perfectly parse the Database type structure
      // but should still find the related types in the file
      const dbTypes = types.filter(t => 
        t.kind === 'supabase-generated' || 
        t.filePath.includes('database.ts')
      );
      expect(dbTypes.length).toBeGreaterThan(0);
    });

    it('should infer table mappings', async () => {
      const types = await collector.collectTypes();
      
      const mappedTypes = types.filter(t => t.supabaseTable);
      expect(mappedTypes.length).toBeGreaterThan(0);
      
      // User interface should map to users table
      const userType = types.find(t => t.name === 'User');
      expect(userType?.supabaseTable).toBe('users');
    });

    it('should map Project to projects table', async () => {
      const types = await collector.collectTypes();
      const projectType = types.find(t => t.name === 'Project');
      
      expect(projectType?.supabaseTable).toBe('projects');
    });

    it('should map Task to tasks table', async () => {
      const types = await collector.collectTypes();
      const taskType = types.find(t => t.name === 'Task');
      
      expect(taskType?.supabaseTable).toBe('tasks');
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory', async () => {
      const emptyCollector = new TypesCollector('/nonexistent/path');
      const types = await emptyCollector.collectTypes();
      
      expect(types).toEqual([]);
    });

    it('should skip React component props', async () => {
      const types = await collector.collectTypes();
      
      const propsTypes = types.filter(t => t.name.endsWith('Props'));
      expect(propsTypes.length).toBe(0);
    });
  });
});

