-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "from" TEXT,
    "to" TEXT[],
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "labelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "historyId" TEXT,
    "internalDate" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "isTrash" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_threads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "lastMessageDate" TIMESTAMP(3) NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "hasUnread" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storedPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gmail_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_sync_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "historyId" TEXT,
    "pageToken" TEXT,
    "isSyncing" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "connected_accounts_userId_idx" ON "connected_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_userId_provider_providerAccountId_key" ON "connected_accounts"("userId", "provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "gmail_messages_userId_idx" ON "gmail_messages"("userId");

-- CreateIndex
CREATE INDEX "gmail_messages_threadId_idx" ON "gmail_messages"("threadId");

-- CreateIndex
CREATE INDEX "gmail_messages_accountEmail_idx" ON "gmail_messages"("accountEmail");

-- CreateIndex
CREATE INDEX "gmail_messages_internalDate_idx" ON "gmail_messages"("internalDate");

-- CreateIndex
CREATE INDEX "gmail_messages_isRead_idx" ON "gmail_messages"("isRead");

-- CreateIndex
CREATE INDEX "gmail_threads_userId_idx" ON "gmail_threads"("userId");

-- CreateIndex
CREATE INDEX "gmail_threads_accountEmail_idx" ON "gmail_threads"("accountEmail");

-- CreateIndex
CREATE INDEX "gmail_threads_lastMessageDate_idx" ON "gmail_threads"("lastMessageDate");

-- CreateIndex
CREATE INDEX "gmail_attachments_messageId_idx" ON "gmail_attachments"("messageId");

-- CreateIndex
CREATE INDEX "gmail_attachments_userId_idx" ON "gmail_attachments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "gmail_attachments_messageId_attachmentId_key" ON "gmail_attachments"("messageId", "attachmentId");

-- CreateIndex
CREATE INDEX "gmail_sync_state_userId_idx" ON "gmail_sync_state"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "gmail_sync_state_userId_accountEmail_key" ON "gmail_sync_state"("userId", "accountEmail");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_messages" ADD CONSTRAINT "gmail_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "gmail_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_threads" ADD CONSTRAINT "gmail_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_attachments" ADD CONSTRAINT "gmail_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "gmail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_attachments" ADD CONSTRAINT "gmail_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_sync_state" ADD CONSTRAINT "gmail_sync_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
