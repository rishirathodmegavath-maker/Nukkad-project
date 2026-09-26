import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { createAdminEvent, listAdminResourceChapters } from '@/services/admin.service'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { PageHeader } from '@/components/domain/PageHeader'
import { PUBLISHER_IDENTITIES } from '@/lib/publisher-identities'
import { toast } from '@/store/toast.store'
import type { NukkadEvent, PublisherIdentityKey } from '@/types'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Admin-only: publish an event directly, unattributed to any member (under a platform display
 * identity) or attributed to a member by email. Create-only, deliberately no list/table here — an
 * admin-portal token cannot call the member-facing GET /api/events at all (member-scoped only, see
 * SecurityConfig), and building a separate admin listing endpoint wasn't asked for. Reading, RSVPing
 * and editing every event, admin-created or not, all continue through the existing member app.
 */
export default function AdminEventsPage() {
  const queryClient = useQueryClient()
  const { data: chapters } = useQuery({ queryKey: ['admin', 'resource-chapters'], queryFn: listAdminResourceChapters })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [online, setOnline] = useState(false)
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000)))
  const [endAt, setEndAt] = useState(() => toLocalInputValue(new Date(Date.now() + 26 * 3600 * 1000)))
  const [capacityInput, setCapacityInput] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [publisherIdentity, setPublisherIdentity] = useState<PublisherIdentityKey>('BUILDADDA')
  const [lastCreated, setLastCreated] = useState<NukkadEvent | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createAdminEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        chapterId: chapterId || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        online,
        location: online ? undefined : location.trim(),
        meetingUrl: online ? meetingUrl.trim() : undefined,
        capacity: capacityInput ? Number(capacityInput) : undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        organizerEmail: organizerEmail.trim() || undefined,
        publisherIdentity,
      }),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setLastCreated(event)
      toast.success(organizerEmail.trim() ? 'Event published — the organizer has been notified' : 'Event published — members can see it now')
      setTitle('')
      setDescription('')
      setLocation('')
      setMeetingUrl('')
      setCapacityInput('')
      setCoverImageUrl('')
      setOrganizerEmail('')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not publish this event'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Events" description="Publish an event directly — live for members immediately." />

      {lastCreated && (
        <Card className="mb-5 flex items-center gap-3 border border-success-500/30 bg-success-500/5 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-success-600" />
          <p className="text-sm text-fg">
            Published <span className="font-semibold">{lastCreated.title}</span>.
          </p>
        </Card>
      )}

      <Card className="rounded-xl border border-border/80 shadow-xs p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input label="Title" required value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Demo night, workshop, meetup…" />
          <Textarea label="Description" hint="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />

          <Select label="Chapter" hint="Optional" value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            <option value="">No chapter — platform-wide</option>
            {(chapters ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Starts" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            <Input label="Ends" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>

          <Select label="Format" value={online ? 'online' : 'in-person'} onChange={(e) => setOnline(e.target.value === 'online')}>
            <option value="in-person">In person</option>
            <option value="online">Online</option>
          </Select>

          {online ? (
            <Input label="Meeting link" required value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://…" />
          ) : (
            <Input label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue and address" />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Capacity"
              hint="Optional — leave blank for unlimited"
              type="number"
              min={1}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              placeholder="e.g. 50"
            />
            <Input label="Cover image URL" hint="Optional" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://…" />
          </div>

          <Input
            label="Organizer's email"
            hint="Optional. A member with this email becomes the organizer and is told. Leave empty to publish under the admin account."
            type="email"
            value={organizerEmail}
            maxLength={255}
            onChange={(e) => setOrganizerEmail(e.target.value)}
          />

          {!organizerEmail.trim() && (
            <Select
              label="Publisher identity"
              hint="Shown as the organizer — not a separate user, still your admin account behind it"
              value={publisherIdentity}
              onChange={(e) => setPublisherIdentity(e.target.value as PublisherIdentityKey)}
            >
              {PUBLISHER_IDENTITIES.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.label}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border/60">
            <Button type="submit" size="lg" isLoading={mutation.isPending}>
              Publish event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
