import type { Metadata } from 'next'
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
      <body className="antialiased">{children}</body>
    </html>
  )
}
