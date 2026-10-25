import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Check, Heart, Loader2, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { buildRsvpSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { PublicInvitation, RsvpQuestion, SectionContent } from '@/types'

interface RsvpFormState {
  guest_name: string
  email: string
  phone: string
  attendance: 'attending' | 'declined'
  guest_count: number
  message: string
  guest_code: string
}

interface VerifiedGuest {
  name: string
  first_name: string
  max_guests: number
  already_responded: boolean
}

interface RsvpFormProps {
  invitation: PublicInvitation
  content: SectionContent
  accent?: string
}

const toAnswerRecord = (questions: RsvpQuestion[]): Record<string, string> =>
  Object.fromEntries(questions.map((question) => [question.id, '']))

export function RsvpForm({ invitation, content }: RsvpFormProps) {
  const rsvp = invitation.rsvp
  const questions = rsvp.questions
  const [answers, setAnswers] = useState<Record<string, string>>(() => toAnswerRecord(questions))
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({})
  const [guestCode, setGuestCode] = useState('')
  const [verifiedGuest, setVerifiedGuest] = useState<VerifiedGuest | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ name: string; attending: boolean; count: number } | null>(null)
  const [searchParams] = useSearchParams()
  const autoVerified = useRef<string | null>(null)

  const maxGuests = verifiedGuest?.max_guests ?? rsvp.max_guests_per_submission

  const schema = buildRsvpSchema({
    collectPhone: rsvp.collect_phone,
    allowDecline: rsvp.allow_decline,
    maxGuests,
    questions,
    requireGuestCode: rsvp.require_guest_code,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RsvpFormState>({
    resolver: zodResolver(schema) as unknown as Resolver<RsvpFormState>,
    defaultValues: {
      guest_name: '',
      email: '',
      phone: '',
      attendance: 'attending',
      guest_count: 1,
      message: '',
      guest_code: '',
    },
  })

  const attendance = watch('attendance')

  const verifyCode = useCallback(
    async (rawCode?: string) => {
      const code = (rawCode ?? guestCode).trim()
      if (!code) {
        setCodeError('Please enter the code from your invitation.')
        return
      }
      setVerifying(true)
      setCodeError(null)
      try {
        const { data } = await api.get<{ data: VerifiedGuest }>(
          `/public/invitations/${invitation.slug}/guest-code/${encodeURIComponent(code)}`,
        )
        setVerifiedGuest(data.data)
        setGuestCode(code.toUpperCase())
        setValue('guest_name', data.data.name, { shouldValidate: true })
        setValue('guest_code', code, { shouldValidate: true })
        setValue('guest_count', 1, { shouldValidate: true })
        if (data.data.already_responded) {
          setCodeError(null)
        }
      } catch (error) {
        setVerifiedGuest(null)
        if (rsvp.require_guest_code) {
          setCodeError(getApiErrorMessage(error))
        }
      } finally {
        setVerifying(false)
      }
    },
    [guestCode, invitation.slug, rsvp.require_guest_code, setValue],
  )

  useEffect(() => {
    const code = searchParams.get('guest')?.trim()
    if (!code || autoVerified.current === code) return
    autoVerified.current = code
    setGuestCode(code.toUpperCase())
    void verifyCode(code)
  }, [searchParams, verifyCode])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const missing: Record<string, string> = {}
    for (const question of questions) {
      const value = answers[question.id]?.trim() ?? ''
      if (question.required && !value) {
        missing[question.id] = `${question.label} is required.`
      }
    }
    if (Object.keys(missing).length) {
      setAnswerErrors(missing)
      return
    }
    setAnswerErrors({})

    const payload: Record<string, unknown> = {
      guest_name: values.guest_name,
      email: values.email || null,
      phone: rsvp.collect_phone ? values.phone || null : null,
      attendance: values.attendance,
      guest_count: values.attendance === 'declined' ? 1 : values.guest_count,
      message: values.message || null,
      answers: Object.fromEntries(
        Object.entries(answers).filter(([, value]) => value.trim() !== ''),
      ),
    }

    const submittedCode = verifiedGuest ? guestCode.trim() : rsvp.require_guest_code ? guestCode.trim() : ''

    if (submittedCode) {
      payload.guest_code = submittedCode
    }

    try {
      await api.post(`/public/invitations/${invitation.slug}/rsvp`, payload)
      setSubmitted({
        name: values.guest_name,
        attending: values.attendance === 'attending',
        count: values.attendance === 'declined' ? 0 : values.guest_count,
      })
      window.setTimeout(() => {
        document.getElementById('rsvp-thanks')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    }
  })

  if (!rsvp.enabled) {
    return (
      <div className="inv-card mx-auto max-w-xl p-9 text-center">
        <LockKeyhole className="mx-auto h-6 w-6 text-[var(--w-accent)]" />
        <h3 className="inv-display mt-4 text-3xl">RSVP is closed</h3>
        <p className="inv-body mt-3 text-sm leading-relaxed text-[var(--w-muted)]">
          Please reach out to the family directly if you would like to share your wishes.
        </p>
      </div>
    )
  }

  if (rsvp.deadline_passed) {
    return (
      <div className="inv-card mx-auto max-w-xl p-9 text-center">
        <CalendarClock className="mx-auto h-6 w-6 text-[var(--w-accent)]" />
        <h3 className="inv-display mt-4 text-3xl">The reply date has passed</h3>
        <p className="inv-body mt-3 text-sm leading-relaxed text-[var(--w-muted)]">
          The family is busy with final arrangements. Please contact them directly if there is anything they should
          know.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <motion.div
        id="rsvp-thanks"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inv-card mx-auto max-w-2xl px-6 py-12 text-center sm:px-12"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--w-accent)]/40 bg-[var(--w-accent)]/10 text-[var(--w-primary)]">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="inv-display mt-6 text-4xl">{submitted.attending ? 'We cannot wait' : 'Thank you'}</h3>
        <p className="inv-body mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--w-muted)]">
          {content.success_message ?? rsvp.success_message ?? 'Your response has been received with love.'}
        </p>
        <div className="mx-auto mt-7 max-w-sm border-y border-[var(--w-card-border)] py-4 text-left text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--w-muted)]">Guest</span>
            <span className="font-medium">{submitted.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-[var(--w-muted)]">Response</span>
            <span className="font-medium">
              {submitted.attending ? `Joyfully attending · ${submitted.count} guest${submitted.count === 1 ? '' : 's'}` : 'Sending love from afar'}
            </span>
          </div>
        </div>
        <p className="inv-eyebrow mt-7">With love, {invitation.couple.partner_one} &amp; {invitation.couple.partner_two}</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
      {rsvp.require_guest_code ? (
        <div className="inv-card mb-5 p-5 sm:p-6">
          <p className="inv-label">Your personal invitation</p>
          {verifiedGuest ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl">Welcome, {verifiedGuest.first_name}.</p>
                <p className="mt-1 text-xs text-[var(--w-muted)]">
                  This invitation is reserved for up to {verifiedGuest.max_guests} guest
                  {verifiedGuest.max_guests === 1 ? '' : 's'}.
                  {verifiedGuest.already_responded ? ' You have already replied — submitting again will update your response.' : ''}
                </p>
              </div>
              <button
                type="button"
                className="inv-btn inv-btn--text"
                onClick={() => {
                  setVerifiedGuest(null)
                  setGuestCode('')
                  setValue('guest_name', '')
                  setValue('guest_code', '')
                }}
              >
                Use another code
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <LockKeyhole className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--w-muted)]" />
                <input
                  value={guestCode}
                  onChange={(event) => setGuestCode(event.target.value.toUpperCase())}
                  placeholder="Enter your guest code"
                  className="inv-input pl-6 uppercase tracking-[0.18em]"
                  aria-label="Guest code"
                />
              </div>
              <button type="button" onClick={() => void verifyCode()} className="inv-btn inv-btn--outline" disabled={verifying}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {verifying ? 'Checking' : 'Verify'}
              </button>
            </div>
          )}
          {codeError ? <p className="mt-2 text-xs text-[#b65b5b]">{codeError}</p> : null}
        </div>
      ) : null}

      <div className="inv-card p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="inv-label" htmlFor="guest-name">
              Your name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--w-muted)]" />
              <input
                id="guest-name"
                {...register('guest_name')}
                className="inv-input pl-6"
                placeholder="Full name"
                autoComplete="name"
              />
            </div>
            {errors.guest_name ? <p className="mt-1 text-xs text-[#b65b5b]">{errors.guest_name.message}</p> : null}
          </div>

          <div>
            <label className="inv-label" htmlFor="guest-email">
              Email {rsvp.collect_phone ? '' : '(optional)'}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--w-muted)]" />
              <input
                id="guest-email"
                type="email"
                {...register('email')}
                className="inv-input pl-6"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email ? <p className="mt-1 text-xs text-[#b65b5b]">{errors.email.message}</p> : null}
          </div>

          {rsvp.collect_phone ? (
            <div>
              <label className="inv-label" htmlFor="guest-phone">
                Phone (optional)
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--w-muted)]" />
                <input
                  id="guest-phone"
                  type="tel"
                  {...register('phone')}
                  className="inv-input pl-6"
                  placeholder="+92 300 0000000"
                  autoComplete="tel"
                />
              </div>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <p className="inv-label">Will you join us?</p>
            <input type="hidden" {...register('attendance')} />
            <div className={cn('mt-1 grid gap-2', rsvp.allow_decline ? 'sm:grid-cols-2' : '')}>
              <button
                type="button"
                onClick={() => setValue('attendance', 'attending', { shouldValidate: true })}
                className={cn(
                  'flex items-center justify-between gap-3 border px-4 py-3 text-left text-sm transition',
                  attendance === 'attending'
                    ? 'border-[var(--w-primary)] bg-[var(--w-primary)] text-[var(--w-on-primary)]'
                    : 'border-[var(--w-card-border)] bg-transparent text-[var(--w-text)] hover:border-[var(--w-primary)]/50',
                )}
                style={{ borderRadius: 'var(--w-card-radius)' }}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Joyfully accept
                </span>
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border',
                    attendance === 'attending' ? 'border-[var(--w-on-primary)]' : 'border-[var(--w-muted)]',
                  )}
                >
                  {attendance === 'attending' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                </span>
              </button>
              {rsvp.allow_decline ? (
                <button
                  type="button"
                  onClick={() => setValue('attendance', 'declined', { shouldValidate: true })}
                  className={cn(
                    'flex items-center justify-between gap-3 border px-4 py-3 text-left text-sm transition',
                    attendance === 'declined'
                      ? 'border-[var(--w-primary)] bg-[var(--w-primary)] text-[var(--w-on-primary)]'
                      : 'border-[var(--w-card-border)] bg-transparent text-[var(--w-text)] hover:border-[var(--w-primary)]/50',
                  )}
                  style={{ borderRadius: 'var(--w-card-radius)' }}
                >
                  <span>Regretfully decline</span>
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      attendance === 'declined' ? 'border-[var(--w-on-primary)]' : 'border-[var(--w-muted)]',
                    )}
                  >
                    {attendance === 'declined' ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                  </span>
                </button>
              ) : null}
            </div>
            {errors.attendance ? <p className="mt-1 text-xs text-[#b65b5b]">{errors.attendance.message}</p> : null}
          </div>

          {attendance === 'attending' ? (
            <div>
              <label className="inv-label" htmlFor="guest-count">
                Number of guests
              </label>
              <select id="guest-count" {...register('guest_count', { valueAsNumber: true })} className="inv-input">
                {Array.from({ length: Math.max(1, maxGuests) }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? 'guest' : 'guests'} (including you)
                  </option>
                ))}
              </select>
              {errors.guest_count ? <p className="mt-1 text-xs text-[#b65b5b]">{errors.guest_count.message}</p> : null}
            </div>
          ) : null}

          {questions.map((question) => (
            <div key={question.id} className={question.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label className="inv-label" htmlFor={`question-${question.id}`}>
                {question.label}
                {question.required ? ' *' : ''}
              </label>
              {question.type === 'select' ? (
                <select
                  id={`question-${question.id}`}
                  className="inv-input"
                  value={answers[question.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                >
                  <option value="">Please choose</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : question.type === 'textarea' ? (
                <textarea
                  id={`question-${question.id}`}
                  className="inv-input min-h-24 resize-y"
                  value={answers[question.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              ) : (
                <input
                  id={`question-${question.id}`}
                  className="inv-input"
                  value={answers[question.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              )}
              {answerErrors[question.id] ? (
                <p className="mt-1 text-xs text-[#b65b5b]">{answerErrors[question.id]}</p>
              ) : null}
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="inv-label" htmlFor="guest-message">
              A note for the couple (optional)
            </label>
            <textarea
              id="guest-message"
              {...register('message')}
              className="inv-input min-h-24 resize-y"
              placeholder="Share a wish, a memory or a dietary note…"
            />
          </div>
        </div>

        {submitError ? (
          <p className="mt-5 rounded-lg border border-[#b65b5b]/30 bg-[#b65b5b]/10 px-4 py-3 text-sm text-[#a34d4d]">
            {submitError}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col items-center gap-3">
          <button type="submit" className="inv-btn inv-btn--fill w-full sm:w-auto sm:min-w-64" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            {isSubmitting ? 'Sending your reply' : 'Send my RSVP'}
          </button>
          {rsvp.deadline ? (
            <p className="text-center text-[0.62rem] uppercase tracking-[0.16em] text-[var(--w-muted)]">
              Kindly reply by{' '}
              {new Date(rsvp.deadline).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  )
}
