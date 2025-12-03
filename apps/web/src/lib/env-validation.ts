/**
 * Environment variable validation
 *
 * Validates that all required environment variables are present
 * and provides helpful error messages if they're missing.
 */

import { isDevelopment } from './env';

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  exampleValue?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true,
    description: 'Google OAuth Client ID from Google Cloud Console',
    exampleValue: 'your-client-id.apps.googleusercontent.com',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true,
    description: 'Google OAuth Client Secret from Google Cloud Console',
    exampleValue: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxx',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js session encryption',
    exampleValue: 'Generate with: openssl rand -base64 32',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Base URL of your application',
    exampleValue: 'http://localhost:3000 (dev) or https://yourdomain.com (prod)',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string (pooled connection)',
    exampleValue: 'postgresql://user:password@host:5432/database',
  },
  {
    name: 'DIRECT_URL',
    required: true,
    description: 'Direct PostgreSQL connection for migrations',
    exampleValue: 'postgresql://user:password@host:5432/database',
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    description: 'AES-256 encryption key for OAuth tokens (32 bytes, base64-encoded)',
    exampleValue: 'Generate with: openssl rand -base64 32',
  },
  {
    name: 'CRON_SECRET',
    required: true,
    description: 'Secret key for authenticating cron job requests (minimum 32 characters)',
    exampleValue: 'Generate with: openssl rand -base64 32',
  },
];

class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public missingVars: string[],
    public suggestions: string[]
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validate all required environment variables are present
 *
 * @throws {EnvironmentValidationError} If required variables are missing
 */
export function validateEnvironmentVariables(): void {
  const missingVars: EnvVarConfig[] = [];
  const warnings: string[] = [];

  // Check each required variable
  for (const varConfig of ENV_VARS) {
    const value = process.env[varConfig.name];

    if (!value && varConfig.required) {
      missingVars.push(varConfig);
    } else if (!value && !varConfig.required && isDevelopment()) {
      warnings.push(`Optional variable ${varConfig.name} is not set`);
    }
  }

  // Log warnings in development
  if (warnings.length > 0 && isDevelopment()) {
    console.warn('⚠️  Environment Variable Warnings:');
    warnings.forEach((warning) => console.warn(`   ${warning}`));
  }

  // Throw error if required variables are missing
  if (missingVars.length > 0) {
    const varNames = missingVars.map((v) => v.name);
    const suggestions = missingVars.map((v) => {
      let suggestion = `\n  ${v.name}:`;
      suggestion += `\n    Description: ${v.description}`;
      if (v.exampleValue) {
        suggestion += `\n    Example: ${v.exampleValue}`;
      }
      return suggestion;
    });

    const errorMessage = `
❌ Missing required environment variables:
${varNames.map((name) => `   - ${name}`).join('\n')}

Please add these variables to your .env file or deployment environment.
${suggestions.join('\n')}

See .env.example for a complete template.
`;

    throw new EnvironmentValidationError(
      errorMessage,
      varNames,
      suggestions
    );
  }
}

/**
 * Get the status of all environment variables
 * Useful for debugging and health checks
 */
export function getEnvironmentStatus(): {
  valid: boolean;
  missing: string[];
  present: string[];
} {
  const missing: string[] = [];
  const present: string[] = [];

  for (const varConfig of ENV_VARS) {
    if (varConfig.required) {
      const value = process.env[varConfig.name];
      if (value) {
        present.push(varConfig.name);
      } else {
        missing.push(varConfig.name);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Check if a specific environment variable is set
 */
export function hasEnvVar(name: string): boolean {
  return !!process.env[name];
}

/**
 * Get environment variable configuration details
 */
export function getEnvVarConfig(name: string): EnvVarConfig | undefined {
  return ENV_VARS.find((v) => v.name === name);
}
