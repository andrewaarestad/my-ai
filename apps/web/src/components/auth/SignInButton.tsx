import { signIn } from '@/lib/auth'

export function SignInButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('google', { redirectTo: '/dashboard' })
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-white px-6 py-2.5 font-semibold text-gray-900 transition-all hover:bg-gray-100"
      >
        Sign In
      </button>
    </form>
  )
}
