import { NextRequest, NextResponse } from 'next/server'
import { generateQuizChallenge, verifyQuizAnswer } from '@/lib/cricket-quiz'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

// GET: Get a new quiz question
export async function GET() {
  const challenge = generateQuizChallenge()

  // Don't send the correctIndex to the client
  const { correctIndex, ...safeQuestion } = challenge.question

  return NextResponse.json({
    question: safeQuestion,
    token: challenge.token,
  })
}

// POST: Verify an answer
export async function POST(req: NextRequest) {
  // Rate limit: 10 quiz attempts per hour per IP
  const ip = getRateLimitKey(req)
  const limit = rateLimit(`quiz:${ip}`, 10, 60 * 60 * 1000)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const { token, selectedIndex } = await req.json()

  if (token === undefined || selectedIndex === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = verifyQuizAnswer(token, selectedIndex)

  if (result.expired) {
    return NextResponse.json({
      verified: false,
      reason: 'expired',
      message: 'Quiz expired. Please try a new question.',
    })
  }

  if (!result.valid) {
    return NextResponse.json({
      verified: false,
      reason: 'wrong',
      message: 'Not quite! Try again.',
    })
  }

  // Generate a session verification token (valid for 24 hours)
  const verifiedUntil = Date.now() + 24 * 60 * 60 * 1000
  const verificationToken = Buffer.from(
    `verified:${ip}:${verifiedUntil}`
  ).toString('base64')

  return NextResponse.json({
    verified: true,
    verificationToken,
    expiresAt: verifiedUntil,
  })
}
