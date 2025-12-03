import { UserScopedService } from './base-service';
import { prisma } from '@/lib/prisma';
import { createGmailClient } from '@/lib/gmail-client';
import { createGmailSyncService } from '@/lib/gmail-sync';
import type { Prisma } from '@prisma/client';

/**
 * Gmail Service - User-scoped access to Gmail data
 *
 * Provides secure access to Gmail messages, threads, and sync operations.
 * All queries are automatically filtered by userId.
 *
 * Security features:
 * - Enforces user can only access their own emails
 * - Validates account ownership before allowing accountEmail filtering
 * - Prevents cross-user data access via parameter manipulation
 */
export class GmailService extends UserScopedService {
  /**
   * Get messages for this user only
   * Authorization enforced at service layer
   */
  async getMessages(options: {
    accountEmail?: string;
    limit?: number;
    offset?: number;
    isRead?: boolean;
    isStarred?: boolean;
    threadId?: string;
  }) {
    const {
      accountEmail,
      limit = 50,
      offset = 0,
      isRead,
      isStarred,
      threadId,
    } = options;

    // Build where clause - ALWAYS includes userId
    const where: Prisma.GmailMessageWhereInput = this.enforceUserScope({});

    // Only allow accountEmail if user owns it
    if (accountEmail) {
      const isOwned = await this.verifyUserOwnsAccount(accountEmail);
      if (!isOwned) {
        throw new Error('Unauthorized: Account does not belong to this user');
      }
      where.accountEmail = accountEmail;
    }

    if (isRead !== undefined) where.isRead = isRead;
    if (isStarred !== undefined) where.isStarred = isStarred;
    if (threadId) where.threadId = threadId;

    const [messages, total] = await Promise.all([
      prisma.gmailMessage.findMany({
        where,
        include: {
          attachments: true,
          thread: { select: { subject: true, messageCount: true } },
        },
        orderBy: { internalDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.gmailMessage.count({ where }),
    ]);

    return {
      messages,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a single message by ID
   * Enforces user owns the message
   */
  async getMessage(messageId: string) {
    const message = await prisma.gmailMessage.findFirst({
      where: this.enforceUserScope({ id: messageId }),
      include: {
        attachments: true,
        thread: true,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    return message;
  }

  /**
   * Get threads for this user only
   */
  async getThreads(options: {
    accountEmail?: string;
    limit?: number;
    offset?: number;
    hasUnread?: boolean;
  }) {
    const { accountEmail, limit = 50, offset = 0, hasUnread } = options;

    const where: Prisma.GmailThreadWhereInput = this.enforceUserScope({});

    if (accountEmail) {
      const isOwned = await this.verifyUserOwnsAccount(accountEmail);
      if (!isOwned) {
        throw new Error('Unauthorized: Account does not belong to this user');
      }
      where.accountEmail = accountEmail;
    }

    if (hasUnread !== undefined) where.hasUnread = hasUnread;

    const [threads, total] = await Promise.all([
      prisma.gmailThread.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { internalDate: 'desc' },
          },
        },
        orderBy: { lastMessageDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.gmailThread.count({ where }),
    ]);

    return { threads, total, limit, offset, hasMore: offset + limit < total };
  }

  /**
   * Get a single thread by ID
   * Enforces user owns the thread
   */
  async getThread(threadId: string) {
    const thread = await prisma.gmailThread.findFirst({
      where: this.enforceUserScope({ id: threadId }),
      include: {
        messages: {
          orderBy: { internalDate: 'asc' },
          include: { attachments: true },
        },
      },
    });

    if (!thread) {
      throw new Error('Thread not found or unauthorized');
    }

    return thread;
  }

  /**
   * Verify user owns the specified email account
   * Checks both primary session email and connected accounts
   */
  private async verifyUserOwnsAccount(accountEmail: string): Promise<boolean> {
    // Check if this email belongs to user's primary account
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { email: true },
    });

    if (user?.email === accountEmail) {
      return true;
    }

    // Check Account table (OAuth accounts)
    const account = await prisma.account.findFirst({
      where: this.enforceUserScope({
        provider: 'google',
      }),
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (account?.user.email === accountEmail) {
      return true;
    }

    // Check connected accounts
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: this.enforceUserScope({
        email: accountEmail,
      }),
    });

    return !!connectedAccount;
  }

  /**
   * Get user's connected email accounts
   * Returns list of emails this user has access to
   */
  async getConnectedAccounts() {
    const [user, accounts, connectedAccounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: this.userId },
        select: { email: true },
      }),
      prisma.account.findMany({
        where: this.enforceUserScope({
          provider: 'google',
        }),
        select: {
          providerAccountId: true,
          provider: true,
          scope: true,
        },
      }),
      prisma.connectedAccount.findMany({
        where: this.enforceUserScope({}),
        select: {
          email: true,
          displayName: true,
          provider: true,
        },
      }),
    ]);

    return {
      primary: user?.email || null,
      accounts,
      connected: connectedAccounts,
    };
  }

  /**
   * Get Gmail sync state for user's account
   */
  async getSyncState(accountEmail?: string) {
    const where: Prisma.GmailSyncStateWhereInput = this.enforceUserScope({});

    if (accountEmail) {
      const isOwned = await this.verifyUserOwnsAccount(accountEmail);
      if (!isOwned) {
        throw new Error('Unauthorized: Account does not belong to this user');
      }
      where.accountEmail = accountEmail;
    }

    return prisma.gmailSyncState.findFirst({ where });
  }

  /**
   * Trigger Gmail sync for this user
   * Returns a sync service scoped to this user
   */
  createSyncService(accountEmail: string) {
    // Sync service will verify ownership internally
    const gmailClient = this.getGmailClient();
    return createGmailSyncService(this.userId, accountEmail, gmailClient);
  }

  /**
   * Get Gmail client for this user
   * All API calls automatically use this user's tokens
   */
  getGmailClient() {
    return createGmailClient(this.userId);
  }

  /**
   * Get message count statistics
   */
  async getMessageStats(accountEmail?: string) {
    const where: Prisma.GmailMessageWhereInput = this.enforceUserScope({});

    if (accountEmail) {
      const isOwned = await this.verifyUserOwnsAccount(accountEmail);
      if (!isOwned) {
        throw new Error('Unauthorized: Account does not belong to this user');
      }
      where.accountEmail = accountEmail;
    }

    const [total, unread, starred, important] = await Promise.all([
      prisma.gmailMessage.count({ where }),
      prisma.gmailMessage.count({ where: { ...where, isRead: false } }),
      prisma.gmailMessage.count({ where: { ...where, isStarred: true } }),
      prisma.gmailMessage.count({ where: { ...where, isImportant: true } }),
    ]);

    return {
      total,
      unread,
      starred,
      important,
    };
  }
}

/**
 * Factory function to create user-scoped Gmail service
 * This is the ONLY way to create a GmailService instance
 *
 * @param userId - User ID to scope service to
 * @returns GmailService instance
 */
export function createGmailService(userId: string): GmailService {
  return new GmailService(userId);
}
