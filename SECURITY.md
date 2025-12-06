# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of AI-SQL-Dev seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:
- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please DO:
- Email your findings to the repository maintainer
- Provide sufficient information to reproduce the issue
- Allow reasonable time for the issue to be addressed before disclosure

### What to include in your report:
- Type of issue (e.g., path traversal, code injection, etc.)
- Full paths of source file(s) related to the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Security Best Practices for Users

### API Key Security

1. **Never commit API keys** to version control
2. **Use environment variables** for API keys:
   ```bash
   export ANTHROPIC_API_KEY=your-key-here
   ```
3. **Use `.env` files** (already in `.gitignore`):
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

### File Access

This tool reads and writes files on your filesystem:
- **Reads**: SQL migration files, TypeScript source files
- **Writes**: Generated migration files, checklist markdown files

Always review generated files before applying migrations to your database.

### Generated SQL Review

**Always review generated RLS policies before applying them!**

The AI-generated policies are suggestions based on code analysis. They should be:
1. Reviewed by a developer familiar with your security requirements
2. Tested in a development environment first
3. Validated against your actual authentication setup

### Dependencies

- We regularly update dependencies to patch security vulnerabilities
- Run `npm audit` to check for known vulnerabilities
- Run `npm audit fix` to automatically fix vulnerabilities when possible

## Security Features

### What This Tool Does NOT Do

- ❌ Store or transmit your API keys (beyond the AI provider)
- ❌ Send your code to any service other than the configured AI provider
- ❌ Execute generated SQL (you must apply migrations manually)
- ❌ Modify your existing database or migrations

### What This Tool DOES Do

- ✅ Read local files (migrations, TypeScript code)
- ✅ Send schema/code context to the AI provider for analysis
- ✅ Generate new migration files locally
- ✅ Generate checklist markdown files locally

## Acknowledgments

We appreciate responsible disclosure of security issues. Contributors who report valid security issues will be acknowledged (with permission) in our release notes.

