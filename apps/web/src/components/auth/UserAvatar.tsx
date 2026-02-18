import { auth } from '@/lib/auth'
import { SignOutButton } from './SignOutButton'
import Image from 'next/image'

export async function UserAvatar() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600">
            <span className="text-sm font-semibold text-white">
              {session.user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{session.user.name}</span>
          <span className="text-xs text-gray-400">{session.user.email}</span>
        </div>
      </div>
      <SignOutButton />
    </div>
  )
}
