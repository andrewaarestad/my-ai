import { signOut } from '@/lib/auth'

export function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
      >
        Sign Out
      </button>
    </form>
  )
}
