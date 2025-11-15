import { randomUUID } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { connectedAccounts } from "@/db/schema";

type ConnectedAccountInsert = typeof connectedAccounts.$inferInsert;

type UpsertConnectedAccountInput = Omit<
  ConnectedAccountInsert,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export async function upsertConnectedAccount(
  data: UpsertConnectedAccountInput,
) {
  const now = new Date();

  const [account] = await db
    .insert(connectedAccounts)
    .values({
      id: data.id ?? randomUUID(),
      ...data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        connectedAccounts.userId,
        connectedAccounts.provider,
        connectedAccounts.providerAccountId,
      ],
      set: {
        displayName: data.displayName,
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        tokenType: data.tokenType,
        scope: data.scope,
        isPrimary: data.isPrimary ?? false,
        updatedAt: now,
      },
    })
    .returning();

  return account;
}

export async function listConnectedAccounts(userId: string) {
  return db
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId))
    .orderBy(asc(connectedAccounts.createdAt));
}

export async function removeConnectedAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
) {
  await db
    .delete(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.provider, provider),
        eq(connectedAccounts.providerAccountId, providerAccountId),
      ),
    );
}

export async function setPrimaryConnectedAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
) {
  await db
    .update(connectedAccounts)
    .set({ isPrimary: false })
    .where(eq(connectedAccounts.userId, userId));

  const [account] = await db
    .update(connectedAccounts)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.provider, provider),
        eq(connectedAccounts.providerAccountId, providerAccountId),
      ),
    )
    .returning();

  return account;
}
