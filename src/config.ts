import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface AIConfig {
  provider: 'claude' | 'openai';
  model?: string;
  apiKey?: string;
}

export interface MigrationsConfig {
  directory: string;
  timestampFormat?: string;
}

export interface TypeCollectionConfig {
  include: string[];
  exclude: string[];
}

export interface APICollectionConfig {
  include: string[];
  supabaseImports: string[];
}

export interface RLSConfig {
  defaultPatterns: {
    userColumn: string;
    tenantColumn: string;
  };
}

export interface AppConfig {
  projectPath: string;
  migrations: MigrationsConfig;
  ai: AIConfig;
  typeCollection: TypeCollectionConfig;
  apiCollection: APICollectionConfig;
  rls: RLSConfig;
  output: {
    directory: string;
    generateChecklist: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  projectPath: '.',
  migrations: {
    directory: 'supabase/migrations',
    timestampFormat: 'YYYYMMDDHHmmss',
  },
  ai: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
  },
  typeCollection: {
    include: ['src/**/*.ts', 'src/**/*.tsx', 'types/**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  },
  apiCollection: {
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    supabaseImports: ['@supabase/supabase-js', '~/lib/supabase', '@/lib/supabase'],
  },
  rls: {
    defaultPatterns: {
      userColumn: 'user_id',
      tenantColumn: 'tenant_id',
    },
  },
  output: {
    directory: 'supabase/migrations',
    generateChecklist: true,
  },
};

const CONFIG_FILE_NAMES = [
  '.ai-sql-dev.json',
  'ai-sql-dev.config.json',
  '.ai-sql-devrc',
  '.ai-sql-devrc.json',
];

export class ConfigLoader {
  private config: AppConfig;
  private configPath?: string;

  constructor(projectPath: string = '.') {
    this.config = { ...DEFAULT_CONFIG, projectPath };
    this.loadConfig(projectPath);
  }

  private loadConfig(projectPath: string): void {
    // Try to find config file
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = join(projectPath, fileName);
      if (existsSync(configPath)) {
        this.configPath = configPath;
        try {
          const content = readFileSync(configPath, 'utf-8');
          const userConfig = JSON.parse(content);
          this.config = this.mergeConfig(this.config, userConfig);
        } catch (error) {
          console.warn(`Warning: Failed to parse config file ${configPath}`);
        }
        break;
      }
    }

    // Also check for environment variables
    this.loadEnvOverrides();
  }

  private loadEnvOverrides(): void {
    // AI provider from env
    if (process.env.AI_PROVIDER) {
      const provider = process.env.AI_PROVIDER.toLowerCase();
      if (provider === 'claude' || provider === 'openai') {
        this.config.ai.provider = provider;
      }
    }

    // AI model from env
    if (process.env.AI_MODEL) {
      this.config.ai.model = process.env.AI_MODEL;
    }

    // API keys from env
    if (process.env.ANTHROPIC_API_KEY && this.config.ai.provider === 'claude') {
      this.config.ai.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.OPENAI_API_KEY && this.config.ai.provider === 'openai') {
      this.config.ai.apiKey = process.env.OPENAI_API_KEY;
    }
  }

  private mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    return {
      projectPath: override.projectPath ?? base.projectPath,
      migrations: {
        ...base.migrations,
        ...(override.migrations || {}),
      },
      ai: {
        ...base.ai,
        ...(override.ai || {}),
      },
      typeCollection: {
        ...base.typeCollection,
        ...(override.typeCollection || {}),
      },
      apiCollection: {
        ...base.apiCollection,
        ...(override.apiCollection || {}),
      },
      rls: {
        defaultPatterns: {
          ...base.rls.defaultPatterns,
          ...(override.rls?.defaultPatterns || {}),
        },
      },
      output: {
        ...base.output,
        ...(override.output || {}),
      },
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getConfigPath(): string | undefined {
    return this.configPath;
  }

  hasConfigFile(): boolean {
    return this.configPath !== undefined;
  }

  // Convenience getters
  getMigrationsPath(): string {
    return this.config.migrations.directory;
  }

  getSourcePath(): string {
    return this.config.apiCollection.include[0]?.replace('/**/*.ts', '') || 'src';
  }

  getOutputPath(): string {
    return this.config.output.directory;
  }

  getAIProvider(): 'claude' | 'openai' {
    return this.config.ai.provider;
  }

  getAIModel(): string {
    return this.config.ai.model || (this.config.ai.provider === 'claude' 
      ? 'claude-3-5-sonnet-20241022' 
      : 'gpt-4o');
  }

  getAPIKey(): string | undefined {
    return this.config.ai.apiKey;
  }

  shouldGenerateChecklist(): boolean {
    return this.config.output.generateChecklist;
  }

  getUserColumn(): string {
    return this.config.rls.defaultPatterns.userColumn;
  }

  getTenantColumn(): string {
    return this.config.rls.defaultPatterns.tenantColumn;
  }
}

// Export a function to create default config file
export function generateDefaultConfig(): string {
  const config = {
    projectPath: '.',
    migrations: {
      directory: 'supabase/migrations',
      timestampFormat: 'YYYYMMDDHHmmss',
    },
    ai: {
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
    },
    typeCollection: {
      include: ['src/**/*.ts', 'src/**/*.tsx', 'types/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
    },
    apiCollection: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      supabaseImports: ['@supabase/supabase-js', '~/lib/supabase', '@/lib/supabase'],
    },
    rls: {
      defaultPatterns: {
        userColumn: 'user_id',
        tenantColumn: 'tenant_id',
      },
    },
    output: {
      directory: 'supabase/migrations',
      generateChecklist: true,
    },
  };

  return JSON.stringify(config, null, 2);
}

