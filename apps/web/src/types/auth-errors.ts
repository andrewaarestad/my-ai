/**
 * Authentication error types and utilities
 *
 * Defines all possible NextAuth error codes and provides
 * user-friendly messages and troubleshooting steps for each.
 */

/**
 * NextAuth error codes
 * See: https://next-auth.js.org/configuration/pages#error-codes
 */
export type AuthErrorCode =
  | 'Configuration'
  | 'AccessDenied'
  | 'Verification'
  | 'OAuthSignin'
  | 'OAuthCallback'
  | 'OAuthCreateAccount'
  | 'EmailCreateAccount'
  | 'Callback'
  | 'OAuthAccountNotLinked'
  | 'EmailSignin'
  | 'CredentialsSignin'
  | 'SessionRequired'
  | 'Default'

export interface AuthErrorInfo {
  code: AuthErrorCode
  title: string
  userMessage: string
  technicalMessage: string
  troubleshootingSteps: string[]
  possibleCauses: string[]
}

/**
 * Map error codes to detailed error information
 */
export const AUTH_ERROR_MAP: Record<AuthErrorCode, AuthErrorInfo> = {
  Configuration: {
    code: 'Configuration',
    title: 'Configuration Error',
    userMessage: 'There is a problem with the server configuration. Please try again later.',
    technicalMessage: 'OAuth provider is not configured correctly',
    possibleCauses: [
      'Missing or invalid GOOGLE_CLIENT_ID',
      'Missing or invalid GOOGLE_CLIENT_SECRET',
      'Missing or invalid NEXTAUTH_SECRET',
      'OAuth redirect URI mismatch in Google Cloud Console',
      'Database connection failure',
    ],
    troubleshootingSteps: [
      'Check that GOOGLE_CLIENT_ID is set in environment variables',
      'Check that GOOGLE_CLIENT_SECRET is set in environment variables',
      'Verify NEXTAUTH_SECRET is set (generate with: openssl rand -base64 32)',
      'Ensure redirect URI in Google Cloud Console matches: {NEXTAUTH_URL}/api/auth/callback/google',
      'Verify database connection (DATABASE_URL and DIRECT_URL)',
      'Check server logs for detailed error messages',
    ],
  },

  AccessDenied: {
    code: 'AccessDenied',
    title: 'Access Denied',
    userMessage:
      'You do not have permission to sign in. Please contact support if you believe this is an error.',
    technicalMessage: 'User denied consent or does not meet access requirements',
    possibleCauses: [
      'User clicked "Cancel" on Google consent screen',
      'User denied required permissions',
      'Account does not meet access criteria',
      'Custom authorization callback denied access',
    ],
    troubleshootingSteps: [
      'Try signing in again and accept all requested permissions',
      'Ensure you are using an authorized email address',
      'Check if there are any account restrictions in place',
      'Contact administrator if you should have access',
    ],
  },

  Verification: {
    code: 'Verification',
    title: 'Verification Failed',
    userMessage: 'We could not verify your identity. Please try signing in again.',
    technicalMessage: 'Token verification failed',
    possibleCauses: [
      'Expired verification token',
      'Invalid or tampered token',
      'Clock skew between client and server',
      'Token has already been used',
    ],
    troubleshootingSteps: [
      'Clear your browser cache and cookies',
      'Try signing in again',
      'Ensure your system clock is set correctly',
      'Try using a different browser',
    ],
  },

  OAuthSignin: {
    code: 'OAuthSignin',
    title: 'Sign In Error',
    userMessage: 'Could not sign in with Google. Please try again.',
    technicalMessage: 'Error during OAuth sign-in process',
    possibleCauses: [
      'Network connectivity issues',
      'Google OAuth service temporarily unavailable',
      'Invalid OAuth configuration',
      'Firewall blocking OAuth requests',
    ],
    troubleshootingSteps: [
      'Check your internet connection',
      'Try again in a few moments',
      'Disable any VPN or proxy temporarily',
      'Check if you can access accounts.google.com',
      'Try using a different network',
    ],
  },

  OAuthCallback: {
    code: 'OAuthCallback',
    title: 'Authentication Error',
    userMessage: 'There was a problem completing sign in. Please try again.',
    technicalMessage: 'Error during OAuth callback',
    possibleCauses: [
      'Invalid state parameter',
      'CSRF token mismatch',
      'Callback URL mismatch',
      'Session cookie not set',
      'Network interruption during callback',
    ],
    troubleshootingSteps: [
      'Clear browser cookies for this site',
      'Ensure cookies are enabled in your browser',
      'Try signing in again',
      'Check that NEXTAUTH_URL matches your current domain',
      'Verify OAuth redirect URI in Google Cloud Console',
    ],
  },

  OAuthCreateAccount: {
    code: 'OAuthCreateAccount',
    title: 'Account Creation Error',
    userMessage: 'We could not create your account. Please try again.',
    technicalMessage: 'Failed to create user account in database',
    possibleCauses: [
      'Database connection error',
      'User already exists with different provider',
      'Database constraint violation',
      'Insufficient database permissions',
    ],
    troubleshootingSteps: [
      'Check database connection status',
      'Verify DATABASE_URL and DIRECT_URL are correct',
      'Check if account already exists',
      'Review database error logs',
      'Ensure database schema is up to date',
    ],
  },

  EmailCreateAccount: {
    code: 'EmailCreateAccount',
    title: 'Account Creation Error',
    userMessage: 'We could not create your account. Please try again.',
    technicalMessage: 'Failed to create account via email',
    possibleCauses: ['Database error', 'Email already registered', 'Invalid email format'],
    troubleshootingSteps: [
      'Check if email is already registered',
      'Try using a different email address',
      'Contact support for assistance',
    ],
  },

  Callback: {
    code: 'Callback',
    title: 'Authentication Error',
    userMessage: 'Something went wrong during sign in. Please try again.',
    technicalMessage: 'General callback error',
    possibleCauses: [
      'Session handling error',
      'Database connection issue',
      'Network timeout',
      'Invalid callback parameters',
    ],
    troubleshootingSteps: [
      'Try signing in again',
      'Clear browser cache and cookies',
      'Check server status',
      'Review server error logs',
    ],
  },

  OAuthAccountNotLinked: {
    code: 'OAuthAccountNotLinked',
    title: 'Account Not Linked',
    userMessage:
      'This email is already registered with a different sign-in method. Please use your original sign-in method.',
    technicalMessage: 'Email is already associated with another provider',
    possibleCauses: [
      'Account exists with different OAuth provider',
      'Account exists with email/password',
      'Account linking is disabled',
    ],
    troubleshootingSteps: [
      'Try signing in with your original method',
      'Use the "Sign in with Email" option if available',
      'Contact support to link accounts',
    ],
  },

  EmailSignin: {
    code: 'EmailSignin',
    title: 'Email Sign In Error',
    userMessage: 'Could not send sign-in email. Please try again.',
    technicalMessage: 'Failed to send email verification link',
    possibleCauses: [
      'Email service configuration error',
      'Invalid email address',
      'Email service rate limit exceeded',
    ],
    troubleshootingSteps: [
      'Check email address is correct',
      'Wait a few minutes and try again',
      'Check spam folder',
      'Try using OAuth instead',
    ],
  },

  CredentialsSignin: {
    code: 'CredentialsSignin',
    title: 'Sign In Failed',
    userMessage: 'Invalid email or password. Please try again.',
    technicalMessage: 'Credentials authentication failed',
    possibleCauses: [
      'Incorrect username or password',
      'Account does not exist',
      'Account is locked or disabled',
    ],
    troubleshootingSteps: [
      'Double-check your email and password',
      'Try using "Forgot Password" if available',
      'Ensure Caps Lock is not enabled',
      'Contact support if locked out',
    ],
  },

  SessionRequired: {
    code: 'SessionRequired',
    title: 'Session Required',
    userMessage: 'You must be signed in to access this page.',
    technicalMessage: 'Protected route accessed without valid session',
    possibleCauses: ['Session expired', 'User logged out', 'Never logged in'],
    troubleshootingSteps: [
      'Sign in to continue',
      'Check if cookies are enabled',
      'Clear browser cache if issues persist',
    ],
  },

  Default: {
    code: 'Default',
    title: 'Authentication Error',
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: 'Unknown authentication error',
    possibleCauses: [
      'Unexpected server error',
      'Network connectivity issue',
      'Browser compatibility issue',
    ],
    troubleshootingSteps: [
      'Try again in a few moments',
      'Clear browser cache and cookies',
      'Try using a different browser',
      'Check your internet connection',
      'Contact support if problem persists',
    ],
  },
}

/**
 * Get error information from error code
 */
export function getAuthErrorInfo(code: string | null | undefined): AuthErrorInfo {
  if (!code) {
    return AUTH_ERROR_MAP.Default
  }

  const errorCode = code as AuthErrorCode
  return AUTH_ERROR_MAP[errorCode] || AUTH_ERROR_MAP.Default
}

/**
 * Parse error from URL search params
 */
export function parseAuthError(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): AuthErrorInfo | null {
  let errorCode: string | null = null

  if (searchParams instanceof URLSearchParams) {
    errorCode = searchParams.get('error')
  } else if (typeof searchParams === 'object') {
    const error = searchParams.error
    errorCode = Array.isArray(error) ? (error[0] ?? null) : (error ?? null)
  }

  if (!errorCode) {
    return null
  }

  return getAuthErrorInfo(errorCode)
}
