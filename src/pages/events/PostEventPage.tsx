import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/domain/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getChapter } from '@/services/chapters.service'
import { createEvent } from '@/services/events.service'
import { toast } from '@/store/toast.store'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function PostEventPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const chapterId = searchParams.get('chapterId') ?? undefined

  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => getChapter(chapterId!),
    enabled: !!chapterId,
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000)))
  const [endAt, setEndAt] = useState(() => toLocalInputValue(new Date(Date.now() + 26 * 3600 * 1000)))
  const [capacityInput, setCapacityInput] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createEvent({
        title,
        description: description || undefined,
        chapterId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isOnline,
        location: isOnline ? undefined : location,
        meetingUrl: isOnline ? meetingUrl : undefined,
        capacity: capacityInput ? Number(capacityInput) : undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      }),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      if (chapterId) queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] })
      toast.success('Event created')
      navigate(`/events/${event.id}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create event'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (userLoading || chapterLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const isPresidentOfThisChapter = !!chapter && !!currentUser && chapter.presidentUserId === currentUser.id
  const allowed = chapterId ? isPresidentOfThisChapter : !!currentUser

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Create an event" />
        <EmptyState
          title="You can't create this event"
          description="Only this chapter's president can create events for it."
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Create an event"
        description={chapterId ? `For ${chapter?.name}` : 'Host your own meet or meetup — open to anyone.'}
      />
      <Card className="rounded-2xl border border-border/80 shadow-sm p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Demo night, workshop, meetup…"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should people expect?"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Starts" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            <Input label="Ends" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>

          <Select label="Format" value={isOnline ? 'online' : 'in-person'} onChange={(e) => setIsOnline(e.target.value === 'online')}>
            <option value="in-person">In person</option>
            <option value="online">Online</option>
          </Select>

          {isOnline ? (
            <Input
              label="Meeting link"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://…"
            />
          ) : (
            <Input label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue and address" />
          )}

          <Input
            label="Capacity"
            hint="Leave blank for unlimited"
            type="number"
            min={1}
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            placeholder="e.g. 50"
          />

          <Input
            label="Cover image URL"
            hint="Optional"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://…"
          />

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" isLoading={mutation.isPending}>
              Create event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
