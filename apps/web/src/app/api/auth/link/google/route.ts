import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { env } from '@/lib/environment'

/**
 * POST /api/auth/link/google
 *
 * Initiates a standalone OAuth flow to link an additional Google account
 * to the current user. This is separate from NextAuth's sign-in flow so
 * we have full control — no risk of creating unwanted User rows.
 *
 * NOTE: Requires adding {NEXTAUTH_URL}/api/auth/link/google/callback
 * as an authorized redirect URI in the Google Cloud Console.
 */
export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate PKCE code verifier + challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString('base64url')

  // Store link-mode data in a short-lived cookie
  const cookieStore = await cookies()
  const secure = env.isSecure
  cookieStore.set(
    'authjs.link-mode',
    JSON.stringify({ userId: session.user.id, state, codeVerifier }),
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    }
  )

  // Build Google OAuth authorization URL
  const baseUrl = env.NEXTAUTH_URL
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${baseUrl}/api/auth/link/google/callback`,
    response_type: 'code',
    scope: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    307
  )
}
