import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const invitationCreateSchema = z.object({
  title: z.string().min(2, 'Give the invitation a title.').max(180),
  partner_one: z.string().min(1, 'Add the first name.').max(120),
  partner_two: z.string().min(1, 'Add the second name.').max(120),
  slug: z
    .string()
    .min(1, 'Choose a public URL.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
  theme_id: z.number().int().positive('Choose a theme.'),
  template_id: z.number().int().nullable(),
  event_at: z.string().min(1, 'Choose the wedding date and time.'),
  timezone: z.string().min(1),
  venue_name: z.string().max(255).optional(),
})

export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>

export function buildRsvpSchema(options: {
  collectPhone: boolean
  allowDecline: boolean
  maxGuests: number
  questions: Array<{ id: string; label: string; type: 'text' | 'textarea' | 'select'; required: boolean; options: string[] }>
  requireGuestCode: boolean
}) {
  const answerShape: Record<string, z.ZodTypeAny> = {}

  for (const question of options.questions) {
    let schema: z.ZodTypeAny
    const maxMessage = 'Keep this answer under 500 characters.'
    if (question.type === 'select' && question.options.length) {
      schema = z
        .string()
        .max(500, maxMessage)
        .refine(
          (value) => !question.required || value.trim().length > 0,
          `${question.label} is required.`,
        )
        .refine(
          (value) => !value || question.options.includes(value),
          'Choose a valid option.',
        )
    } else if (question.required) {
      schema = z.string().min(1, `${question.label} is required.`).max(500, maxMessage)
    } else {
      schema = z.string().max(500, maxMessage).optional()
    }
    answerShape[question.id] = schema
  }

  return z
    .object({
      guest_name: z.string().min(2, 'Please share your name.').max(160),
      email: z.union([z.email('Enter a valid email address.'), z.literal('')]).optional(),
      phone: options.collectPhone
        ? z.string().max(60).optional()
        : z.string().max(60).optional(),
      attendance: options.allowDecline
        ? z.enum(['attending', 'declined'])
        : z.literal('attending'),
      guest_count: z.coerce.number().int().min(1).max(options.maxGuests),
      message: z.string().max(2000).optional(),
      guest_code: options.requireGuestCode
        ? z.string().min(1, 'Enter the guest code from your invitation.')
        : z.string().optional(),
      answers: z.object(answerShape).optional(),
    })
}

export type RsvpFormValues = z.infer<ReturnType<typeof buildRsvpSchema>>
