import { UserScopedService } from './base-service';
import { prisma } from '@/lib/prisma';

/**
 * Account Service - User-scoped access to OAuth accounts
 *
 * Provides secure access to user's OAuth accounts and tokens.
 * All queries are automatically filtered by userId.
 *
 * Security features:
 * - Never exposes tokens in API responses (by default)
 * - Enforces user can only access their own accounts
 * - Provides controlled access to tokens for internal services only
 */
export class AccountService extends UserScopedService {
  /**
   * Get user's OAuth accounts (without sensitive tokens)
   * Safe to use in API responses
   */
  async getAccounts() {
    return prisma.account.findMany({
      where: this.enforceUserScope({}),
      select: {
        provider: true,
        providerAccountId: true,
        scope: true,
        expires_at: true,
        token_type: true,
        // Never expose tokens in API responses
        access_token: false,
        refresh_token: false,
        id_token: false,
        session_state: false,
      },
    });
  }

  /**
   * Get specific account by provider (without tokens)
   * Safe to use in API responses
   */
  async getAccount(provider: string) {
    return prisma.account.findFirst({
      where: this.enforceUserScope({ provider }),
      select: {
        provider: true,
        providerAccountId: true,
        scope: true,
        expires_at: true,
        token_type: true,
        // Never expose tokens
        access_token: false,
        refresh_token: false,
        id_token: false,
      },
    });
  }

  /**
   * Get account with tokens (for internal use only)
   * Should ONLY be called by token-refresh service or similar trusted code
   * NEVER expose this data in API responses
   *
   * @internal
   */
  async getAccountWithTokens(provider: string) {
    return prisma.account.findFirst({
      where: this.enforceUserScope({ provider }),
      // Returns all fields including tokens (they will be decrypted by middleware)
    });
  }

  /**
   * Check if user has connected a specific provider
   */
  async hasProvider(provider: string): Promise<boolean> {
    const count = await prisma.account.count({
      where: this.enforceUserScope({ provider }),
    });
    return count > 0;
  }

  /**
   * Get user's connected providers
   */
  async getConnectedProviders(): Promise<string[]> {
    const accounts = await prisma.account.findMany({
      where: this.enforceUserScope({}),
      select: { provider: true },
      distinct: ['provider'],
    });
    return accounts.map((a) => a.provider);
  }

  /**
   * Check if account tokens are expired
   */
  async isTokenExpired(provider: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: this.enforceUserScope({ provider }),
      select: { expires_at: true },
    });

    if (!account || !account.expires_at) {
      return true;
    }

    // Add 60 second buffer
    const now = Math.floor(Date.now() / 1000);
    return now >= account.expires_at - 60;
  }

  /**
   * Get connected accounts (multi-account support)
   */
  async getConnectedAccounts() {
    return prisma.connectedAccount.findMany({
      where: this.enforceUserScope({}),
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        displayName: true,
        email: true,
        isPrimary: true,
        expires_at: true,
        // Never expose tokens
        access_token: false,
        refresh_token: false,
      },
    });
  }

  /**
   * Get connected account with tokens (internal use only)
   *
   * @internal
   */
  async getConnectedAccountWithTokens(accountId: string) {
    return prisma.connectedAccount.findFirst({
      where: this.enforceUserScope({ id: accountId }),
    });
  }
}

/**
 * Factory function to create user-scoped Account service
 *
 * @param userId - User ID to scope service to
 * @returns AccountService instance
 */
export function createAccountService(userId: string): AccountService {
  return new AccountService(userId);
}
