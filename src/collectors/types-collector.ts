import { glob } from 'glob';
import { readFileSync } from 'fs';

export interface TypeDefinition {
  name: string;
  filePath: string;
  properties: PropertyDefinition[];
  supabaseTable?: string;
  kind: 'interface' | 'type' | 'zod' | 'supabase-generated';
}

export interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
}

export interface TypeCollectorConfig {
  include?: string[];
  exclude?: string[];
  supabaseTypePatterns?: string[];
}

export class TypesCollector {
  private sourceDir: string;
  private config: TypeCollectorConfig;

  constructor(sourceDir: string = 'src', config: TypeCollectorConfig = {}) {
    this.sourceDir = sourceDir;
    this.config = {
      include: config.include || ['**/*.ts', '**/*.tsx'],
      exclude: config.exclude || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      supabaseTypePatterns: config.supabaseTypePatterns || [
        'Database',
        'Tables',
        'database.types',
      ],
    };
  }

  async collectTypes(): Promise<TypeDefinition[]> {
    const types: TypeDefinition[] = [];
    
    // Find TypeScript files
    const patterns = this.config.include!.map(p => 
      p.startsWith('**/') ? `${this.sourceDir}/${p}` : `${this.sourceDir}/**/${p}`
    );
    
    const tsFiles = await glob(patterns, {
      ignore: this.config.exclude,
    });

    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Extract Supabase generated types
      const supabaseTypes = this.extractSupabaseTypes(content, file);
      types.push(...supabaseTypes);
      
      // Extract interface definitions
      const interfaces = this.extractInterfaces(content, file);
      types.push(...interfaces);
      
      // Extract type aliases
      const typeAliases = this.extractTypeAliases(content, file);
      types.push(...typeAliases);
      
      // Extract Zod schemas
      const zodSchemas = this.extractZodSchemas(content, file);
      types.push(...zodSchemas);
    }

    // Infer table mappings
    return this.inferTableMappings(types);
  }

  private extractSupabaseTypes(content: string, filePath: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];
    
    // Match Supabase Database type pattern
    // type Database = { public: { Tables: { table_name: { Row: {...} } } } }
    const databaseTypeRegex = /type\s+Database\s*=\s*\{[\s\S]*?public\s*:\s*\{[\s\S]*?Tables\s*:\s*\{([\s\S]*?)\}\s*\}/g;
    let match = databaseTypeRegex.exec(content);
    
    if (match) {
      const tablesContent = match[1];
      
      // Extract individual table types
      const tableRegex = /(\w+)\s*:\s*\{[\s\S]*?Row\s*:\s*\{([^}]+)\}/g;
      let tableMatch;
      
      while ((tableMatch = tableRegex.exec(tablesContent)) !== null) {
        const tableName = tableMatch[1];
        const rowContent = tableMatch[2];
        const properties = this.parseProperties(rowContent);
        
        types.push({
          name: `${tableName}Row`,
          filePath,
          properties,
          supabaseTable: tableName,
          kind: 'supabase-generated',
        });
      }
    }

    return types;
  }

  private extractInterfaces(content: string, filePath: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];
    
    // Match interface definitions
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[^{]+)?\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];
      const properties = this.parseProperties(body);

      // Skip empty interfaces or React component props
      if (properties.length === 0 || name.endsWith('Props') || name.endsWith('State')) {
        continue;
      }

      types.push({
        name,
        filePath,
        properties,
        kind: 'interface',
      });
    }

    return types;
  }

  private extractTypeAliases(content: string, filePath: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];
    
    // Match type alias definitions with object structure
    const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
    let match;

    while ((match = typeRegex.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];
      
      // Skip Database type (handled separately)
      if (name === 'Database') continue;
      
      const properties = this.parseProperties(body);

      if (properties.length === 0) continue;

      types.push({
        name,
        filePath,
        properties,
        kind: 'type',
      });
    }

    return types;
  }

  private extractZodSchemas(content: string, filePath: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];
    
    // Check if file imports zod
    if (!content.match(/import.*from\s+['"]zod['"]/)) {
      return types;
    }

    // Match zod schema definitions
    // const userSchema = z.object({ id: z.string(), ... })
    const zodRegex = /(?:export\s+)?const\s+(\w+(?:Schema)?)\s*=\s*z\.object\(\s*\{([^}]+)\}\s*\)/g;
    let match;

    while ((match = zodRegex.exec(content)) !== null) {
      const name = match[1];
      const body = match[2];
      const properties = this.parseZodProperties(body);

      if (properties.length === 0) continue;

      types.push({
        name,
        filePath,
        properties,
        kind: 'zod',
      });
    }

    return types;
  }

  private parseProperties(body: string): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const lines = body.split(/[;\n]/).map(l => l.trim()).filter(l => l);

    for (const line of lines) {
      // Skip comments
      if (line.startsWith('//') || line.startsWith('/*')) continue;

      // Match property pattern: name?: type or name: type
      const propMatch = line.match(/^(\w+)(\?)?:\s*(.+?)(?:;?\s*(?:\/\/.*)?)?$/);
      if (propMatch) {
        properties.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          optional: propMatch[2] === '?',
        });
      }
    }

    return properties;
  }

  private parseZodProperties(body: string): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    const propRegex = /(\w+)\s*:\s*z\.(\w+)\(/g;
    let match;

    while ((match = propRegex.exec(body)) !== null) {
      const zodTypeMap: Record<string, string> = {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        date: 'Date',
        uuid: 'string',
        email: 'string',
        url: 'string',
        array: 'array',
        object: 'object',
      };

      properties.push({
        name: match[1],
        type: zodTypeMap[match[2]] || 'unknown',
        optional: body.includes(`${match[1]}:`) && body.includes('.optional()'),
      });
    }

    return properties;
  }

  private inferTableMappings(types: TypeDefinition[]): TypeDefinition[] {
    // Common patterns that indicate database table mapping
    const dbColumnPatterns = ['id', 'created_at', 'updated_at', 'user_id', 'tenant_id'];
    
    for (const type of types) {
      if (type.supabaseTable) continue; // Already mapped

      const propNames = type.properties.map(p => p.name.toLowerCase());
      
      // Check if type has common database column patterns
      const matchCount = dbColumnPatterns.filter(pattern => 
        propNames.some(name => name === pattern || name.includes(pattern))
      ).length;

      // If 3+ common patterns match, likely a database type
      if (matchCount >= 2) {
        // Infer table name from type name
        const tableName = this.typeNameToTableName(type.name);
        if (tableName) {
          type.supabaseTable = tableName;
        }
      }
    }

    return types;
  }

  private typeNameToTableName(typeName: string): string | undefined {
    // Remove common suffixes
    let name = typeName
      .replace(/Schema$/i, '')
      .replace(/Row$/i, '')
      .replace(/Type$/i, '')
      .replace(/Model$/i, '')
      .replace(/Entity$/i, '');

    // Convert PascalCase to snake_case
    name = name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

    // Pluralize simple cases
    if (!name.endsWith('s') && !name.endsWith('data')) {
      name = name + 's';
    }

    return name || undefined;
  }
}

