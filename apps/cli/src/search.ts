/**
 * Search CLI
 *
 * Usage:
 *   pnpm data:search "query"                    Search all sources
 *   pnpm data:search "query" -- --source=gmail  Search specific source
 *   pnpm data:search "query" -- --limit=20      Limit results
 *   pnpm data:search "query" -- --format=json   JSON output
 */

import { prisma } from "@my-ai/core/db";

interface CliOptions {
  query: string;
  source?: string;
  limit: number;
  format: "text" | "json";
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  // Check for help first
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Search CLI

Usage:
  pnpm data:search "query"                     Search all synced data
  pnpm data:search "query" -- --source=gmail   Search specific source
  pnpm data:search "query" -- --limit=20       Limit results (default: 20)
  pnpm data:search "query" -- --format=json    Output as JSON

Sources:
  gmail        Email messages
  (more sources coming in Phase 2+)

Examples:
  pnpm data:search "project update"
  pnpm data:search "from:boss@company.com" -- --source=gmail
  pnpm data:search "meeting" -- --limit=50 --format=json
`);
    process.exit(0);
  }

  // First non-flag argument is the query
  const query = args.find((arg) => !arg.startsWith("--") && !arg.startsWith("-"));

  if (!query) {
    console.error('Usage: pnpm data:search "query" [options]');
    console.error("Run: pnpm data:search -- --help for more info");
    process.exit(1);
  }

  const options: CliOptions = {
    query,
    limit: 20,
    format: "text",
  };

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      options.source = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "20", 10);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Error: --limit must be a positive number, got "${arg.split("=")[1]}"`);
        process.exit(1);
      }
      options.limit = parsed;
    } else if (arg === "--format=json") {
      options.format = "json";
    }
  }

  return options;
}

interface SearchResult {
  source: string;
  id: string;
  title: string;
  snippet: string;
  date: Date;
  metadata?: Record<string, unknown>;
}

async function searchGmail(query: string, limit: number): Promise<SearchResult[]> {
  // Simple ILIKE search for now
  // TODO: Add proper tsvector search in Phase 1.4
  const messages = await prisma.gmailMessage.findMany({
    where: {
      OR: [
        { subject: { contains: query, mode: "insensitive" } },
        { bodyText: { contains: query, mode: "insensitive" } },
        { from: { contains: query, mode: "insensitive" } },
        { snippet: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { internalDate: "desc" },
    take: limit,
    select: {
      id: true,
      subject: true,
      snippet: true,
      from: true,
      internalDate: true,
    },
  });

  return messages.map((msg) => ({
    source: "gmail",
    id: msg.id,
    title: msg.subject || "(No subject)",
    snippet: msg.snippet || "",
    date: msg.internalDate,
    metadata: { from: msg.from },
  }));
}

async function main() {
  const options = parseArgs();

  let results: SearchResult[] = [];

  // Search based on source filter
  if (!options.source || options.source === "gmail") {
    const gmailResults = await searchGmail(options.query, options.limit);
    results.push(...gmailResults);
  }

  // TODO: Add calendar, monarch, notes search in later phases

  // Sort by date
  results.sort((a, b) => b.date.getTime() - a.date.getTime());
  results = results.slice(0, options.limit);

  // Output
  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    if (results.length === 0) {
      console.log(`No results found for: "${options.query}"`);
      process.exit(2);
    }

    console.log(`Found ${results.length} results for: "${options.query}"\n`);

    for (const result of results) {
      console.log(`[${result.source}] ${result.title}`);
      if (result.metadata?.from) {
        console.log(`  From: ${result.metadata.from}`);
      }
      console.log(`  Date: ${result.date.toISOString()}`);
      if (result.snippet) {
        console.log(`  ${result.snippet.substring(0, 100)}...`);
      }
      console.log();
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Search failed:", error.message);
  await prisma.$disconnect();
  process.exit(1);
});
