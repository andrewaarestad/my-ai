/**
 * Gmail Sync CLI
 *
 * Usage:
 *   npm run sync:gmail                    Incremental sync
 *   npm run sync:gmail -- --full          Full sync (last 30 days)
 *   npm run sync:gmail -- --limit=500     Sync up to N messages
 *   npm run sync:gmail -- --query="from:foo@bar.com"  Filter messages
 */

import { createGmailClient, createGmailSyncService } from '@my-ai/sync/gmail'
import { getGoogleAuthClient } from '@my-ai/core/auth'
import { prisma } from '@my-ai/core/db'
import { env } from './environment.js'

const googleConfig = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
}

interface CliOptions {
  full: boolean
  limit: number
  query?: string
  verbose: boolean
  format: 'text' | 'json'
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    full: false,
    limit: 100,
    verbose: false,
    format: 'text',
  }

  for (const arg of args) {
    if (arg === '--full') {
      options.full = true
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--format=json') {
      options.format = 'json'
    } else if (arg.startsWith('--limit=')) {
      const parsed = parseInt(arg.split('=')[1] ?? '100', 10)
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Error: --limit must be a positive number, got "${arg.split('=')[1]}"`)
        process.exit(1)
      }
      options.limit = parsed
    } else if (arg.startsWith('--query=')) {
      options.query = arg.split('=').slice(1).join('=')
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Gmail Sync CLI

Usage:
  npm run sync:gmail                         Incremental sync
  npm run sync:gmail -- --full               Full sync (last 30 days)
  npm run sync:gmail -- --limit=500          Sync up to N messages
  npm run sync:gmail -- --query="from:x"     Filter with Gmail query

Options:
  --full           Do a full sync instead of incremental
  --limit=N        Maximum messages to sync (default: 100)
  --query=QUERY    Gmail search query
  --verbose, -v    Show detailed progress
  --format=json    Output as JSON
  --help, -h       Show this help message
`)
      process.exit(0)
    }
  }

  return options
}

async function main() {
  const options = parseArgs()

  // Check authentication
  const authClient = await getGoogleAuthClient(googleConfig)
  if (!authClient) {
    console.error('Not authenticated with Google.')
    console.error('Run: npm run auth:google')
    process.exit(1)
  }

  // Get user email from Gmail profile
  const gmailClient = createGmailClient(googleConfig)
  const profile = await gmailClient.getProfile()

  if (options.verbose) {
    console.error(`Syncing Gmail for: ${profile.emailAddress}`)
    console.error(`Total messages in account: ${profile.messagesTotal}`)
  }

  // For CLI use, we use a single-user model with a fixed userId
  // In a real multi-user setup, this would come from auth
  const userId = 'cli-user'
  const accountEmail = profile.emailAddress

  const syncService = createGmailSyncService(userId, accountEmail, gmailClient)

  let result
  if (options.full) {
    if (options.verbose) {
      console.error('Performing full sync...')
    }
    result = await syncService.syncMessages({
      maxMessages: options.limit,
      query: options.query,
      isInitialSync: true,
      verbose: options.verbose,
    })
  } else {
    if (options.verbose) {
      console.error('Performing incremental sync...')
    }
    result = await syncService.incrementalSync({
      verbose: options.verbose,
      maxMessages: options.limit,
    })
  }

  // Output result
  if (options.format === 'json') {
    console.log(JSON.stringify(result))
  } else {
    console.log(`✓ Synced ${result.synced} messages`)
    if (result.errors > 0) {
      console.log(`⚠ ${result.errors} errors`)
    }
  }

  // Disconnect Prisma
  await prisma.$disconnect()
}

main().catch(async (error: unknown) => {
  console.error('Sync failed:', error instanceof Error ? error.message : error)
  await prisma.$disconnect()
  process.exit(1)
})
