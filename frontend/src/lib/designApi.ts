import { api } from '@/lib/api'
import type {
  ApiEnvelope,
  DesignSnapshot,
  InvitationDesign,
  InvitationDesignSummary,
  InvitationDesignVersion,
  PaginationMeta,
} from '@/types'

interface VersionListResponse {
  data: InvitationDesignVersion[]
  meta: PaginationMeta
}

export async function fetchInvitationDesigns(invitationId: number): Promise<InvitationDesignSummary[]> {
  const { data } = await api.get<ApiEnvelope<InvitationDesignSummary[]>>(`/invitations/${invitationId}/designs`)
  return data.data
}

export async function fetchInvitationDesign(
  invitationId: number,
  designId: number,
): Promise<InvitationDesign> {
  const { data } = await api.get<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}`,
  )
  return data.data
}

export async function createInvitationDesign(
  invitationId: number,
  payload: { name?: string; description?: string | null; snapshot?: DesignSnapshot },
): Promise<InvitationDesign> {
  const { data } = await api.post<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs`,
    payload,
  )
  return data.data
}

export async function updateInvitationDesign(
  invitationId: number,
  designId: number,
  payload: { name?: string; description?: string | null; snapshot?: DesignSnapshot; label?: string; apply?: boolean },
): Promise<InvitationDesign> {
  const { data } = await api.patch<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}`,
    payload,
  )
  return data.data
}

export async function activateInvitationDesign(
  invitationId: number,
  designId: number,
): Promise<InvitationDesign> {
  const { data } = await api.post<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}/activate`,
  )
  return data.data
}

export async function saveCurrentInvitationAsDesign(
  invitationId: number,
  designId: number,
): Promise<InvitationDesign> {
  const { data } = await api.post<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}/save-current`,
  )
  return data.data
}

export async function duplicateInvitationDesign(
  invitationId: number,
  designId: number,
): Promise<InvitationDesign> {
  const { data } = await api.post<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}/duplicate`,
  )
  return data.data
}

export async function deleteInvitationDesign(invitationId: number, designId: number): Promise<void> {
  await api.delete(`/invitations/${invitationId}/designs/${designId}`)
}

export async function fetchDesignVersions(
  invitationId: number,
  designId: number,
  includeSnapshot = false,
): Promise<VersionListResponse> {
  const { data } = await api.get<VersionListResponse>(
    `/invitations/${invitationId}/designs/${designId}/versions`,
    { params: includeSnapshot ? { include_snapshot: 1 } : undefined },
  )
  return data
}

export async function restoreDesignVersion(
  invitationId: number,
  designId: number,
  versionId: number,
): Promise<InvitationDesign> {
  const { data } = await api.post<ApiEnvelope<InvitationDesign>>(
    `/invitations/${invitationId}/designs/${designId}/versions/${versionId}/restore`,
  )
  return data.data
}

export async function fetchDesignLibrary(params?: {
  search?: string
  active?: boolean
  invitation_id?: number
  page?: number
}): Promise<{ data: InvitationDesignSummary[]; meta: PaginationMeta }> {
  const { data } = await api.get<{ data: InvitationDesignSummary[]; meta: PaginationMeta }>('/designs', {
    params,
  })
  return data
}

export async function downloadDesignExport(
  invitationId: number,
  designId: number,
  filename: string,
): Promise<void> {
  const response = await api.get(`/invitations/${invitationId}/designs/${designId}/export`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data as Blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function designExportUrl(invitationId: number, designId: number): string {
  return `${api.defaults.baseURL}/invitations/${invitationId}/designs/${designId}/export`
}
