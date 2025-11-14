import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/auth/UserAvatar";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              My AI
            </Link>
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">
            Welcome back, {session.user.name || "User"}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Connected Accounts */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Connected Accounts
            </h2>
            <p className="text-gray-300 mb-4">
              Manage your linked OAuth accounts
            </p>
            <Link
              href="/dashboard/accounts"
              className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700"
            >
              Manage Accounts
            </Link>
          </div>

          {/* AI Agents */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-3">
              AI Agents
            </h2>
            <p className="text-gray-300 mb-4">
              Create and manage your AI agents
            </p>
            <button
              disabled
              className="inline-block rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Data Access */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Data Access
            </h2>
            <p className="text-gray-300 mb-4">
              Access your Google Calendar, Gmail, and Drive
            </p>
            <button
              disabled
              className="inline-block rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Profile
          </h2>
          <div className="space-y-2 text-gray-300">
            <p>
              <span className="font-medium text-white">Name:</span>{" "}
              {session.user.name}
            </p>
            <p>
              <span className="font-medium text-white">Email:</span>{" "}
              {session.user.email}
            </p>
            <p>
              <span className="font-medium text-white">User ID:</span>{" "}
              {session.user.id}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
