import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Textarea, Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createDiscussion } from '@/services/discussions.service'
import { DISCUSSION_TOPICS } from '@/lib/discussionTopicMeta'
import { toast } from '@/store/toast.store'
import type { PostVisibility } from '@/types'

/**
 * A focused composer for a discussion: topic + text + an optional link, rather than the full
 * kind-tile/attachment picker CreatePostModal uses for every other post type — Discussions is the
 * one kind that now has its own dedicated fields (a topic) the generic composer never had.
 */
export function CreateDiscussionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC')

  function reset() {
    setContent('')
    setTopic('')
    setLinkUrl('')
    setVisibility('PUBLIC')
  }

  const mutation = useMutation({
    mutationFn: () => createDiscussion({ content: content.trim(), topic: topic || undefined, linkUrl: linkUrl.trim() || undefined, visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
      toast.success('Discussion started')
      reset()
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not start this discussion'),
  })

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Start a new discussion"
      description="Ask a question, share an opinion, or start a conversation."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!content.trim()} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Post discussion
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Textarea
          label="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Which approach would you choose for an early-stage startup, and why?"
          autoFocus
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Topic" hint="Optional" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">General</option>
            {DISCUSSION_TOPICS.filter((t) => t.topic !== 'GENERAL').map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.label}
              </option>
            ))}
          </Select>
          <Select label="Who can see this" value={visibility} onChange={(e) => setVisibility(e.target.value as PostVisibility)}>
            <option value="PUBLIC">Public</option>
            <option value="CONNECTIONS">Connections only</option>
          </Select>
        </div>
        <Input label="Link" hint="Optional" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
      </div>
    </Modal>
  )
}
