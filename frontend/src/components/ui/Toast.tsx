import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const toneClass = {
  success: 'text-[#3f6b4b]',
  error: 'text-[#9b3434]',
  info: 'text-olive',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>(
    ({ title, description, tone = 'info' }) => {
      const id = ++counter.current
      setItems((current) => [...current.slice(-3), { id, title, description, tone }])
      window.setTimeout(() => dismiss(id), 4800)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = toneIcon[item.tone]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-ink/10 bg-cream p-4 shadow-lift"
                role="status"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', toneClass[item.tone])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-full p-1 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
