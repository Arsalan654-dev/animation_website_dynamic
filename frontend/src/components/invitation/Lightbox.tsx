import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { assetUrl } from '@/lib/utils'
import type { GalleryImage } from '@/types'

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const open = index !== null
  const image = index !== null ? images[index] : null

  const next = useCallback(() => {
    if (index === null) return
    onNavigate((index + 1) % images.length)
  }, [index, images.length, onNavigate])

  const previous = useCallback(() => {
    if (index === null) return
    onNavigate((index - 1 + images.length) % images.length)
  }, [index, images.length, onNavigate])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') previous()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose, next, previous])

  return createPortal(
    <AnimatePresence>
      {open && image ? (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-[#100c0a]/96 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
        >
          <div className="flex items-center justify-between px-4 py-4 text-white/70 sm:px-6">
            <span className="text-[0.62rem] uppercase tracking-[0.2em]">
              {(index ?? 0) + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-white/10 hover:text-white"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            {images.length > 1 ? (
              <button
                type="button"
                onClick={previous}
                className="absolute left-2 z-10 rounded-full border border-white/15 bg-black/20 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:left-5"
                aria-label="Previous photograph"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}

            <motion.img
              key={image.url}
              src={assetUrl(image.url) ?? ''}
              alt={image.alt ?? image.caption ?? 'Wedding photograph'}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="max-h-[74vh] max-w-full object-contain shadow-2xl"
            />

            {images.length > 1 ? (
              <button
                type="button"
                onClick={next}
                className="absolute right-2 z-10 rounded-full border border-white/15 bg-black/20 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:right-5"
                aria-label="Next photograph"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {image.caption ? (
            <p className="pb-7 text-center font-display text-lg italic text-white/65">{image.caption}</p>
          ) : (
            <div className="pb-7" />
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
