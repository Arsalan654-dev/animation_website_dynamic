import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { MediaPicker } from '@/components/media/MediaPicker'
import { assetUrl, cn } from '@/lib/utils'
import type { MediaAsset, MediaRef } from '@/types'

interface ImageFieldProps {
  label?: string
  hint?: string
  value?: MediaRef | null
  onChange: (value: MediaRef | null) => void
  aspect?: 'square' | 'video' | 'portrait' | 'wide'
  className?: string
}

const aspectClass = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/7]',
}

export function ImageField({ label, hint, value, onChange, aspect = 'video', className }: ImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const url = assetUrl(value?.url)

  return (
    <div className={cn('min-w-0', className)}>
      {label ? <p className="admin-label">{label}</p> : null}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-dashed border-ink/20 bg-paper',
          aspectClass[aspect],
        )}
      >
        {url ? (
          <>
            <img src={url} alt={value?.alt ?? ''} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-start justify-end gap-1 bg-gradient-to-b from-ink/30 via-transparent to-transparent p-2 opacity-0 transition hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-full bg-cream/95 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink shadow transition hover:bg-cream"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition hover:bg-cream"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/35 transition hover:bg-gold/[0.06] hover:text-ink/60"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Choose image</span>
          </button>
        )}
      </div>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink/40">{hint}</p> : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(assets: MediaAsset[]) => {
          const asset = assets[0]
          if (!asset) return
          onChange({
            mediaId: asset.id,
            url: asset.url,
            alt: asset.alt_text,
            width: asset.width,
            height: asset.height,
          })
        }}
        selectedIds={[value?.mediaId]}
        title={label ? `Choose ${label.toLowerCase()}` : 'Choose an image'}
      />
    </div>
  )
}

interface GalleryFieldProps {
  label?: string
  images: Array<MediaRef & { caption?: string }>
  onChange: (images: Array<MediaRef & { caption?: string }>) => void
  hint?: string
}

export function GalleryField({ label, images, onChange, hint }: GalleryFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div>
      {label ? <p className="admin-label">{label}</p> : null}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image, index) => {
          const url = assetUrl(image.url)
          return (
            <div key={`${image.mediaId ?? 'image'}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10 bg-paper">
              {url ? <img src={url} alt={image.alt ?? ''} className="h-full w-full object-cover" /> : null}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cream/95 text-ink opacity-0 shadow transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
              <input
                value={image.caption ?? ''}
                onChange={(event) =>
                  onChange(
                    images.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, caption: event.target.value } : item,
                    ),
                  )
                }
                placeholder="Caption"
                className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-ink/60 px-1.5 py-1 text-[0.58rem] text-white placeholder:text-white/50 focus:outline-none"
              />
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink/20 text-ink/35 transition hover:border-ink/35 hover:text-ink/60"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-[0.55rem] font-semibold uppercase tracking-wider">Add</span>
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink/40">{hint}</p> : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple
        selectedIds={images.map((image) => image.mediaId)}
        onSelect={(assets) => {
          const additions = assets.map((asset) => ({
            mediaId: asset.id,
            url: asset.url,
            alt: asset.alt_text,
            caption: asset.caption ?? '',
          }))
          const merged = [...images]
          for (const addition of additions) {
            if (!merged.some((image) => image.mediaId === addition.mediaId)) merged.push(addition)
          }
          onChange(merged)
        }}
        title="Choose gallery images"
      />
    </div>
  )
}
