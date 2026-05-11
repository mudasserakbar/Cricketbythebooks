'use client'

const SAFE_SPORT_CONTACTS: Record<string, { name: string; email: string; phone: string }> = {
  'cricket-canada': {
    name: 'Ilan Yampolsky (Independent Safe Sport Officer)',
    email: 'cricketcanada@itpsport.ca',
    phone: '1-833-913-1304',
  },
}

export function NotFoundCard({ orgName, orgSlug }: { orgName: string; orgSlug?: string }) {
  const safeSport = orgSlug ? SAFE_SPORT_CONTACTS[orgSlug] : undefined
  const isProvincial = orgSlug !== 'cricket-canada'

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

        {isProvincial && (
          <div className="flex items-start gap-2 text-xs text-amber-800">
            <span className="font-semibold flex-shrink-0">2.</span>
            <span>
              <a href="/ask?org=cricket-canada" className="underline underline-offset-2 font-semibold hover:text-amber-900">
                Try Cricket Canada
              </a>
              {' '}— national body covers many rules that provinces follow
            </span>
          </div>
        )}

        {safeSport && (
          <div className="flex items-start gap-2 text-xs text-amber-800">
            <span className="font-semibold flex-shrink-0">{isProvincial ? '3.' : '2.'}</span>
            <span>
              <strong>Safe sport complaint?</strong> Contact{' '}
              <a
                href={`mailto:${safeSport.email}`}
                className="underline underline-offset-2 font-semibold hover:text-amber-900"
              >
                {safeSport.name}
              </a>
              {' '}at{' '}
              <a
                href={`tel:${safeSport.phone}`}
                className="underline underline-offset-2 font-semibold hover:text-amber-900"
              >
                {safeSport.phone}
              </a>
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-amber-800">
          <span className="font-semibold flex-shrink-0">
            {isProvincial ? (safeSport ? '4.' : '3.') : (safeSport ? '3.' : '2.')}
          </span>
          <span>
            <a
              href="https://www.cricketcanada.org/news"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 font-semibold hover:text-amber-900"
            >
              Check Cricket Canada News
            </a>
            {' '}— for recent announcements, governance updates, and official statements
          </span>
        </div>
      </div>
    </div>
  )
}
