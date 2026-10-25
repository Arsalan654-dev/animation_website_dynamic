import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ImagePlus, Search, UploadCloud } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, Spinner } from '@/components/ui/Primitives'
import { assetUrl, cn, formatBytes } from '@/lib/utils'
import type { ApiEnvelope, MediaAsset, PaginationMeta } from '@/types'

interface MediaListResponse {
  data: MediaAsset[]
  meta: PaginationMeta
}

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (assets: MediaAsset[]) => void
  multiple?: boolean
  selectedIds?: Array<number | null | undefined>
  title?: string
  description?: string
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  selectedIds = [],
  title,
  description,
}: MediaPickerProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<MediaAsset[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebouncedValue(search, 250)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setSearch('')
    setPage(1)
    const initial = new Set(selectedIds.filter((id): id is number => typeof id === 'number'))
    setSelected((current) => current.filter((asset) => initial.has(asset.id)))
    // Only reset when the picker opens; selection changes should persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const mediaQuery = useQuery({
    queryKey: ['media', { search: debouncedSearch, page }],
    queryFn: async () => {
      const { data } = await api.get<MediaListResponse>('/media', {
        params: { search: debouncedSearch || undefined, page },
      })
      return data
    },
    enabled: open,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ApiEnvelope<MediaAsset>>('/media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast({ title: 'Image uploaded', description: asset.original_name, tone: 'success' })
      if (multiple) {
        setSelected((current) => [...current, asset])
      } else {
        onSelect([asset])
        onClose()
      }
    },
    onError: (error) => {
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const toggle = (asset: MediaAsset) => {
    if (!multiple) {
      onSelect([asset])
      onClose()
      return
    }
    setSelected((current) =>
      current.some((item) => item.id === asset.id)
        ? current.filter((item) => item.id !== asset.id)
        : [...current, asset],
    )
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) uploadMutation.mutate(file)
  }

  const assets = mediaQuery.data?.data ?? []
  const meta = mediaQuery.data?.meta

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (multiple ? 'Choose images' : 'Choose an image')}
      description={description ?? 'Select from your studio library or upload something new.'}
      size="xl"
      footer={
        multiple ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink/50">
              {selected.length ? `${selected.length} image${selected.length === 1 ? '' : 's'} selected` : 'Select one or more images'}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSelect(selected)
                  onClose()
                }}
                disabled={selected.length === 0}
                type="button"
              >
                Add selected
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink/45">Click an image to use it. Uploads are added to the shared library.</p>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search by file name or alt text"
              className="pl-9"
              aria-label="Search media"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            isLoading={uploadMutation.isPending}
            icon={<UploadCloud className="h-3.5 w-3.5" />}
          >
            Upload image
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) uploadMutation.mutate(file)
              event.target.value = ''
            }}
          />
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-xl border border-dashed px-4 py-3 text-center text-xs transition',
            isDragging ? 'border-gold bg-gold/10 text-ink' : 'border-ink/15 text-ink/40',
          )}
        >
          {uploadMutation.isPending ? 'Uploading your image…' : 'Drop an image here to upload, or use the button above.'}
        </div>

        {mediaQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : mediaQuery.isError ? (
          <p className="rounded-lg bg-[#9b3434]/10 p-4 text-sm text-[#8c2d2d]">{getApiErrorMessage(mediaQuery.error)}</p>
        ) : assets.length === 0 ? (
          <EmptyState
            icon={<ImagePlus className="h-5 w-5" />}
            title="The library is waiting"
            description="Upload your first photograph and it will be available across every invitation."
            action={
              <Button onClick={() => fileInput.current?.click()} size="sm">
                Upload an image
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {assets.map((asset) => {
              const isSelected = selected.some((item) => item.id === asset.id)
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggle(asset)}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border bg-paper text-left transition',
                    isSelected ? 'border-gold ring-2 ring-gold/40' : 'border-ink/10 hover:border-ink/25',
                  )}
                >
                  <div className="aspect-square overflow-hidden bg-paper-deep">
                    <img
                      src={assetUrl(asset.url) ?? ''}
                      alt={asset.alt_text ?? asset.original_name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                    <p className="min-w-0 truncate text-[0.65rem] font-medium text-ink/60">{asset.original_name}</p>
                    <span className="shrink-0 text-[0.58rem] text-ink/30">{formatBytes(asset.size)}</span>
                  </div>
                  {isSelected ? (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-ink shadow">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {meta && meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-xs text-ink/45">
            <span>
              Page {meta.current_page} of {meta.last_page} · {meta.total} images
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
