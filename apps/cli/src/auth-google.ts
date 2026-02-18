/**
 * Google OAuth Authentication CLI
 *
 * Usage: npm run auth:google
 *
 * Opens browser for Google sign-in, saves tokens to ~/.my-ai/tokens.json
 */

import { runGoogleAuthFlow, getGoogleAuthClient } from "@my-ai/core/auth";
import { env } from "./environment.js";

const googleConfig = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
};

async function main() {
  const args = process.argv.slice(2);
  const showHelp = args.includes("--help") || args.includes("-h");
  const checkOnly = args.includes("--check");

  if (showHelp) {
    console.log(`
Google OAuth Authentication

Usage:
  npm run auth:google           Authenticate with Google
  npm run auth:google -- --check   Check if already authenticated

Options:
  --help, -h     Show this help message
  --check        Check authentication status without re-authenticating
`);
    process.exit(0);
  }

  if (checkOnly) {
    const client = await getGoogleAuthClient(googleConfig);
    if (client) {
      console.log("✓ Already authenticated with Google");
      process.exit(0);
    } else {
      console.log("✗ Not authenticated with Google");
      console.log("  Run: npm run auth:google");
      process.exit(1);
    }
  }

  // Check if already authenticated
  const existingClient = await getGoogleAuthClient(googleConfig);
  if (existingClient) {
    console.log("Already authenticated with Google.");
    console.log("Re-authenticating will replace existing tokens.\n");
  }

  await runGoogleAuthFlow(googleConfig);
}

main().catch((error) => {
  console.error("Authentication failed:", error.message);
  process.exit(1);
});
