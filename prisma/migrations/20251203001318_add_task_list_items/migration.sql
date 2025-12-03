-- CreateTable
CREATE TABLE "task_list_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_list_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_list_item_userId_completed_order_idx" ON "task_list_item"("userId", "completed", "order");

-- CreateIndex
CREATE INDEX "task_list_item_userId_order_idx" ON "task_list_item"("userId", "order");

-- AddForeignKey
ALTER TABLE "task_list_item" ADD CONSTRAINT "task_list_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
