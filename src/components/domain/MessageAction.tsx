import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getOrCreateConversationWith } from '@/services/messages.service'

/** Opens (creating it if needed) the conversation with someone — what a connected person's card
 *  offers instead of a "Connected" button. Undoing a connection lives on that person's profile. */
export function MessageAction({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const navigate = useNavigate()
  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(userId),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  })

  return (
    <Button
      size={size}
      variant="soft"
      leftIcon={<MessageSquare className="size-3.5" />}
      isLoading={messageMutation.isPending}
      onClick={() => messageMutation.mutate()}
    >
      Message
    </Button>
  )
}
