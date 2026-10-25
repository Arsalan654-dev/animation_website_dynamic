import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96rem,calc(100vw-2rem))]',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  className?: string
  contentClassName?: string
  hideClose?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  contentClassName,
  hideClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Dialog'}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-lift sm:max-h-[calc(100dvh-3rem)]',
              sizeClass[size],
              className,
            )}
          >
            {title || !hideClose ? (
              <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  {title ? <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2> : null}
                  {description ? <p className="mt-1 text-xs leading-relaxed text-ink/50">{description}</p> : null}
                </div>
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-icon -mr-1 -mt-1 shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </header>
            ) : null}
            <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', contentClassName)}>{children}</div>
            {footer ? <footer className="border-t border-ink/10 bg-cream/50 px-5 py-3 sm:px-6">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
