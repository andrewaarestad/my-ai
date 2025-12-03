import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "./encryption";

/**
 * Prisma Client instance with automatic token encryption
 *
 * In development, the instance is reused across hot reloads.
 * In production, a new instance is created for each request.
 *
 * Token encryption middleware:
 * - Encrypts OAuth tokens before writing to database
 * - Decrypts tokens after reading from database
 * - Applies to Account and ConnectedAccount models
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Add encryption middleware for Account model
  // Encrypts: access_token, refresh_token, id_token
  client.$use(async (params, next) => {
    // Only apply to Account and ConnectedAccount models
    if (params.model === "Account" || params.model === "ConnectedAccount") {
      // Encrypt before creating or updating
      if (params.action === "create" || params.action === "update" || params.action === "upsert") {
        const data = params.action === "upsert" ? params.args.create : params.args.data;

        if (data) {
          // Encrypt tokens before writing
          if (data.access_token !== undefined) {
            data.access_token = await encrypt(data.access_token);
          }
          if (data.refresh_token !== undefined) {
            data.refresh_token = await encrypt(data.refresh_token);
          }
          if (data.id_token !== undefined) {
            data.id_token = await encrypt(data.id_token);
          }

          // For upsert, also encrypt the update data
          if (params.action === "upsert" && params.args.update) {
            const updateData = params.args.update;
            if (updateData.access_token !== undefined) {
              updateData.access_token = await encrypt(updateData.access_token);
            }
            if (updateData.refresh_token !== undefined) {
              updateData.refresh_token = await encrypt(updateData.refresh_token);
            }
            if (updateData.id_token !== undefined) {
              updateData.id_token = await encrypt(updateData.id_token);
            }
          }
        }
      }

      // Execute the query
      const result = await next(params);

      // Decrypt after reading
      if (
        params.action === "findUnique" ||
        params.action === "findFirst" ||
        params.action === "findMany"
      ) {
        // Handle single result
        if (result && !Array.isArray(result)) {
          if (result.access_token) {
            result.access_token = await decrypt(result.access_token);
          }
          if (result.refresh_token) {
            result.refresh_token = await decrypt(result.refresh_token);
          }
          if (result.id_token) {
            result.id_token = await decrypt(result.id_token);
          }
        }

        // Handle array results
        if (Array.isArray(result)) {
          for (const item of result) {
            if (item.access_token) {
              item.access_token = await decrypt(item.access_token);
            }
            if (item.refresh_token) {
              item.refresh_token = await decrypt(item.refresh_token);
            }
            if (item.id_token) {
              item.id_token = await decrypt(item.id_token);
            }
          }
        }
      }

      return result;
    }

    // For other models, pass through unchanged
    return next(params);
  });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

