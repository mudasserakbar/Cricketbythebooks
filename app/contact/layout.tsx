import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Support — Cricket by the Books',
  description: 'Need help with a cricket policy question? Contact our volunteer team for assistance.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
