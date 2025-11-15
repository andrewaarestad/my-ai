import { handlers } from "@/lib/auth";

export const runtime = "nodejs";

// Export NextAuth.js handlers for App Router
export const { GET, POST } = handlers;
