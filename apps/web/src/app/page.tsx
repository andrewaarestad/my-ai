import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserAvatar } from "@/components/auth/UserAvatar";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

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
          <h1 className="text-6xl font-bold text-white mb-4">My AI</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            A platform for building and managing AI agents to tackle personal tasks
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl w-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-3">Agents</h2>
              <p className="text-gray-300">
                Build and manage AI agents for various tasks
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-3">MCPs</h2>
              <p className="text-gray-300">
                Configure Model Context Protocol integrations
              </p>
            </div>

            {session?.user ? (
              <Link href="/dashboard">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 transition-all hover:bg-white/20 cursor-pointer">
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Dashboard
                  </h2>
                  <p className="text-gray-300">
                    Access your personalized AI dashboard
                  </p>
                </div>
              </Link>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                <h2 className="text-2xl font-semibold text-white mb-3">Auth</h2>
                <p className="text-gray-300 mb-4">
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
