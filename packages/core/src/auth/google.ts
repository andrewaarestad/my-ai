import { OAuth2Client } from 'google-auth-library'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { URL } from 'url'
import { loadTokens, saveTokens } from './storage.js'

export interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
]

const REDIRECT_PORT = 3456
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`

function getOAuth2Client(config: GoogleAuthConfig): OAuth2Client {
  return new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: REDIRECT_URI,
  })
}

/**
 * Get an authenticated Google OAuth2 client.
 * Returns null if no tokens are stored.
 * Automatically refreshes tokens if expired.
 */
export async function getGoogleAuthClient(config: GoogleAuthConfig): Promise<OAuth2Client | null> {
  const tokens = await loadTokens()

  if (!tokens.google) {
    return null
  }

  const client = getOAuth2Client(config)
  client.setCredentials({
    access_token: tokens.google.access_token,
    refresh_token: tokens.google.refresh_token,
    expiry_date: tokens.google.expiry_date,
    token_type: tokens.google.token_type,
    scope: tokens.google.scope,
  })

  // Check if token needs refresh (5 min buffer)
  const expiryDate = tokens.google.expiry_date
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000

  if (expiryDate && now > expiryDate - bufferMs) {
    console.error('Access token expired, refreshing...')
    const { credentials } = await client.refreshAccessToken()
    client.setCredentials(credentials)

    // Save refreshed tokens
    await saveTokens({
      google: {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token ?? tokens.google.refresh_token,
        expiry_date: credentials.expiry_date!,
        token_type: credentials.token_type ?? 'Bearer',
        scope: credentials.scope ?? tokens.google.scope,
      },
    })
  }

  return client
}

/**
 * Run the interactive OAuth flow.
 * Opens browser, waits for callback, saves tokens.
 */
export async function runGoogleAuthFlow(config: GoogleAuthConfig): Promise<void> {
  const client = getOAuth2Client(config)

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  })

  console.log('\nOpening browser for Google sign-in...')
  console.log(`\nIf browser doesn't open, visit:\n${authUrl}\n`)

  // Dynamically import 'open' to open browser
  const open = (await import('open')).default
  await open(authUrl)

  // Start local server to receive callback
  const code = await waitForAuthCode()

  // Exchange code for tokens
  console.log('Exchanging code for tokens...')
  const { tokens } = await client.getToken(code)

  // Save tokens
  await saveTokens({
    google: {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!,
      token_type: tokens.token_type ?? 'Bearer',
      scope: tokens.scope ?? SCOPES.join(' '),
    },
  })

  console.log('\n✓ Authentication successful!')
  console.log('✓ Tokens saved to ~/.my-ai/tokens.json')
}

function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url!, `http://localhost:${REDIRECT_PORT}`)

      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(400)
        res.end(`Authentication failed: ${error}`)
        server.close()
        reject(new Error(`OAuth error: ${error}`))
        return
      }

      if (!code) {
        res.writeHead(400)
        res.end('No authorization code received')
        server.close()
        reject(new Error('No authorization code received'))
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✓ Authentication successful!</h1>
            <p>You can close this tab and return to the terminal.</p>
          </body>
        </html>
      `)

      server.close()
      resolve(code)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${REDIRECT_PORT} is already in use. Please close the other process and try again.`
          )
        )
      } else {
        reject(new Error(`Failed to start auth server: ${err.message}`))
      }
    })

    server.listen(REDIRECT_PORT, () => {
      console.log(`Waiting for authentication callback on port ${REDIRECT_PORT}...`)
    })

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close()
        reject(new Error('Authentication timed out after 5 minutes'))
      },
      5 * 60 * 1000
    )
  })
}
