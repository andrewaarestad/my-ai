import { AuthError } from '@/components/auth/AuthError'
import { parseAuthError } from '@/types/auth-errors'
import { logAuthError } from '@/lib/error-logger'

interface ErrorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Custom authentication error page
 *
 * NextAuth redirects to this page when authentication errors occur.
 * Displays environment-appropriate error messages.
 */
export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const error = parseAuthError(params)

  // Log the error for monitoring
  if (error) {
    await logAuthError(error.code, error.technicalMessage, {
      userMessage: error.userMessage,
      errorSource: 'nextauth_error_page',
    })
  }

  // If no error is found, show a generic error
  const displayError = error || {
    code: 'Default' as const,
    title: 'Authentication Error',
    userMessage: 'An unexpected error occurred during authentication.',
    technicalMessage: 'No error code provided in URL parameters',
    possibleCauses: [
      'Invalid error redirect',
      'Error code was not passed correctly',
      'Direct navigation to error page',
    ],
    troubleshootingSteps: [
      'Try signing in again',
      'Clear browser cookies',
      'Contact support if the problem persists',
    ],
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">My AI</h1>
        </div>

        <AuthError
          error={displayError}
          technicalDetails={
            params?.error
              ? `URL Error Parameter: ${Array.isArray(params.error) ? params.error[0] : params.error}`
              : undefined
          }
        />
      </div>
    </div>
  )
}

/**
 * Generate metadata for the error page
 */
export function generateMetadata() {
  return {
    title: 'Authentication Error - My AI',
    description: 'An error occurred during authentication',
  }
}
