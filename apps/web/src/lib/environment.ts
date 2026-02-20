/**
 * Centralized environment variable access for the web app.
 *
 * This is the ONLY file that should read process.env.
 * All other code imports from here.
 *
 * Required vars throw on access if not set — the server will crash
 * immediately on the first request if an env var is missing.
 * Callers must not access env vars at module level (use lazy init
 * patterns) so that Next.js can import modules during build without
 * triggering validation.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  get GOOGLE_CLIENT_ID(): string {
    return required('GOOGLE_CLIENT_ID')
  },
  get GOOGLE_CLIENT_SECRET(): string {
    return required('GOOGLE_CLIENT_SECRET')
  },
  get NEXTAUTH_SECRET(): string {
    return required('NEXTAUTH_SECRET')
  },
  get NEXTAUTH_URL(): string {
    return required('NEXTAUTH_URL')
  },

  get NODE_ENV(): string {
    return optional('NODE_ENV') ?? 'development'
  },
  get VERCEL_ENV(): string | undefined {
    return optional('VERCEL_ENV')
  },

  get isDevelopment(): boolean {
    return !this.VERCEL_ENV && this.NODE_ENV === 'development'
  },
  get isProduction(): boolean {
    return this.VERCEL_ENV === 'production' || (!this.VERCEL_ENV && this.NODE_ENV === 'production')
  },
  get isPreview(): boolean {
    return this.VERCEL_ENV === 'preview'
  },
  get isSecure(): boolean {
    return this.NEXTAUTH_URL.startsWith('https://') || this.isProduction
  },
  get environment(): string {
    if (this.VERCEL_ENV === 'production') return 'production'
    if (this.VERCEL_ENV === 'preview') return 'preview'
    if (this.NODE_ENV === 'production') return 'production'
    return 'development'
  },
}

/**
 * Edge-safe env access — returns fallbacks instead of throwing.
 * Used by auth-middleware.ts which runs in Edge runtime where env
 * vars may not be available during the build step.
 */
export const edgeEnv = {
  get GOOGLE_CLIENT_ID(): string {
    return optional('GOOGLE_CLIENT_ID') ?? 'missing-client-id'
  },
  get GOOGLE_CLIENT_SECRET(): string {
    return optional('GOOGLE_CLIENT_SECRET') ?? 'missing-client-secret'
  },
  get NEXTAUTH_SECRET(): string {
    return optional('NEXTAUTH_SECRET') ?? 'missing-secret'
  },
}
