import Anthropic from '@anthropic-ai/sdk';
import { MigrationContext, SupabaseUsagePattern } from '../types';

export class ClaudeService {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model: string = 'claude-3-5-sonnet-20241022') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model;
  }

  async generateRLSPolicies(context: MigrationContext): Promise<string> {
    const prompt = this.buildPrompt(context);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const response = message.content[0];
    if (response.type === 'text') {
      return response.text;
    }
    
    return '';
  }

  private buildPrompt(context: MigrationContext): string {
    const { schemas, rlsPolicies, usagePatterns } = context;

    let prompt = `You are a database security expert. Analyze the following Supabase database schema and TypeScript usage patterns to generate Row Level Security (RLS) policies.

## Current Database Schemas
`;

    for (const schema of schemas) {
      prompt += `\n### Table: ${schema.name}\n`;
      prompt += `Source: ${schema.sourceFile}\n`;
      prompt += `Columns:\n`;
      for (const col of schema.columns) {
        prompt += `  - ${col.name}: ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''}\n`;
      }
      if (schema.constraints.length > 0) {
        prompt += `Constraints:\n`;
        for (const constraint of schema.constraints) {
          prompt += `  - ${constraint}\n`;
        }
      }
    }

    prompt += `\n## Existing RLS Policies\n`;
    if (rlsPolicies.length === 0) {
      prompt += `No existing RLS policies found.\n`;
    } else {
      for (const policy of rlsPolicies) {
        prompt += `\n### Policy: ${policy.name}\n`;
        prompt += `Table: ${policy.table}\n`;
        prompt += `Operation: ${policy.operation}\n`;
        if (policy.using) prompt += `Using: ${policy.using}\n`;
        if (policy.withCheck) prompt += `With Check: ${policy.withCheck}\n`;
      }
    }

    prompt += `\n## TypeScript Usage Patterns\n`;
    const groupedByTable = this.groupPatternsByTable(usagePatterns);
    
    for (const [table, patterns] of Object.entries(groupedByTable)) {
      prompt += `\n### Table: ${table}\n`;
      for (const pattern of patterns) {
        prompt += `File: ${pattern.file}:${pattern.lineNumber}\n`;
        prompt += `Operation: ${pattern.operation}\n`;
        prompt += `Has user_id filter: ${pattern.hasUserIdFilter}\n`;
        prompt += `Has tenant_id filter: ${pattern.hasTenantIdFilter}\n`;
        if (pattern.authFilter) {
          prompt += `Auth filter: ${pattern.authFilter}\n`;
        }
        prompt += `Code:\n\`\`\`typescript\n${pattern.code}\n\`\`\`\n\n`;
      }
    }

    prompt += `\n## Task
Based on the usage patterns above, generate SQL migration file content that includes:
1. RLS policies for tables that show user_id or tenant_id filtering patterns
2. Enable RLS on tables if not already enabled
3. Create policies for SELECT, INSERT, UPDATE, DELETE operations as needed
4. Use auth.uid() for user_id matching
5. Consider both user-level and tenant-level isolation

Generate a complete SQL migration file with appropriate policies. Use standard Supabase/PostgreSQL RLS syntax.
Format the output as a valid SQL migration file.`;

    return prompt;
  }

  private groupPatternsByTable(patterns: SupabaseUsagePattern[]): Record<string, SupabaseUsagePattern[]> {
    const grouped: Record<string, SupabaseUsagePattern[]> = {};
    
    for (const pattern of patterns) {
      if (!grouped[pattern.table]) {
        grouped[pattern.table] = [];
      }
      grouped[pattern.table].push(pattern);
    }
    
    return grouped;
  }
}
