import type { AttachmentKind, Post } from '@/types/feed'

export type MessageType = 'TEXT' | 'SHARED_POST' | 'IMAGE' | 'VIDEO' | 'PDF' | 'FILE'
export type ConversationType = 'DIRECT' | 'GROUP'
export type GroupRole = 'ADMIN' | 'MEMBER'

export interface RepliedMessagePreview {
  id: string
  senderId: string
  type: MessageType
  contentSnippet: string
}

export interface MessageAttachment {
  /** A presigned, time-limited URL (6h) — never a permanent link. Re-fetching the conversation always
   * gets a fresh one; don't cache this beyond the current page load. */
  url: string
  kind: AttachmentKind
  fileName?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  content: string
  sharedPostId?: string
  sharedPost?: Post
  attachment?: MessageAttachment
  /** Client-only, never sent by the server: the already-uploaded object's key (not a URL), kept only so
   * a failed send (the upload succeeded, the final sendMessage call didn't) can retry without uploading
   * the file a second time. */
  attachmentRef?: { key: string; kind: string; fileName?: string }
  replyToMessageId?: string
  replyTo?: RepliedMessagePreview
  createdAt: string
  isRead: boolean
  readAt?: string
  /** Set once the message has been edited; presence alone is the "Edited" indicator. */
  editedAt?: string
  /** Set once the sender has unsent this message for everyone — content/attachment are already
   * gone server-side by the time this is set, distinct from a per-viewer "delete for me". */
  unsentAt?: string
  /** Client-only, never persisted: an optimistic row still in flight, or one whose send failed. */
  pending?: boolean
  failed?: boolean
}

export interface GroupParticipant {
  userId: string
  role: GroupRole
}

export interface GroupInfo {
  name: string
  avatarUrl?: string
  createdBy: string
  myRole: GroupRole
  participants: GroupParticipant[]
}

export interface Conversation {
  id: string
  type: ConversationType
  participantIds: string[]
  group?: GroupInfo
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
  muted: boolean
  nickname?: string
  blocked: boolean
}
