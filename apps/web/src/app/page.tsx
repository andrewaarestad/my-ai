import { auth } from '@/lib/auth'
import { SignInButton } from '@/components/auth/SignInButton'
import { UserAvatar } from '@/components/auth/UserAvatar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My AI</h1>
          {session?.user ? <UserAvatar /> : <SignInButton />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="mb-4 text-6xl font-bold text-white">My AI</h1>
          <p className="mb-8 max-w-2xl text-xl text-gray-300">
            A platform for building and managing AI agents to tackle personal tasks
          </p>

          <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
              <h2 className="mb-3 text-2xl font-semibold text-white">Agents</h2>
              <p className="text-gray-300">Build and manage AI agents for various tasks</p>
            </div>

            <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
              <h2 className="mb-3 text-2xl font-semibold text-white">MCPs</h2>
              <p className="text-gray-300">Configure Model Context Protocol integrations</p>
            </div>

            {session?.user ? (
              <Link href="/dashboard">
                <div className="cursor-pointer rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg transition-all hover:bg-white/20">
                  <h2 className="mb-3 text-2xl font-semibold text-white">Dashboard</h2>
                  <p className="text-gray-300">Access your personalized AI dashboard</p>
                </div>
              </Link>
            ) : (
              <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
                <h2 className="mb-3 text-2xl font-semibold text-white">Auth</h2>
                <p className="mb-4 text-gray-300">
                  Sign in to manage authorizations and access your data
                </p>
                <SignInButton />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
