import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ask a Question — Cricket by the Books',
  description: 'Ask questions about cricket policy and get cited answers from official documents.',
}

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children
}
