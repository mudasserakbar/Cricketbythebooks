import { z } from 'zod/v4'

export const askSchema = z.object({
  question: z.string().min(1).max(500),
  orgId: z.string().uuid(),
  orgName: z.string().min(1).max(200),
  sessionId: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
})

export const contactSchema = z.object({
  orgId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  issueType: z.enum([
    'suspension',
    'eligibility',
    'registration',
    'policy_gap',
    'other',
  ]),
  originalQuestion: z.string().max(500).optional(),
  description: z.string().min(1).max(2000),
  userEmail: z.string().email(),
})

export const uploadSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1).max(300),
  type: z.enum(['bylaws', 'playing_rules', 'registration', 'disciplinary', 'other']),
  version: z.string().max(50).optional(),
})

export const orgSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  level: z.enum(['national', 'provincial']),
  province: z.string().max(100).optional(),
  contact_email: z.string().email().optional(),
  is_active: z.boolean().optional(),
})

export const orgUpdateSchema = orgSchema.partial()

export const feedbackSchema = z.object({
  messageId: z.string(),
  sessionId: z.string(),
  helpful: z.boolean(),
})
