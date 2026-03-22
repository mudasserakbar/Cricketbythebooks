'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export function LiveChatWidget() {
  useEffect(() => {
    const crispId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
    if (!crispId) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = crispId
    const s = document.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = true
    document.head.appendChild(s)

    return () => {
      s.remove()
    }
  }, [])

  return null
}
