import { apiClient } from '@/lib/api-client'
import { mapUser, type UserDto } from '@/services/users.service'
import type { IntroDirection, IntroRequest } from '@/types'

export interface CreateIntroRequestInput {
  recipientId: string
  direction: IntroDirection
  startupId?: string
  ideaId?: string
  message: string
}

interface IntroRequestDto {
  id: string
  requesterId: string
  requester: UserDto | null
  recipientId: string
  recipient: UserDto | null
  direction: string
  startupId: string | null
  startupName: string | null
  ideaId: string | null
  ideaTitle: string | null
  message: string
  status: string
  createdAt: string
  reviewedAt: string | null
  conversationId: string | null
}

function mapIntroRequest(dto: IntroRequestDto): IntroRequest {
  return {
    id: dto.id,
    requesterId: dto.requesterId,
    requester: dto.requester ? mapUser(dto.requester) : undefined,
    recipientId: dto.recipientId,
    recipient: dto.recipient ? mapUser(dto.recipient) : undefined,
    direction: dto.direction as IntroDirection,
    startupId: dto.startupId ?? undefined,
    startupName: dto.startupName ?? undefined,
    ideaId: dto.ideaId ?? undefined,
    ideaTitle: dto.ideaTitle ?? undefined,
    message: dto.message,
    status: dto.status as IntroRequest['status'],
    createdAt: dto.createdAt,
    reviewedAt: dto.reviewedAt ?? undefined,
    conversationId: dto.conversationId ?? undefined,
  }
}

export async function createIntroRequest(input: CreateIntroRequestInput): Promise<IntroRequest> {
  return mapIntroRequest(await apiClient.post<IntroRequestDto>('/intro-requests', input))
}

export async function getIntroRequest(id: string): Promise<IntroRequest | undefined> {
  try {
    return mapIntroRequest(await apiClient.get<IntroRequestDto>(`/intro-requests/${id}`))
  } catch {
    return undefined
  }
}

export async function listIntroInbox(): Promise<IntroRequest[]> {
  const dtos = await apiClient.get<IntroRequestDto[]>('/intro-requests/inbox')
  return dtos.map(mapIntroRequest)
}

export async function listIntroSent(): Promise<IntroRequest[]> {
  const dtos = await apiClient.get<IntroRequestDto[]>('/intro-requests/sent')
  return dtos.map(mapIntroRequest)
}

export async function acceptIntroRequest(id: string): Promise<IntroRequest> {
  return mapIntroRequest(await apiClient.post<IntroRequestDto>(`/intro-requests/${id}/accept`))
}

export async function rejectIntroRequest(id: string): Promise<IntroRequest> {
  return mapIntroRequest(await apiClient.post<IntroRequestDto>(`/intro-requests/${id}/reject`))
}

export async function withdrawIntroRequest(id: string): Promise<IntroRequest> {
  return mapIntroRequest(await apiClient.post<IntroRequestDto>(`/intro-requests/${id}/withdraw`))
}
