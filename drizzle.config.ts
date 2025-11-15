import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  (() => {
    console.warn(
      "[drizzle] DATABASE_URL (or DIRECT_URL) is not set. Commands may fail until it is configured.",
    );
    return "";
  })();

export default defineConfig({
  schema: "./apps/web/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
