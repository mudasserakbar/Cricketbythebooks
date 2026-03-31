'use client'

export function NotFoundCard({ orgName }: { orgName: string }) {
  return (
    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 space-y-3 animate-scale-in">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🔍</span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            We couldn&apos;t find this in {orgName}&apos;s documents
          </p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            This might not be covered yet, or it may be worded differently. A few things to try:
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-8">
        <div className="flex items-start gap-2 text-xs text-amber-800">
          <span className="font-semibold flex-shrink-0">1.</span>
          <span>
            <strong>Rephrase in plain English</strong> — e.g. &ldquo;can I play for two clubs?&rdquo; instead of &ldquo;dual registration eligibility&rdquo;
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-amber-800">
          <span className="font-semibold flex-shrink-0">2.</span>
          <span>
            <a href="/" className="underline underline-offset-2 font-semibold hover:text-amber-900">
              Try Cricket Canada
            </a>
            {' '}— national body covers many rules that provinces follow
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-amber-800">
          <span className="font-semibold flex-shrink-0">3.</span>
          <span>
            <a href="/contact" className="underline underline-offset-2 font-semibold hover:text-amber-900">
              Ask our volunteer team
            </a>
            {' '}— they know the gaps and can point you to the right person
          </span>
        </div>
      </div>
    </div>
  )
}
