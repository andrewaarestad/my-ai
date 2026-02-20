import type { Metadata } from 'next'
import { ToastProvider } from '@/components/toast/ToastContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'My AI - Agent Management Platform',
  description: 'A platform for building and managing AI agents',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
