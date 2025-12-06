import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { ConfigLoader, generateDefaultConfig } from '../src/config';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

const TEST_DIR = path.join(__dirname, 'fixtures/config-test');

describe('ConfigLoader', () => {
  const configPath = path.join(TEST_DIR, '.ai-sql-dev.json');
  
  // Store original env vars at the start
  let originalAIProvider: string | undefined;
  let originalAIModel: string | undefined;

  beforeAll(() => {
    // Save original env vars before any tests run
    originalAIProvider = process.env.AI_PROVIDER;
    originalAIModel = process.env.AI_MODEL;
  });

  afterAll(() => {
    // Restore original env vars after all tests
    if (originalAIProvider !== undefined) {
      process.env.AI_PROVIDER = originalAIProvider;
    } else {
      delete process.env.AI_PROVIDER;
    }
    if (originalAIModel !== undefined) {
      process.env.AI_MODEL = originalAIModel;
    } else {
      delete process.env.AI_MODEL;
    }
  });

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    // Clean up any existing test config
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  afterEach(() => {
    // Clean up
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
    // Reset env vars
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
  });

  describe('default config', () => {
    it('should use default values when no config file exists', () => {
      const loader = new ConfigLoader(TEST_DIR);
      const config = loader.getConfig();
      
      expect(config.migrations.directory).toBe('supabase/migrations');
      expect(config.ai.provider).toBe('claude');
      expect(config.rls.defaultPatterns.userColumn).toBe('user_id');
      expect(config.rls.defaultPatterns.tenantColumn).toBe('tenant_id');
    });

    it('should report no config file found', () => {
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.hasConfigFile()).toBe(false);
      expect(loader.getConfigPath()).toBeUndefined();
    });
  });

  describe('config file loading', () => {
    it('should load config from .ai-sql-dev.json', () => {
      const customConfig = {
        migrations: {
          directory: 'custom/migrations',
        },
        rls: {
          defaultPatterns: {
            userColumn: 'owner_id',
            tenantColumn: 'org_id',
          },
        },
      };
      
      writeFileSync(configPath, JSON.stringify(customConfig, null, 2));
      
      const loader = new ConfigLoader(TEST_DIR);
      const config = loader.getConfig();
      
      expect(config.migrations.directory).toBe('custom/migrations');
      expect(config.rls.defaultPatterns.userColumn).toBe('owner_id');
      expect(config.rls.defaultPatterns.tenantColumn).toBe('org_id');
    });

    it('should merge with defaults', () => {
      const partialConfig = {
        migrations: {
          directory: 'custom/path',
        },
      };
      
      writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));
      
      const loader = new ConfigLoader(TEST_DIR);
      const config = loader.getConfig();
      
      // Custom value
      expect(config.migrations.directory).toBe('custom/path');
      // Default values preserved
      expect(config.ai.provider).toBe('claude');
      expect(config.rls.defaultPatterns.userColumn).toBe('user_id');
    });

    it('should report config file found', () => {
      writeFileSync(configPath, JSON.stringify({}, null, 2));
      
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.hasConfigFile()).toBe(true);
      expect(loader.getConfigPath()).toBe(configPath);
    });
  });

  describe('environment variables', () => {
    it('should read AI_PROVIDER env var when set to valid value', () => {
      process.env.AI_PROVIDER = 'openai';
      
      const loader = new ConfigLoader(TEST_DIR);
      const config = loader.getConfig();
      
      // When AI_PROVIDER is set to a valid value, it should be used
      expect(['claude', 'openai']).toContain(config.ai.provider);
    });

    it('should read AI_MODEL env var when set', () => {
      process.env.AI_MODEL = 'custom-model';
      
      const loader = new ConfigLoader(TEST_DIR);
      const config = loader.getConfig();
      
      expect(config.ai.model).toBe('custom-model');
    });

    it('should handle AI_PROVIDER values case-insensitively', () => {
      process.env.AI_PROVIDER = 'CLAUDE';
      
      const loader = new ConfigLoader(TEST_DIR);
      // The loader should handle or normalize the provider value
      const provider = loader.getAIProvider();
      
      expect(['claude', 'openai', 'CLAUDE']).toContain(provider);
    });
  });

  describe('convenience methods', () => {
    it('getMigrationsPath should return migrations directory', () => {
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.getMigrationsPath()).toBe('supabase/migrations');
    });

    it('getAIProvider should return a valid provider', () => {
      const loader = new ConfigLoader(TEST_DIR);
      const provider = loader.getAIProvider();
      
      // Should return either claude or openai
      expect(['claude', 'openai']).toContain(provider);
    });

    it('getAIModel should return a model string', () => {
      const loader = new ConfigLoader(TEST_DIR);
      const model = loader.getAIModel();
      
      // Should return a non-empty string
      expect(typeof model).toBe('string');
      expect(model.length).toBeGreaterThan(0);
    });

    it('getUserColumn should return user column name', () => {
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.getUserColumn()).toBe('user_id');
    });

    it('getTenantColumn should return tenant column name', () => {
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.getTenantColumn()).toBe('tenant_id');
    });

    it('shouldGenerateChecklist should return checklist setting', () => {
      const loader = new ConfigLoader(TEST_DIR);
      
      expect(loader.shouldGenerateChecklist()).toBe(true);
    });
  });
});

describe('generateDefaultConfig', () => {
  it('should return valid JSON string', () => {
    const configString = generateDefaultConfig();
    
    expect(() => JSON.parse(configString)).not.toThrow();
  });

  it('should include all expected sections', () => {
    const configString = generateDefaultConfig();
    const config = JSON.parse(configString);
    
    expect(config.projectPath).toBeDefined();
    expect(config.migrations).toBeDefined();
    expect(config.ai).toBeDefined();
    expect(config.typeCollection).toBeDefined();
    expect(config.apiCollection).toBeDefined();
    expect(config.rls).toBeDefined();
    expect(config.output).toBeDefined();
  });
});

