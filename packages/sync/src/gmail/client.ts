// Gmail API client
// TODO: Extract from apps/web/src/lib/gmail-client.ts in Phase 1.3

import { getGoogleAuthClient, type GoogleAuthConfig } from '@my-ai/core/auth'

interface GmailMessageHeader {
  name: string
  value: string
}

interface GmailMessagePart {
  partId?: string
  mimeType?: string
  filename?: string
  headers?: GmailMessageHeader[]
  body?: {
    attachmentId?: string
    size?: number
    data?: string
  }
  parts?: GmailMessagePart[]
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  payload?: GmailMessagePart
  sizeEstimate?: number
  historyId?: string
  internalDate?: string
}

interface GmailListMessagesResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

interface GmailHistoryRecord {
  id: string
  messages?: GmailMessage[]
  messagesAdded?: Array<{ message: GmailMessage }>
  messagesDeleted?: Array<{ message: { id: string } }>
  labelsAdded?: Array<{ message: { id: string }; labelIds: string[] }>
  labelsRemoved?: Array<{ message: { id: string }; labelIds: string[] }>
}

interface GmailHistoryResponse {
  history?: GmailHistoryRecord[]
  nextPageToken?: string
  historyId: string
}

export interface ParsedMessage {
  id: string
  threadId: string
  subject: string | null
  from: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  date: Date
  snippet: string | null
  bodyText: string | null
  bodyHtml: string | null
  labelIds: string[]
  historyId: string | null
  attachments: Array<{
    attachmentId: string
    filename: string
    mimeType: string
    size: number
  }>
}

export class GmailClient {
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1'

  constructor(private authConfig: GoogleAuthConfig) {}

  private async getAccessToken(): Promise<string> {
    const client = await getGoogleAuthClient(this.authConfig)
    if (!client) {
      throw new Error('Not authenticated with Google. Run: npm run auth:google')
    }
    const token = await client.getAccessToken()
    if (!token.token) {
      throw new Error('Failed to get access token')
    }
    return token.token
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gmail API error: ${response.status} - ${error}`)
    }

    return response
  }

  async listMessages(
    options: {
      maxResults?: number
      pageToken?: string
      q?: string
      labelIds?: string[]
    } = {}
  ): Promise<GmailListMessagesResponse> {
    const params = new URLSearchParams()

    if (options.maxResults) params.append('maxResults', options.maxResults.toString())
    if (options.pageToken) params.append('pageToken', options.pageToken)
    if (options.q) params.append('q', options.q)
    if (options.labelIds?.length) {
      options.labelIds.forEach((id) => params.append('labelIds', id))
    }

    const response = await this.fetch(`/users/me/messages?${params.toString()}`)
    return response.json() as Promise<GmailListMessagesResponse>
  }

  async getMessage(
    messageId: string,
    format: 'full' | 'metadata' | 'minimal' = 'full'
  ): Promise<GmailMessage> {
    const response = await this.fetch(`/users/me/messages/${messageId}?format=${format}`)
    return response.json() as Promise<GmailMessage>
  }

  async batchGetMessages(messageIds: string[]): Promise<GmailMessage[]> {
    const messages = await Promise.all(messageIds.map((id) => this.getMessage(id)))
    return messages
  }

  parseMessage(gmailMessage: GmailMessage): ParsedMessage {
    const headers = gmailMessage.payload?.headers || []

    const getHeader = (name: string): string | null => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
      return header?.value || null
    }

    const parseAddressList = (header: string | null): string[] => {
      if (!header) return []
      return header
        .split(',')
        .map((addr) => addr.trim())
        .filter(Boolean)
    }

    const subject = getHeader('Subject')
    const from = getHeader('From')
    const to = parseAddressList(getHeader('To'))
    const cc = parseAddressList(getHeader('Cc'))
    const bcc = parseAddressList(getHeader('Bcc'))
    const dateStr = getHeader('Date')
    const date = dateStr ? new Date(dateStr) : new Date(parseInt(gmailMessage.internalDate || '0'))

    let bodyText: string | null = null
    let bodyHtml: string | null = null
    const attachments: ParsedMessage['attachments'] = []

    const extractContent = (part: GmailMessagePart) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.filename && part.body?.attachmentId) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        })
      }

      if (part.parts) {
        part.parts.forEach(extractContent)
      }
    }

    if (gmailMessage.payload) {
      extractContent(gmailMessage.payload)
    }

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject,
      from,
      to,
      cc,
      bcc,
      date,
      snippet: gmailMessage.snippet || null,
      bodyText,
      bodyHtml,
      labelIds: gmailMessage.labelIds || [],
      historyId: gmailMessage.historyId || null,
      attachments,
    }
  }

  async getProfile(): Promise<{
    emailAddress: string
    messagesTotal: number
    threadsTotal: number
  }> {
    const response = await this.fetch('/users/me/profile')
    return response.json() as Promise<{
      emailAddress: string
      messagesTotal: number
      threadsTotal: number
    }>
  }

  async getHistoryList(
    startHistoryId: string,
    options: {
      maxResults?: number
      pageToken?: string
      labelId?: string
      historyTypes?: ('messageAdded' | 'messageDeleted' | 'labelAdded' | 'labelRemoved')[]
    } = {}
  ): Promise<GmailHistoryResponse> {
    const params = new URLSearchParams()
    params.append('startHistoryId', startHistoryId)

    if (options.maxResults) params.append('maxResults', options.maxResults.toString())
    if (options.pageToken) params.append('pageToken', options.pageToken)
    if (options.labelId) params.append('labelId', options.labelId)
    if (options.historyTypes?.length) {
      options.historyTypes.forEach((type) => params.append('historyTypes', type))
    }

    const response = await this.fetch(`/users/me/history?${params.toString()}`)
    return response.json() as Promise<GmailHistoryResponse>
  }

  hasLabel(
    message: ParsedMessage,
    labelName: 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'STARRED' | 'IMPORTANT' | 'UNREAD'
  ): boolean {
    return message.labelIds.includes(labelName)
  }
}

export function createGmailClient(config: GoogleAuthConfig): GmailClient {
  return new GmailClient(config)
}
