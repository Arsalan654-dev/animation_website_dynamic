import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Ornament } from '@/components/invitation/Ornament'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found — Ever After Studio')

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-6 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(74,31,44,0.16)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="relative">
        <Logo />
        <p className="mt-10 font-display text-[7rem] leading-none text-wine/15">404</p>
        <h1 className="-mt-4 font-display text-4xl text-ink sm:text-5xl">This page has wandered off</h1>
        <Ornament className="mt-5 text-wine/40" />
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/55">
          The page you are looking for is not here. Perhaps the invitation has moved, or the link is incomplete.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the studio
          </Link>
          <Link to="/admin/login" className="btn-outline">
            Studio sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
