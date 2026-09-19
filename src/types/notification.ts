export type NotificationType =
  | 'connection'
  | 'idea_interest'
  | 'opportunity'
  | 'event'
  | 'reply'
  | 'endorsement'
  | 'recommendation'
  | 'startup'
  | 'chapter'
  | 'investor'
  | 'wallet'
  | 'grant'
  | 'investor_activation'

export interface NukkadNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  actorUserId?: string
  isRead: boolean
  createdAt: string
}
