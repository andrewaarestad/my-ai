'use client'

import { useSession } from 'next-auth/react'
import { UserAvatar } from '@/components/auth/UserAvatar'
import { SignInButton } from '@/components/auth/SignInButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white cursor-pointer hover:text-gray-200">
              My AI - Desktop
            </h1>
          </Link>
          {session.user ? <UserAvatar /> : <SignInButton />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              My Agents
            </h2>
            <p className="text-gray-300">
              No agents configured yet. Start by creating your first AI agent.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              Active Tasks
            </h2>
            <p className="text-gray-300">
              Your active tasks will appear here once you create them.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <p className="text-gray-300">
              Configure MCP integrations and authorization settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
