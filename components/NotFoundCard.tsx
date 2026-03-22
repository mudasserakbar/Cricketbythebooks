'use client'

export function NotFoundCard({ orgName }: { orgName: string }) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
      <p className="text-xs text-amber-800 mb-2">
        This topic isn&apos;t in {orgName}&apos;s current documents. Our
        volunteer team may be able to help.
      </p>
      <div className="flex gap-2">
        <a
          href="/contact"
          className="text-xs bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
        >
          Send a request
        </a>
      </div>
    </div>
  )
}
