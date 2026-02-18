import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/auth/UserAvatar";
import Link from "next/link";
import { LinkAccountButton } from "./link-account-button";
import { UnlinkAccountButton } from "./unlink-account-button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ linked?: string; link_error?: string }>;
}

export default async function AccountsPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const params = await searchParams;

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: {
      provider: true,
      providerAccountId: true,
      type: true,
      scope: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const successMessage = params.linked === "true"
    ? "Google account linked successfully."
    : params.linked === "refreshed"
      ? "Account tokens refreshed."
      : null;

  const errorMessage = params.link_error
    ? LINK_ERROR_MESSAGES[params.link_error] ?? "An unknown error occurred while linking the account."
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              My AI
            </Link>
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-purple-300 hover:text-purple-200 text-sm mb-4 inline-block"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              Connected Accounts
            </h1>
            <p className="text-gray-300">
              OAuth accounts linked to your profile
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-3 text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
              {errorMessage}
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20 text-center">
              <p className="text-gray-300">
                No connected accounts found. Sign in with an OAuth provider to
                link an account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={`${account.provider}-${account.providerAccountId}`}
                  className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ProviderIcon provider={account.provider} />
                      <div>
                        <h2 className="text-xl font-semibold text-white capitalize">
                          {account.provider}
                        </h2>
                        <p className="text-sm text-gray-400">
                          {account.type} &middot; Connected{" "}
                          {account.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300 border border-green-500/30">
                        Active
                      </span>
                      {accounts.length > 1 && (
                        <UnlinkAccountButton
                          provider={account.provider}
                          providerAccountId={account.providerAccountId}
                        />
                      )}
                    </div>
                  </div>

                  {account.scope && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Permissions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {parseScopeLabels(account.scope).map((label) => (
                          <span
                            key={label}
                            className="inline-block rounded-md bg-white/5 px-2.5 py-1 text-xs text-gray-300 border border-white/10"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <LinkAccountButton />
          </div>
        </div>
      </main>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  // Generic fallback icon
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold uppercase">
      {provider.charAt(0)}
    </div>
  );
}

const SCOPE_LABELS: Record<string, string> = {
  openid: "OpenID",
  "https://www.googleapis.com/auth/userinfo.email": "Email",
  "https://www.googleapis.com/auth/userinfo.profile": "Profile",
  "https://www.googleapis.com/auth/calendar.readonly": "Calendar (read)",
  "https://www.googleapis.com/auth/gmail.readonly": "Gmail (read)",
  "https://www.googleapis.com/auth/drive.readonly": "Drive (read)",
};

function parseScopeLabels(scope: string): string[] {
  return scope.split(" ").map((s) => SCOPE_LABELS[s] || s);
}

const LINK_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "You denied the Google authorization request.",
  missing_params: "OAuth callback was missing required parameters.",
  expired: "The linking session expired. Please try again.",
  invalid_cookie: "Invalid linking session. Please try again.",
  invalid_state: "CSRF validation failed. Please try again.",
  token_exchange: "Failed to exchange the authorization code with Google.",
  userinfo_failed: "Failed to retrieve account information from Google.",
  already_linked_other: "That Google account is already linked to a different user.",
};
