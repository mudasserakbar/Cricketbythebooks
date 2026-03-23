import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LiveChatWidget } from '@/components/LiveChatWidget'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Cricket by the Books',
  description:
    'Get answers to your cricket policy questions. A free, community-run tool for the Canadian cricket community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <LiveChatWidget />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
