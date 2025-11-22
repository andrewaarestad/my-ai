import { prisma } from './prisma';
import type { GmailClient, ParsedMessage } from './gmail-client';
import { logError } from './error-logger';

export class GmailSyncService {
  constructor(
    private userId: string,
    private accountEmail: string,
    private gmailClient: GmailClient
  ) {}

  async syncMessages(options: {
    maxMessages?: number;
    query?: string;
    isInitialSync?: boolean;
  } = {}): Promise<{ synced: number; errors: number }> {
    const { maxMessages = 100, query, isInitialSync = false } = options;

    try {
      // Mark sync as in progress
      await this.updateSyncState({ isSyncing: true, lastError: null });

      let synced = 0;
      let errors = 0;
      let pageToken: string | undefined;

      // For initial sync, we might want to limit how far back we go
      const syncQuery = isInitialSync
        ? query || 'newer_than:30d' // Last 30 days for initial sync
        : query;

      while (synced < maxMessages) {
        const batchSize = Math.min(100, maxMessages - synced); // Gmail API max is 500

        const response = await this.gmailClient.listMessages({
          maxResults: batchSize,
          pageToken,
          q: syncQuery,
        });

        if (!response.messages || response.messages.length === 0) {
          break;
        }

        // Fetch full message details in parallel (but in batches to avoid rate limits)
        const messageIds = response.messages.map(m => m.id);
        const messages = await this.fetchMessagesInBatches(messageIds, 10);

        // Store messages in database
        for (const gmailMessage of messages) {
          try {
            const parsed = this.gmailClient.parseMessage(gmailMessage);
            await this.storeMessage(parsed);
            synced++;
          } catch (error) {
            void logError('Failed to store message', { messageId: gmailMessage.id, error });
            errors++;
          }
        }

        pageToken = response.nextPageToken;
        if (!pageToken) break;
      }

      // Update sync state
      await this.updateSyncState({
        isSyncing: false,
        lastSyncedAt: new Date(),
      });

      return { synced, errors };
    } catch (error) {
      void logError('Gmail sync failed', { userId: this.userId, error });
      await this.updateSyncState({
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async fetchMessagesInBatches(messageIds: string[], batchSize: number) {
    const messages = [];

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      const batchMessages = await this.gmailClient.batchGetMessages(batch);
      messages.push(...batchMessages);

      // Small delay to avoid rate limits
      if (i + batchSize < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return messages;
  }

  private async storeMessage(parsed: ParsedMessage): Promise<void> {
    const {
      id,
      threadId,
      subject,
      from,
      to,
      cc,
      bcc,
      date,
      snippet,
      bodyText,
      bodyHtml,
      labelIds,
      historyId,
      attachments,
    } = parsed;

    // Determine message flags from labels
    const isRead = !labelIds.includes('UNREAD');
    const isStarred = labelIds.includes('STARRED');
    const isImportant = labelIds.includes('IMPORTANT');
    const isDraft = labelIds.includes('DRAFT');
    const isSent = labelIds.includes('SENT');
    const isTrash = labelIds.includes('TRASH');

    // Upsert the thread first
    await prisma.gmailThread.upsert({
      where: { id: threadId },
      create: {
        id: threadId,
        userId: this.userId,
        accountEmail: this.accountEmail,
        subject: subject || '(No subject)',
        snippet: snippet || '',
        lastMessageDate: date,
        messageCount: 1,
        hasUnread: !isRead,
        isStarred,
        isImportant,
      },
      update: {
        subject: subject || '(No subject)',
        snippet: snippet || '',
        lastMessageDate: date,
        hasUnread: !isRead,
        isStarred,
        isImportant,
        updatedAt: new Date(),
      },
    });

    // Upsert the message
    await prisma.gmailMessage.upsert({
      where: { id },
      create: {
        id,
        userId: this.userId,
        threadId,
        accountEmail: this.accountEmail,
        subject,
        snippet,
        from,
        to,
        cc,
        bcc,
        bodyText,
        bodyHtml,
        labelIds,
        historyId,
        internalDate: date,
        isRead,
        isStarred,
        isImportant,
        isDraft,
        isSent,
        isTrash,
      },
      update: {
        subject,
        snippet,
        from,
        to,
        cc,
        bcc,
        bodyText,
        bodyHtml,
        labelIds,
        historyId,
        internalDate: date,
        isRead,
        isStarred,
        isImportant,
        isDraft,
        isSent,
        isTrash,
        updatedAt: new Date(),
      },
    });

    // Store attachments
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        await prisma.gmailAttachment.upsert({
          where: {
            // Create a composite unique constraint or use a different approach
            messageId_attachmentId: {
              messageId: id,
              attachmentId: attachment.attachmentId,
            },
          },
          create: {
            messageId: id,
            userId: this.userId,
            attachmentId: attachment.attachmentId,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
          },
          update: {
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
          },
        });
      }
    }
  }

  private async updateSyncState(data: {
    isSyncing?: boolean;
    lastSyncedAt?: Date;
    historyId?: string;
    pageToken?: string;
    lastError?: string | null;
  }): Promise<void> {
    await prisma.gmailSyncState.upsert({
      where: {
        userId_accountEmail: {
          userId: this.userId,
          accountEmail: this.accountEmail,
        },
      },
      create: {
        userId: this.userId,
        accountEmail: this.accountEmail,
        ...data,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async getSyncState() {
    return prisma.gmailSyncState.findUnique({
      where: {
        userId_accountEmail: {
          userId: this.userId,
          accountEmail: this.accountEmail,
        },
      },
    });
  }

  // Incremental sync using Gmail's history API
  async incrementalSync(): Promise<{ synced: number; errors: number }> {
    const syncState = await this.getSyncState();

    if (!syncState?.historyId) {
      // No history ID yet, do a full sync
      return this.syncMessages({ maxMessages: 500, isInitialSync: true });
    }

    try {
      await this.updateSyncState({ isSyncing: true, lastError: null });

      let synced = 0;
      let errors = 0;
      let pageToken: string | undefined;
      let currentHistoryId = syncState.historyId;
      let hasMore = true;

      while (hasMore) {
        const history = await this.gmailClient.getHistoryList(currentHistoryId, {
          pageToken,
          historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
        });

        if (!history.history || history.history.length === 0) {
          hasMore = false;
          break;
        }

        // Process history records
        for (const record of history.history) {
          // Handle new messages
          if (record.messagesAdded) {
            for (const { message } of record.messagesAdded) {
              try {
                const fullMessage = await this.gmailClient.getMessage(message.id);
                const parsed = this.gmailClient.parseMessage(fullMessage);
                await this.storeMessage(parsed);
                synced++;
              } catch (error) {
                void logError('Failed to process new message', { messageId: message.id, error });
                errors++;
              }
            }
          }

          // Handle deleted messages
          if (record.messagesDeleted) {
            for (const { message } of record.messagesDeleted) {
              await prisma.gmailMessage.delete({
                where: { id: message.id },
              }).catch(() => {
                // Message might not exist in our DB
              });
            }
          }

          // Handle label changes
          if (record.labelsAdded || record.labelsRemoved) {
            // Re-fetch and update the message
            const messageId = record.labelsAdded?.[0]?.message?.id || record.labelsRemoved?.[0]?.message?.id;
            if (messageId) {
              try {
                const fullMessage = await this.gmailClient.getMessage(messageId);
                const parsed = this.gmailClient.parseMessage(fullMessage);
                await this.storeMessage(parsed);
              } catch (error) {
                void logError('Failed to update message labels', { messageId, error });
              }
            }
          }
        }

        currentHistoryId = history.historyId;
        pageToken = history.nextPageToken;
        if (!pageToken) {
          hasMore = false;
        }
      }

      await this.updateSyncState({
        isSyncing: false,
        lastSyncedAt: new Date(),
        historyId: currentHistoryId,
      });

      return { synced, errors };
    } catch (error) {
      void logError('Incremental sync failed', { userId: this.userId, error });
      await this.updateSyncState({
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export function createGmailSyncService(userId: string, accountEmail: string, gmailClient: GmailClient) {
  return new GmailSyncService(userId, accountEmail, gmailClient);
}
