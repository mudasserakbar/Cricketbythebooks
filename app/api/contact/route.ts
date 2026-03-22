import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { contactSchema } from '@/lib/validations'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 contact requests per hour per IP
  const ip = getRateLimitKey(req)
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { orgId, sessionId, issueType, originalQuestion, description, userEmail } =
    parsed.data

  try {
    const supabase = createAdminSupabaseClient()

    const { data: request } = await supabase
      .from('support_requests')
      .insert({
        org_id: orgId,
        session_id: sessionId,
        issue_type: issueType,
        original_question: originalQuestion,
        description,
        user_email: userEmail,
      })
      .select()
      .single()

    if (process.env.RESEND_API_KEY) {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@cricketpolicyhelp.ca',
        to: process.env.SUPPORT_INBOX_EMAIL || 'support@cricketpolicyhelp.ca',
        subject: `[${issueType.toUpperCase()}] New support request`,
        html: `
          <h2>New support request</h2>
          <p><strong>Issue type:</strong> ${issueType}</p>
          <p><strong>User email:</strong> ${userEmail}</p>
          <p><strong>Original question:</strong> ${originalQuestion || 'N/A'}</p>
          <p><strong>Description:</strong><br/>${description}</p>
        `,
      })

      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@cricketpolicyhelp.ca',
        to: userEmail,
        subject: 'We received your request — Cricket Policy Assistant',
        html: `
          <p>Hi,</p>
          <p>Our volunteer team has received your request and will get back to you within 48–72 hours for disciplinary/eligibility matters, or sooner for registration and general questions.</p>
          <p>This is a not-for-profit community service. We appreciate your patience.</p>
          <p>— Cricket Policy Assistant volunteer team</p>
        `,
      })
    }

    return NextResponse.json({ success: true, requestId: request?.id })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}
