import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

let poolInstance: Pool | undefined;
let dbInstance: NodePgDatabase<typeof schema> | undefined;

const getPool = () => {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 10 : 1,
    });
  }
  return poolInstance;
};

const getDb = () => {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), {
      schema,
      logger: process.env.NODE_ENV === "development",
    });
  }
  return dbInstance;
};

const pool = getPool();
const db = getDb();

export { db, pool, schema };
