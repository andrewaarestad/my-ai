// Gmail sync service
// Adapted from apps/web/src/lib/gmail-sync.ts for CLI use

import { prisma } from '@my-ai/core/db'
import type { GmailClient, ParsedMessage } from './client.js'

export interface SyncResult {
  synced: number
  errors: number
}

export interface SyncOptions {
  maxMessages?: number
  query?: string
  isInitialSync?: boolean
  verbose?: boolean
}

export class GmailSyncService {
  constructor(
    private userId: string,
    private accountEmail: string,
    private gmailClient: GmailClient
  ) {}

  async syncMessages(options: SyncOptions = {}): Promise<SyncResult> {
    const { maxMessages = 100, query, isInitialSync = false, verbose = false } = options

    try {
      await this.updateSyncState({ isSyncing: true, lastError: null })

      let synced = 0
      let errors = 0
      let pageToken: string | undefined
      let latestHistoryId: string | null = null

      const syncQuery = isInitialSync ? query || 'newer_than:30d' : query

      while (synced < maxMessages) {
        const batchSize = Math.min(100, maxMessages - synced)

        const response = await this.gmailClient.listMessages({
          maxResults: batchSize,
          pageToken,
          q: syncQuery,
        })

        if (!response.messages || response.messages.length === 0) {
          break
        }

        if (verbose) {
          console.error(`Fetching batch of ${response.messages.length} messages...`)
        }

        const messageIds = response.messages.map((m) => m.id)
        const messages = await this.fetchMessagesInBatches(messageIds, 10)

        for (const gmailMessage of messages) {
          try {
            const parsed = this.gmailClient.parseMessage(gmailMessage)
            await this.storeMessage(parsed)
            synced++

            // Track the latest historyId for incremental sync
            if (parsed.historyId) {
              if (!latestHistoryId || BigInt(parsed.historyId) > BigInt(latestHistoryId)) {
                latestHistoryId = parsed.historyId
              }
            }

            if (verbose && synced % 10 === 0) {
              console.error(`Synced ${synced} messages...`)
            }
          } catch (error) {
            console.error(`Failed to store message ${gmailMessage.id}:`, error)
            errors++
          }
        }

        pageToken = response.nextPageToken
        if (!pageToken) break
      }

      await this.updateSyncState({
        isSyncing: false,
        lastSyncedAt: new Date(),
        ...(latestHistoryId && { historyId: latestHistoryId }),
      })

      return { synced, errors }
    } catch (error) {
      console.error('Gmail sync failed:', error)
      await this.updateSyncState({
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  private async fetchMessagesInBatches(messageIds: string[], batchSize: number) {
    const messages = []

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      const batchMessages = await this.gmailClient.batchGetMessages(batch)
      messages.push(...batchMessages)

      if (i + batchSize < messageIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return messages
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
    } = parsed

    const isRead = !labelIds.includes('UNREAD')
    const isStarred = labelIds.includes('STARRED')
    const isImportant = labelIds.includes('IMPORTANT')
    const isDraft = labelIds.includes('DRAFT')
    const isSent = labelIds.includes('SENT')
    const isTrash = labelIds.includes('TRASH')

    const existingThread = await prisma.gmailThread.findUnique({
      where: { id: threadId },
      select: { lastMessageDate: true },
    })

    const shouldUpdateDate = !existingThread || date > existingThread.lastMessageDate

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
        ...(shouldUpdateDate && { lastMessageDate: date }),
        messageCount: { increment: 1 },
        hasUnread: !isRead,
        isStarred,
        isImportant,
        updatedAt: new Date(),
      },
    })

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
    })

    if (attachments.length > 0) {
      for (const attachment of attachments) {
        await prisma.gmailAttachment.upsert({
          where: {
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
        })
      }
    }
  }

  private async updateSyncState(data: {
    isSyncing?: boolean
    lastSyncedAt?: Date
    historyId?: string
    pageToken?: string
    lastError?: string | null
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
    })
  }

  async getSyncState() {
    return prisma.gmailSyncState.findUnique({
      where: {
        userId_accountEmail: {
          userId: this.userId,
          accountEmail: this.accountEmail,
        },
      },
    })
  }

  async incrementalSync(
    options: { verbose?: boolean; maxMessages?: number } = {}
  ): Promise<SyncResult> {
    const { verbose = false, maxMessages = 100 } = options
    const syncState = await this.getSyncState()

    if (!syncState?.historyId) {
      if (verbose) {
        console.error('No history ID found, performing initial sync...')
      }
      return this.syncMessages({ maxMessages, isInitialSync: true, verbose })
    }

    try {
      await this.updateSyncState({ isSyncing: true, lastError: null })

      let synced = 0
      let errors = 0
      let pageToken: string | undefined
      let currentHistoryId = syncState.historyId
      let hasMore = true

      while (hasMore) {
        const history = await this.gmailClient.getHistoryList(currentHistoryId, {
          pageToken,
          historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
        })

        if (!history.history || history.history.length === 0) {
          hasMore = false
          break
        }

        for (const record of history.history) {
          if (record.messagesAdded) {
            for (const { message } of record.messagesAdded) {
              try {
                const fullMessage = await this.gmailClient.getMessage(message.id)
                const parsed = this.gmailClient.parseMessage(fullMessage)
                await this.storeMessage(parsed)
                synced++
              } catch (error) {
                console.error(`Failed to process new message ${message.id}:`, error)
                errors++
              }
            }
          }

          if (record.messagesDeleted) {
            for (const { message } of record.messagesDeleted) {
              await prisma.gmailMessage.delete({ where: { id: message.id } }).catch(() => {})
            }
          }

          // Handle label changes - collect all unique message IDs
          if (record.labelsAdded || record.labelsRemoved) {
            const messageIds = new Set<string>()

            if (record.labelsAdded) {
              for (const item of record.labelsAdded) {
                if (item.message?.id) {
                  messageIds.add(item.message.id)
                }
              }
            }

            if (record.labelsRemoved) {
              for (const item of record.labelsRemoved) {
                if (item.message?.id) {
                  messageIds.add(item.message.id)
                }
              }
            }

            for (const messageId of messageIds) {
              try {
                const fullMessage = await this.gmailClient.getMessage(messageId)
                const parsed = this.gmailClient.parseMessage(fullMessage)
                await this.storeMessage(parsed)
              } catch (error) {
                console.error(`Failed to update message labels ${messageId}:`, error)
              }
            }
          }
        }

        currentHistoryId = history.historyId
        pageToken = history.nextPageToken
        if (!pageToken) {
          hasMore = false
        }
      }

      await this.updateSyncState({
        isSyncing: false,
        lastSyncedAt: new Date(),
        historyId: currentHistoryId,
      })

      return { synced, errors }
    } catch (error) {
      console.error('Incremental sync failed:', error)
      await this.updateSyncState({
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
}

export function createGmailSyncService(
  userId: string,
  accountEmail: string,
  gmailClient: GmailClient
): GmailSyncService {
  return new GmailSyncService(userId, accountEmail, gmailClient)
}
