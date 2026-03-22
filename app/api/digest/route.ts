import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// Weekly digest endpoint — designed to be called by a cron job (e.g., Vercel Cron)
// GET /api/digest?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Get stats per org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, contact_email')
    .eq('is_active', true)

  if (!orgs) {
    return NextResponse.json({ error: 'No orgs found' }, { status: 500 })
  }

  const digests = []

  for (const org of orgs) {
    if (!org.contact_email) continue

    // Count questions
    const { count: totalQuestions } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('role', 'user')
      .gte('created_at', weekAgo.toISOString())

    // Count answered
    const { count: answered } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('role', 'assistant')
      .eq('answer_found', true)
      .gte('created_at', weekAgo.toISOString())

    // Count support requests
    const { count: supportCount } = await supabase
      .from('support_requests')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('created_at', weekAgo.toISOString())

    const answerRate =
      totalQuestions && totalQuestions > 0
        ? Math.round(((answered || 0) / totalQuestions) * 100)
        : 0

    if ((totalQuestions || 0) > 0 && process.env.RESEND_API_KEY) {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@cricketpolicyhelp.ca',
        to: org.contact_email,
        subject: `Weekly digest — ${org.name} | Cricket Policy Assistant`,
        html: `
          <h2>${org.name} — Weekly Digest</h2>
          <p>Here's your Cricket Policy Assistant summary for the past 7 days:</p>
          <ul>
            <li><strong>${totalQuestions || 0}</strong> questions asked</li>
            <li><strong>${answerRate}%</strong> answer rate</li>
            <li><strong>${supportCount || 0}</strong> support requests</li>
          </ul>
          <p>Visit the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cricketpolicyhelp.ca'}/admin">admin dashboard</a> for more details.</p>
          <p>— Cricket Policy Assistant</p>
        `,
      })

      digests.push({ org: org.name, sent: true })
    }
  }

  return NextResponse.json({ success: true, digests })
}
