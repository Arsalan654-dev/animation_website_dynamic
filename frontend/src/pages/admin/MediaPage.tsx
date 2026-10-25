import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Copy,
  ImagePlus,
  Images,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { api, getApiErrorMessage, getApiUsages } from '@/lib/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { assetUrl, cn, copyToClipboard, formatBytes, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { EmptyState, PageHeader, PageLoader, Spinner } from '@/components/ui/Primitives'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import type { ApiEnvelope, MediaAsset, PaginationMeta } from '@/types'

interface MediaListResponse {
  data: MediaAsset[]
  meta: PaginationMeta
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 10 * 1024 * 1024

const USAGE_LABEL: Record<string, string> = {
  invitation: 'Invitation',
  invitation_section: 'Invitation section',
  event: 'Event',
  theme: 'Theme',
  template: 'Template',
  guest: 'Guest',
  envelope: 'Envelope',
  couple_story: 'Couple story',
}

export function MediaPage() {
  useDocumentTitle('Media library — Ever After Studio')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<MediaAsset | null>(null)
  const [deleting, setDeleting] = useState<MediaAsset | null>(null)
  const [usageAsset, setUsageAsset] = useState<MediaAsset | null>(null)
  const [usages, setUsages] = useState<Array<{ type: string; id: number; label: string }>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [form, setForm] = useState({ alt_text: '', caption: '' })
  const [detailError, setDetailError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebouncedValue(search, 280)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const mediaQuery = useQuery({
    queryKey: ['media', { search: debouncedSearch, page }],
    queryFn: async () => {
      const { data } = await api.get<MediaListResponse>('/media', {
        params: { search: debouncedSearch || undefined, page },
      })
      return data
    },
  })

  const assets = mediaQuery.data?.data ?? []
  const meta = mediaQuery.data?.meta

  useEffect(() => {
    if (!detail) return
    setForm({ alt_text: detail.alt_text ?? '', caption: detail.caption ?? '' })
    setDetailError(null)
  }, [detail])

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: MediaAsset[] = []
      for (let index = 0; index < files.length; index += 1) {
        setUploadProgress({ current: index + 1, total: files.length })
        const body = new FormData()
        body.append('file', files[index])
        const { data } = await api.post<ApiEnvelope<MediaAsset>>('/media', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded.push(data.data)
      }
      return uploaded
    },
    onSuccess: (uploaded) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setPage(1)
      toast({
        title: uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`,
        description: 'They are now available everywhere in the studio.',
        tone: 'success',
      })
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), tone: 'error' })
    },
    onSettled: () => setUploadProgress(null),
  })

  const update = useMutation({
    mutationFn: async () => {
      if (!detail) throw new Error('No image selected')
      const { data } = await api.patch<ApiEnvelope<MediaAsset>>(`/media/${detail.id}`, {
        alt_text: form.alt_text || null,
        caption: form.caption || null,
      })
      return data.data
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setDetail(asset)
      toast({ title: 'Image details saved', tone: 'success' })
    },
    onError: (error) => {
      setDetailError(getApiErrorMessage(error))
      toast({ title: 'Could not save the details', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const replace = useMutation({
    mutationFn: async (file: File) => {
      if (!detail) throw new Error('No image selected')
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post<ApiEnvelope<MediaAsset>>(`/media/${detail.id}/replace`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setDetail(asset)
      toast({
        title: 'Image replaced',
        description: 'Every invitation using this image now shows the new file.',
        tone: 'success',
      })
    },
    onError: (error) => toast({ title: 'Could not replace the image', description: getApiErrorMessage(error), tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: async (asset: MediaAsset) => {
      await api.delete(`/media/${asset.id}`)
      return asset
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      if (detail?.id === asset.id) setDetail(null)
      setDeleting(null)
      toast({ title: 'Image deleted', description: asset.original_name, tone: 'success' })
    },
    onError: (error, asset) => {
      setDeleting(null)
      const found = getApiUsages(error)
      if (found.length) {
        setUsages(found)
        setUsageAsset(asset)
        return
      }
      toast({ title: 'Could not delete the image', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const acceptFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const candidates = Array.from(fileList)
    const accepted = candidates.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_BYTES)
    const rejected = candidates.length - accepted.length
    if (rejected > 0) {
      toast({
        title: `${rejected} file${rejected === 1 ? '' : 's'} skipped`,
        description: 'Use JPG, PNG, WebP or GIF images up to 10 MB.',
        tone: 'error',
      })
    }
    if (accepted.length) upload.mutate(accepted)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    acceptFiles(event.dataTransfer.files)
  }

  const copyUrl = async (asset: MediaAsset) => {
    const url = assetUrl(asset.url)
    if (!url) return
    const copied = await copyToClipboard(url)
    toast({
      title: copied ? 'Image URL copied' : 'Could not copy the URL',
      description: copied ? asset.original_name : 'Copy it from the image details instead.',
      tone: copied ? 'success' : 'error',
    })
  }

  const totalLabel = meta ? `${meta.total} image${meta.total === 1 ? '' : 's'} in the library` : 'The shared image library'

  return (
    <div>
      <PageHeader
        eyebrow="The image library"
        title={
          <>
            Media,
            <span className="block italic text-wine">every photograph in one place.</span>
          </>
        }
        description="Upload once and use an image across every invitation, theme and template. Replacing a file updates it everywhere it appears."
        actions={
          <Button
            type="button"
            onClick={() => fileInput.current?.click()}
            isLoading={upload.isPending}
            icon={<UploadCloud className="h-3.5 w-3.5" />}
          >
            Upload images
          </Button>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event) => {
          acceptFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by file name, alt text or caption"
            className="pl-9"
            aria-label="Search the media library"
          />
        </div>
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-ink/35">{totalLabel}</p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'mb-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-6 text-center transition',
          isDragging ? 'border-gold bg-gold/10' : 'border-ink/15 bg-cream/40',
        )}
      >
        {uploadProgress ? (
          <>
            <Spinner className="h-5 w-5" />
            <p className="text-sm text-ink/60">
              Uploading {uploadProgress.current} of {uploadProgress.total}…
            </p>
          </>
        ) : (
          <>
            <UploadCloud className={cn('h-5 w-5', isDragging ? 'text-gold' : 'text-ink/30')} />
            <p className="text-sm text-ink/55">
              Drop photographs here, or{' '}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="font-medium text-wine underline decoration-gold/50 underline-offset-4 hover:decoration-gold"
              >
                choose files
              </button>
            </p>
            <p className="text-[0.58rem] uppercase tracking-[0.16em] text-ink/30">
              JPG · PNG · WebP · GIF · up to 10 MB each
            </p>
          </>
        )}
      </div>

      {mediaQuery.isLoading ? (
        <PageLoader label="Opening the image library" />
      ) : mediaQuery.isError ? (
        <EmptyState
          title="The library could not be opened"
          description={getApiErrorMessage(mediaQuery.error)}
          action={<Button onClick={() => mediaQuery.refetch()}>Try again</Button>}
        />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<Images className="h-5 w-5" />}
          title={debouncedSearch ? 'No images match that search' : 'The library is waiting for its first photograph'}
          description={
            debouncedSearch
              ? 'Try a different name, alt text or caption.'
              : 'Upload the portraits, ceremony details and quiet in-between moments you want to use across the studio.'
          }
          action={
            debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear search
              </Button>
            ) : (
              <Button onClick={() => fileInput.current?.click()} icon={<ImagePlus className="h-3.5 w-3.5" />}>
                Upload your first image
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {assets.map((asset) => {
              const url = assetUrl(asset.url)
              return (
                <article
                  key={asset.id}
                  className="group overflow-hidden rounded-xl border border-ink/10 bg-cream/70 transition hover:border-ink/25 hover:shadow-lift"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(asset)}
                    className="relative block aspect-square w-full overflow-hidden bg-paper-deep text-left"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={asset.alt_text ?? asset.original_name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="absolute bottom-2 left-2 right-2 hidden items-center justify-between gap-2 text-[0.55rem] uppercase tracking-[0.12em] text-cream/80 group-hover:flex">
                      <span>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : 'Image'}</span>
                      <span>{formatBytes(asset.size)}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.65rem] font-medium text-ink/65">{asset.original_name}</p>
                      <p className="truncate text-[0.55rem] text-ink/30">{asset.alt_text || 'No alt text'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetail(asset)}
                      className="btn-icon h-7 w-7"
                      aria-label={`Edit ${asset.original_name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyUrl(asset)}
                      className="btn-icon h-7 w-7"
                      aria-label={`Copy URL for ${asset.original_name}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-4 sm:flex-row">
              <p className="text-xs text-ink/40">
                Page {meta.current_page} of {meta.last_page} · {meta.total} images
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => {
                    setPage((current) => current + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width="lg"
        title={detail ? detail.original_name : 'Image details'}
        description="Alt text and captions travel with the image into galleries and invitations."
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-[#8c2d2d] hover:bg-[#9b3434]/10"
              onClick={() => detail && setDeleting(detail)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => update.mutate()}
                isLoading={update.isPending}
                icon={<Check className="h-3.5 w-3.5" />}
              >
                Save details
              </Button>
            </div>
          </div>
        }
      >
        {detail ? (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper-deep">
              <img
                src={assetUrl(detail.url) ?? ''}
                alt={detail.alt_text ?? detail.original_name}
                className="max-h-[42vh] w-full object-contain"
              />
            </div>

            <div className="grid gap-3 rounded-xl border border-ink/10 bg-cream/50 p-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">File</p>
                <p className="mt-0.5 truncate font-medium text-ink/70">{detail.original_name}</p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Size</p>
                <p className="mt-0.5 font-medium text-ink/70">{formatBytes(detail.size)}</p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Dimensions</p>
                <p className="mt-0.5 font-medium text-ink/70">
                  {detail.width && detail.height ? `${detail.width} × ${detail.height} px` : 'Not recorded'}
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Added</p>
                <p className="mt-0.5 font-medium text-ink/70">{formatDateTime(detail.created_at)}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <Field label="Alt text" hint="Describe the image for screen readers and search.">
                <Input
                  value={form.alt_text}
                  onChange={(event) => setForm((current) => ({ ...current, alt_text: event.target.value }))}
                  placeholder="Bride and groom beneath the garden arch"
                  maxLength={250}
                />
              </Field>
              <Field label="Caption" hint="An optional line shown beneath the image in galleries.">
                <Textarea
                  rows={2}
                  value={form.caption}
                  onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                  placeholder="A quiet moment before the ceremony."
                  maxLength={250}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => replaceInput.current?.click()}
                isLoading={replace.isPending}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Replace file
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyUrl(detail)}
                icon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy image URL
              </Button>
              <input
                ref={replaceInput}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
                      toast({ title: 'That file cannot be used', description: 'Use a JPG, PNG, WebP or GIF up to 10 MB.', tone: 'error' })
                    } else {
                      replace.mutate(file)
                    }
                  }
                  event.target.value = ''
                }}
              />
            </div>

            <p className="rounded-lg border border-gold/20 bg-gold/[0.06] px-3 py-2 text-[0.65rem] leading-relaxed text-ink/50">
              Replacing the file keeps the same image record, so every invitation, theme and template using it updates
              automatically.
            </p>

            {detailError ? (
              <p className="rounded-lg border border-[#9b3434]/25 bg-[#9b3434]/10 px-3 py-2 text-xs text-[#8c2d2d]">
                {detailError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Delete this image?"
        description={`“${deleting?.original_name ?? 'This image'}” will be removed from the library. Images still used by an invitation cannot be deleted until they are removed there.`}
        confirmLabel="Delete image"
      />

      <Modal
        open={Boolean(usageAsset)}
        onClose={() => {
          setUsageAsset(null)
          setUsages([])
        }}
        title="This image is still in use"
        description={`“${usageAsset?.original_name ?? 'This image'}” appears in the items below. Remove it there first, then delete it from the library.`}
        size="md"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setUsageAsset(null)
                setUsages([])
              }}
            >
              Understood
            </Button>
          </div>
        }
      >
        <ul className="space-y-2">
          {usages.map((usage) => (
            <li
              key={`${usage.type}-${usage.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-cream/60 px-3 py-2.5 text-sm"
            >
              <span className="text-ink/65">{usage.label}</span>
              <span className="text-[0.55rem] uppercase tracking-[0.14em] text-ink/35">
                {USAGE_LABEL[usage.type] ?? usage.type.replace(/_/g, ' ')}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
