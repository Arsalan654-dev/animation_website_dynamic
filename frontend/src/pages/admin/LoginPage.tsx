import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { loginSchema, type LoginValues } from '@/lib/validation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Logo } from '@/components/layout/Logo'
import { Ornament } from '@/components/invitation/Ornament'
import { useToast } from '@/components/ui/Toast'
import { assetUrl } from '@/lib/utils'

export function LoginPage() {
  useDocumentTitle('Studio sign in — Ever After Studio')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const target = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard'

  if (user) {
    return <Navigate to={target} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values.email, values.password)
      toast({ title: 'Welcome back', description: 'The studio is ready for you.', tone: 'success' })
      navigate(target, { replace: true })
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors.email) {
        setError('email', { message: fieldErrors.email })
      } else {
        setServerError(getApiErrorMessage(error))
      }
    }
  })

  const cover = assetUrl('/demo/portrait-two.jpg')

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-wine-deep lg:block">
        {cover ? (
          <img src={cover} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0c12]/95 via-[#2b1119]/55 to-[#1b0c12]/40" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo tone="light" />
          <div className="max-w-md">
            <Ornament className="justify-start text-gold/70" width={110} />
            <blockquote className="mt-7 font-display text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.08] text-cream">
              “A wedding invitation is the first page of a story your guests get to step inside.”
            </blockquote>
            <p className="mt-6 text-[0.6rem] uppercase tracking-[0.28em] text-cream/40">The Ever After studio</p>
          </div>
          <p className="text-[0.55rem] uppercase tracking-[0.24em] text-cream/25">
            Compose · Publish · Welcome every reply
          </p>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink/40 transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Public site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-14 sm:px-10">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="admin-eyebrow">Welcome back</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
              Sign in to your
              <span className="block italic text-wine">invitation atelier.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink/50">
              Your invitations, themes, guest list and RSVPs are waiting exactly where you left them.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="admin-label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="admin-input pl-10"
                    placeholder="you@studio.com"
                    {...register('email')}
                  />
                </div>
                {errors.email ? <p className="mt-1.5 text-xs text-[#9b3434]">{errors.email.message}</p> : null}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="admin-label">
                    Password
                  </label>
                  <span className="mb-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-ink/30">Token secured</span>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="admin-input pl-10 pr-11"
                    placeholder="Your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1.5 text-xs text-[#9b3434]">{errors.password.message}</p> : null}
              </div>

              {serverError ? (
                <p className="rounded-lg border border-[#9b3434]/20 bg-[#9b3434]/[0.07] px-4 py-3 text-xs leading-relaxed text-[#8c2d2d]">
                  {serverError}
                </p>
              ) : null}

              <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
                {isSubmitting ? 'Opening the studio…' : 'Enter the studio'}
                {!isSubmitting ? <ArrowRight className="h-3.5 w-3.5" /> : null}
              </button>

              {import.meta.env.DEV ? (
                <div className="rounded-xl border border-gold/25 bg-gold/[0.07] px-4 py-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#836426]">Local demo account</p>
                  <p className="mt-1.5 font-mono text-[0.68rem] text-ink/60">admin@everafter.test · EverAfter!2026</p>
                  <p className="mt-1 text-[0.62rem] leading-relaxed text-ink/40">
                    Seeded only in local and testing environments. Production uses <code>php artisan app:create-admin</code>.
                  </p>
                </div>
              ) : null}
            </form>

            <p className="mt-8 text-center text-[0.62rem] leading-relaxed text-ink/35">
              Sessions are protected with a Sanctum bearer token and expire after twelve hours.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
