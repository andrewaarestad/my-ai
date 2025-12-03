#!/usr/bin/env ts-node
/**
 * Migration Script: Encrypt Existing OAuth Tokens
 *
 * This script encrypts all existing plain-text OAuth tokens in the database.
 * Run this ONCE after deploying the token encryption feature.
 *
 * Usage:
 *   1. Set ENCRYPTION_KEY environment variable
 *   2. Run: pnpm tsx scripts/encrypt-existing-tokens.ts
 *   3. Verify tokens still work after encryption
 *
 * Safety:
 *   - Reads all accounts/connected accounts
 *   - Checks if already encrypted (skips if so)
 *   - Encrypts tokens
 *   - Updates database
 *   - Verifies decryption works
 */

import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, isEncrypted } from '../apps/web/src/lib/encryption';

// Create Prisma client WITHOUT encryption middleware for this migration
const prisma = new PrismaClient();

interface TokenStats {
  total: number;
  alreadyEncrypted: number;
  encrypted: number;
  errors: number;
}

async function encryptAccountTokens(): Promise<TokenStats> {
  const stats: TokenStats = {
    total: 0,
    alreadyEncrypted: 0,
    encrypted: 0,
    errors: 0,
  };

  console.log('🔍 Finding accounts with OAuth tokens...\n');

  // Get all accounts (directly, bypassing middleware)
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { access_token: { not: null } },
        { refresh_token: { not: null } },
        { id_token: { not: null } },
      ],
    },
  });

  stats.total = accounts.length;
  console.log(`Found ${stats.total} accounts with tokens\n`);

  for (const account of accounts) {
    console.log(`Processing account: ${account.provider}:${account.providerAccountId}`);

    try {
      let updated = false;
      const updateData: {
        access_token?: string | null;
        refresh_token?: string | null;
        id_token?: string | null;
      } = {};

      // Check and encrypt access_token
      if (account.access_token) {
        if (isEncrypted(account.access_token)) {
          console.log('  ✓ access_token already encrypted');
          stats.alreadyEncrypted++;
        } else {
          console.log('  🔒 Encrypting access_token...');
          updateData.access_token = await encrypt(account.access_token);
          updated = true;
        }
      }

      // Check and encrypt refresh_token
      if (account.refresh_token) {
        if (isEncrypted(account.refresh_token)) {
          console.log('  ✓ refresh_token already encrypted');
          stats.alreadyEncrypted++;
        } else {
          console.log('  🔒 Encrypting refresh_token...');
          updateData.refresh_token = await encrypt(account.refresh_token);
          updated = true;
        }
      }

      // Check and encrypt id_token
      if (account.id_token) {
        if (isEncrypted(account.id_token)) {
          console.log('  ✓ id_token already encrypted');
          stats.alreadyEncrypted++;
        } else {
          console.log('  🔒 Encrypting id_token...');
          updateData.id_token = await encrypt(account.id_token);
          updated = true;
        }
      }

      // Update if any tokens were encrypted
      if (updated) {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: updateData,
        });

        // Verify decryption works
        console.log('  ✓ Verifying encryption...');
        if (updateData.access_token) {
          const decrypted = await decrypt(updateData.access_token);
          if (!decrypted) {
            throw new Error('Decryption verification failed for access_token');
          }
        }

        stats.encrypted++;
        console.log('  ✅ Successfully encrypted and verified\n');
      } else {
        console.log('  ⏭️  Skipped (already encrypted)\n');
      }
    } catch (error) {
      console.error('  ❌ Error:', error instanceof Error ? error.message : error);
      stats.errors++;
    }
  }

  return stats;
}

async function encryptConnectedAccountTokens(): Promise<TokenStats> {
  const stats: TokenStats = {
    total: 0,
    alreadyEncrypted: 0,
    encrypted: 0,
    errors: 0,
  };

  console.log('\n🔍 Finding connected accounts with OAuth tokens...\n');

  const connectedAccounts = await prisma.connectedAccount.findMany({
    where: {
      OR: [
        { access_token: { not: null } },
        { refresh_token: { not: null } },
      ],
    },
  });

  stats.total = connectedAccounts.length;
  console.log(`Found ${stats.total} connected accounts with tokens\n`);

  for (const account of connectedAccounts) {
    console.log(`Processing connected account: ${account.provider}:${account.email}`);

    try {
      let updated = false;
      const updateData: {
        access_token?: string | null;
        refresh_token?: string | null;
      } = {};

      if (account.access_token) {
        if (isEncrypted(account.access_token)) {
          console.log('  ✓ access_token already encrypted');
          stats.alreadyEncrypted++;
        } else {
          console.log('  🔒 Encrypting access_token...');
          updateData.access_token = await encrypt(account.access_token);
          updated = true;
        }
      }

      if (account.refresh_token) {
        if (isEncrypted(account.refresh_token)) {
          console.log('  ✓ refresh_token already encrypted');
          stats.alreadyEncrypted++;
        } else {
          console.log('  🔒 Encrypting refresh_token...');
          updateData.refresh_token = await encrypt(account.refresh_token);
          updated = true;
        }
      }

      if (updated) {
        await prisma.connectedAccount.update({
          where: { id: account.id },
          data: updateData,
        });

        console.log('  ✓ Verifying encryption...');
        if (updateData.access_token) {
          const decrypted = await decrypt(updateData.access_token);
          if (!decrypted) {
            throw new Error('Decryption verification failed');
          }
        }

        stats.encrypted++;
        console.log('  ✅ Successfully encrypted and verified\n');
      } else {
        console.log('  ⏭️  Skipped (already encrypted)\n');
      }
    } catch (error) {
      console.error('  ❌ Error:', error instanceof Error ? error.message : error);
      stats.errors++;
    }
  }

  return stats;
}

async function main() {
  console.log('🔐 OAuth Token Encryption Migration\n');
  console.log('====================================\n');

  // Check encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set');
    console.error('Generate one with: openssl rand -base64 32\n');
    process.exit(1);
  }

  try {
    // Encrypt Account tokens
    const accountStats = await encryptAccountTokens();

    // Encrypt ConnectedAccount tokens
    const connectedStats = await encryptConnectedAccountTokens();

    // Print summary
    console.log('\n📊 Migration Summary');
    console.log('===================\n');
    console.log('Accounts:');
    console.log(`  Total processed: ${accountStats.total}`);
    console.log(`  Already encrypted: ${accountStats.alreadyEncrypted}`);
    console.log(`  Newly encrypted: ${accountStats.encrypted}`);
    console.log(`  Errors: ${accountStats.errors}\n`);

    console.log('Connected Accounts:');
    console.log(`  Total processed: ${connectedStats.total}`);
    console.log(`  Already encrypted: ${connectedStats.alreadyEncrypted}`);
    console.log(`  Newly encrypted: ${connectedStats.encrypted}`);
    console.log(`  Errors: ${connectedStats.errors}\n`);

    if (accountStats.errors > 0 || connectedStats.errors > 0) {
      console.log('⚠️  Migration completed with errors. Please review the errors above.\n');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Verify application still works with encrypted tokens');
      console.log('2. Test OAuth login flow');
      console.log('3. Monitor logs for decryption errors\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
