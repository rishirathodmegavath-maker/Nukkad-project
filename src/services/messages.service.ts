import { apiClient, getPage, uploadFile } from '@/lib/api-client'
import { getCurrentUserId } from '@/services/users.service'
import { mapPost, type PostDto } from '@/services/feed.service'
import type { AttachmentKind, Conversation, ConversationType, GroupRole, Message, MessageType } from '@/types'

/** What POST /conversations/{id}/attachments returns, and what sendMessage's attachment field takes —
 * a private object KEY, never a URL (unlike feed's AttachmentRef): a chat attachment has no permanent
 * public URL to hand back at upload time. */
export interface ConversationAttachmentRef {
  key: string
  kind: string
  fileName?: string
}

interface RepliedMessagePreviewDto {
  id: string
  senderId: string
  type: string
  contentSnippet: string
}

interface MessageAttachmentDto {
  url: string
  kind: string
  fileName: string | null
}

export interface MessageDto {
  id: string
  conversationId: string
  senderId: string
  type: string
  content: string
  sharedPostId: string | null
  sharedPost: PostDto | null
  attachment: MessageAttachmentDto | null
  replyToMessageId: string | null
  replyTo: RepliedMessagePreviewDto | null
  isRead: boolean
  readAt: string | null
  editedAt: string | null
  unsentAt: string | null
  createdAt: string
}

interface GroupParticipantDto {
  userId: string
  role: string
}

interface GroupInfoDto {
  name: string
  avatarUrl: string | null
  createdBy: string
  myRole: string
  participants: GroupParticipantDto[]
}

export interface ConversationDto {
  id: string
  conversationType: string
  otherUserId: string | null
  groupInfo: GroupInfoDto | null
  lastMessage: MessageDto | null
  unreadCount: number
  updatedAt: string
  muted: boolean
  nickname: string | null
  blocked: boolean
}

/** Exported so live WebSocket pushes (raw backend DTO shape) can be mapped before entering the query cache. */
export function mapMessage(dto: MessageDto): Message {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    senderId: dto.senderId,
    type: dto.type as MessageType,
    content: dto.content,
    sharedPostId: dto.sharedPostId ?? undefined,
    sharedPost: dto.sharedPost ? mapPost(dto.sharedPost) : undefined,
    attachment: dto.attachment
      ? { url: dto.attachment.url, kind: dto.attachment.kind.toLowerCase() as AttachmentKind, fileName: dto.attachment.fileName ?? undefined }
      : undefined,
    replyToMessageId: dto.replyToMessageId ?? undefined,
    replyTo: dto.replyTo
      ? { id: dto.replyTo.id, senderId: dto.replyTo.senderId, type: dto.replyTo.type as MessageType, contentSnippet: dto.replyTo.contentSnippet }
      : undefined,
    createdAt: dto.createdAt,
    isRead: dto.isRead,
    readAt: dto.readAt ?? undefined,
    editedAt: dto.editedAt ?? undefined,
    unsentAt: dto.unsentAt ?? undefined,
  }
}

/** Exported so live WebSocket pushes (raw backend DTO shape) can be mapped before entering the query cache. */
export function mapConversation(dto: ConversationDto): Conversation {
  const me = getCurrentUserId() ?? ''
  const participantIds = dto.groupInfo
    ? dto.groupInfo.participants.map((p) => p.userId)
    : [me, dto.otherUserId ?? '']
  return {
    id: dto.id,
    type: dto.conversationType as ConversationType,
    participantIds,
    group: dto.groupInfo
      ? {
          name: dto.groupInfo.name,
          avatarUrl: dto.groupInfo.avatarUrl ?? undefined,
          createdBy: dto.groupInfo.createdBy,
          myRole: dto.groupInfo.myRole as GroupRole,
          participants: dto.groupInfo.participants.map((p) => ({ userId: p.userId, role: p.role as GroupRole })),
        }
      : undefined,
    lastMessage: dto.lastMessage ? mapMessage(dto.lastMessage) : undefined,
    unreadCount: dto.unreadCount,
    updatedAt: dto.updatedAt,
    muted: dto.muted,
    nickname: dto.nickname ?? undefined,
    blocked: dto.blocked,
  }
}

export async function listConversations(): Promise<Conversation[]> {
  const dtos = await getPage<ConversationDto>('/conversations')
  return dtos.map(mapConversation)
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const conversations = await listConversations()
  return conversations.find((c) => c.id === id)
}

export async function getOrCreateConversationWith(otherUserId: string): Promise<Conversation> {
  const dto = await apiClient.post<ConversationDto>('/conversations', { otherUserId })
  return mapConversation(dto)
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const dtos = await getPage<MessageDto>(`/conversations/${conversationId}/messages`)
  return dtos.map(mapMessage)
}

export async function sendMessage(
  conversationId: string,
  content: string,
  sharedPostId?: string,
  replyToMessageId?: string,
  attachment?: ConversationAttachmentRef,
): Promise<Message> {
  const dto = await apiClient.post<MessageDto>(`/conversations/${conversationId}/messages`, {
    content,
    sharedPostId,
    replyToMessageId,
    attachment,
  })
  return mapMessage(dto)
}

/** Uploads a chat attachment and returns a ref (a private object key, never a URL) — a separate step
 * from {@link sendMessage}, matching the required "select → preview → send" flow: the file lands in
 * private storage before anything is sent, but no message exists yet until the caller actually sends.
 * The returned key is meaningless to render directly — the eventual message carries a real, presigned,
 * time-limited URL instead (see {@link mapMessage}'s attachment.url). */
export async function uploadMessageAttachment(conversationId: string, file: File): Promise<ConversationAttachmentRef> {
  return uploadFile<ConversationAttachmentRef>(`/conversations/${conversationId}/attachments`, file)
}

/** Updates the existing message's content in place — a new "Edited" indicator, not a new message. */
export async function editMessage(conversationId: string, messageId: string, content: string): Promise<Message> {
  const dto = await apiClient.patch<MessageDto>(`/conversations/${conversationId}/messages/${messageId}`, { content })
  return mapMessage(dto)
}

/** "Unsend": removes the message for everyone. Distinct from {@link hideMessageForMe} ("delete for me"), which only changes the caller's own view. */
export async function unsendMessage(conversationId: string, messageId: string): Promise<Message> {
  const dto = await apiClient.post<MessageDto>(`/conversations/${conversationId}/messages/${messageId}/unsend`)
  return mapMessage(dto)
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/read`)
}

export async function toggleMuteConversation(conversationId: string): Promise<Conversation> {
  const dto = await apiClient.patch<ConversationDto>(`/conversations/${conversationId}/mute`)
  return mapConversation(dto)
}

export async function setConversationNickname(conversationId: string, nickname: string): Promise<Conversation> {
  const dto = await apiClient.patch<ConversationDto>(`/conversations/${conversationId}/nickname`, { nickname })
  return mapConversation(dto)
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}`)
}

/** "Delete for me": hides this message from the current user's own view only — the other participant still sees it. */
export async function hideMessageForMe(conversationId: string, messageId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`)
}

/** Bulk "delete for me": hides the given messages from the current user's own view only. */
export async function hideMessagesForMe(conversationId: string, messageIds: string[]): Promise<void> {
  const query = messageIds.map((id) => `messageIds=${encodeURIComponent(id)}`).join('&')
  await apiClient.delete(`/conversations/${conversationId}/messages?${query}`)
}

export async function createGroup(name: string, memberIds: string[]): Promise<Conversation> {
  const dto = await apiClient.post<ConversationDto>('/conversations/group', { name, memberIds })
  return mapConversation(dto)
}

export async function renameGroup(conversationId: string, name: string): Promise<Conversation> {
  const dto = await apiClient.patch<ConversationDto>(`/conversations/${conversationId}/group`, { name })
  return mapConversation(dto)
}

export async function setGroupAvatar(conversationId: string, file: File): Promise<Conversation> {
  const dto = await uploadFile<ConversationDto>(`/conversations/${conversationId}/group/avatar`, file)
  return mapConversation(dto)
}

export async function addGroupMembers(conversationId: string, memberIds: string[]): Promise<Conversation> {
  const dto = await apiClient.post<ConversationDto>(`/conversations/${conversationId}/group/members`, { memberIds })
  return mapConversation(dto)
}

export async function removeGroupMember(conversationId: string, userId: string): Promise<Conversation> {
  const dto = await apiClient.delete<ConversationDto>(`/conversations/${conversationId}/group/members/${userId}`)
  return mapConversation(dto)
}

export async function leaveGroup(conversationId: string): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/group/leave`)
}

export async function updateGroupRole(conversationId: string, userId: string, role: GroupRole): Promise<Conversation> {
  const dto = await apiClient.patch<ConversationDto>(`/conversations/${conversationId}/group/members/${userId}/role`, { role })
  return mapConversation(dto)
}
