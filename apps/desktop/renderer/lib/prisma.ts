import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client instance
 *
 * In development, the instance is reused across hot reloads.
 * In production, a new instance is created for each request.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

