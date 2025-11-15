/**
 * Environment detection utilities
 *
 * Provides helpers to detect the current environment and determine
 * whether detailed error messages should be shown to users.
 */

export type Environment = 'production' | 'preview' | 'development';

/**
 * Get the current environment type
 *
 * Uses VERCEL_ENV for Vercel deployments, falls back to NODE_ENV
 * - production: Live production environment
 * - preview: Vercel preview deployments (PR previews, etc.)
 * - development: Local development
 */
export function getEnvironment(): Environment {
  // On Vercel, use VERCEL_ENV which distinguishes between production and preview
  if (process.env.VERCEL_ENV === 'production') {
    return 'production';
  }

  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview';
  }

  // Fall back to NODE_ENV for local development
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'development';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if running in preview environment (e.g., Vercel preview deployments)
 */
export function isPreview(): boolean {
  return getEnvironment() === 'preview';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Determine if detailed error messages should be shown
 *
 * Returns true for development and preview environments,
 * false for production (where generic errors should be shown)
 */
export function shouldShowDetailedErrors(): boolean {
  return !isProduction();
}

/**
 * Get environment name for display purposes
 */
export function getEnvironmentName(): string {
  const env = getEnvironment();
  return env.charAt(0).toUpperCase() + env.slice(1);
}
