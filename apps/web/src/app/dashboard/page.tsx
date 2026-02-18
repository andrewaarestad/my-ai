import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserAvatar } from '@/components/auth/UserAvatar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect('/auth/signin')
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
          <h1 className="mb-2 text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300">Welcome back, {session.user.name || 'User'}!</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* My Tasks */}
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
            <h2 className="mb-3 text-2xl font-semibold text-white">My Tasks</h2>
            <p className="mb-4 text-gray-300">Manage your personal task list</p>
            <Link
              href="/todo"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              View Tasks
            </Link>
          </div>

          {/* Connected Accounts */}
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
            <h2 className="mb-3 text-2xl font-semibold text-white">Connected Accounts</h2>
            <p className="mb-4 text-gray-300">Manage your linked OAuth accounts</p>
            <Link
              href="/dashboard/accounts"
              className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700"
            >
              Manage Accounts
            </Link>
          </div>

          {/* AI Agents */}
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
            <h2 className="mb-3 text-2xl font-semibold text-white">AI Agents</h2>
            <p className="mb-4 text-gray-300">Create and manage your AI agents</p>
            <button
              disabled
              className="inline-block cursor-not-allowed rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              Coming Soon
            </button>
          </div>

          {/* Data Access */}
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
            <h2 className="mb-3 text-2xl font-semibold text-white">Data Access</h2>
            <p className="mb-4 text-gray-300">Access your Google Calendar, Gmail, and Drive</p>
            <button
              disabled
              className="inline-block cursor-not-allowed rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-8 rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
          <h2 className="mb-4 text-xl font-semibold text-white">Your Profile</h2>
          <div className="space-y-2 text-gray-300">
            <p>
              <span className="font-medium text-white">Name:</span> {session.user.name}
            </p>
            <p>
              <span className="font-medium text-white">Email:</span> {session.user.email}
            </p>
            <p>
              <span className="font-medium text-white">User ID:</span> {session.user.id}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
