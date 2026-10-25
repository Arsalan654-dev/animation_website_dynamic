import type { MediaAsset, MediaRef } from '@/types'

export function mediaAssetMap(assets?: MediaAsset[] | null): Map<number, MediaAsset> {
  return new Map((assets ?? []).map((asset) => [asset.id, asset]))
}

export function resolveMediaRef(
  map: Map<number, MediaAsset>,
  ref?: MediaRef | null,
): MediaRef | null {
  if (!ref) return null
  const mediaId = typeof ref.mediaId === 'number' ? ref.mediaId : null
  const asset = mediaId ? map.get(mediaId) : null
  if (!asset && !ref.url) return null
  return {
    ...ref,
    mediaId,
    url: ref.url ?? asset?.url ?? undefined,
    alt: ref.alt ?? asset?.alt_text ?? null,
  }
}

export function mediaIdFromContentId(map: Map<number, MediaAsset>, id?: number | null): MediaRef | null {
  if (!id) return null
  const asset = map.get(id)
  if (!asset) return null
  return { mediaId: id, url: asset.url, alt: asset.alt_text, width: asset.width, height: asset.height }
}
