import { describe, expect, it } from 'vitest'
import { buildRsvpSchema } from './validation'

const baseOptions = {
  collectPhone: true,
  allowDecline: false,
  maxGuests: 3,
  requireGuestCode: true,
  questions: [
    {
      id: 'meal',
      label: 'Meal preference',
      type: 'select' as const,
      required: true,
      options: ['Chicken', 'Fish'],
    },
  ],
}

const validValues = {
  guest_name: 'Sara Khan',
  email: 'sara@example.test',
  attendance: 'attending' as const,
  guest_count: 2,
  guest_code: 'WEDDING123',
  answers: { meal: 'Fish' },
}

describe('RSVP form validation', () => {
  it('accepts a complete response within the guest limit', () => {
    expect(buildRsvpSchema(baseOptions).safeParse(validValues).success).toBe(true)
  })

  it('rejects more guests than the invitation allows', () => {
    expect(
      buildRsvpSchema(baseOptions).safeParse({ ...validValues, guest_count: 4 }).success,
    ).toBe(false)
  })

  it('rejects declining when the invitation does not allow it', () => {
    expect(
      buildRsvpSchema(baseOptions).safeParse({ ...validValues, attendance: 'declined' }).success,
    ).toBe(false)
  })

  it('requires a guest code when the invitation is restricted', () => {
    expect(buildRsvpSchema(baseOptions).safeParse({ ...validValues, guest_code: '' }).success).toBe(
      false,
    )
  })

  it('requires custom answers and validates select options', () => {
    const schema = buildRsvpSchema(baseOptions)

    expect(schema.safeParse({ ...validValues, answers: {} }).success).toBe(false)
    expect(schema.safeParse({ ...validValues, answers: { meal: 'Pasta' } }).success).toBe(false)
  })

  it('allows decline and optional answers when configured', () => {
    const schema = buildRsvpSchema({
      ...baseOptions,
      allowDecline: true,
      requireGuestCode: false,
      questions: [
        {
          id: 'note',
          label: 'A note',
          type: 'text',
          required: false,
          options: [],
        },
      ],
    })

    expect(
      schema.safeParse({
        ...validValues,
        attendance: 'declined',
        guest_code: '',
        answers: {},
      }).success,
    ).toBe(true)
  })
})
