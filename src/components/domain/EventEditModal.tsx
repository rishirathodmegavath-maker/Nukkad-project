import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateEvent } from '@/services/events.service'
import { toast } from '@/store/toast.store'
import type { NukkadEvent } from '@/types'

function toLocalInputValue(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventEditModal({ open, onClose, event }: { open: boolean; onClose: () => void; event: NukkadEvent }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [isOnline, setIsOnline] = useState(event.isOnline)
  const [location, setLocation] = useState(event.location)
  const [meetingUrl, setMeetingUrl] = useState(event.meetingUrl ?? '')
  const [startAt, setStartAt] = useState(toLocalInputValue(event.startAt))
  const [endAt, setEndAt] = useState(toLocalInputValue(event.endAt))
  const [capacityInput, setCapacityInput] = useState(event.capacity ? String(event.capacity) : '')
  const [coverImageUrl, setCoverImageUrl] = useState(event.coverImageUrl ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      updateEvent(event.id, {
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isOnline,
        location: isOnline ? undefined : location,
        meetingUrl: isOnline ? meetingUrl : undefined,
        capacity: capacityInput ? Number(capacityInput) : undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event updated')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update event'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit event" size="lg">
      <div className="flex flex-col gap-5">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Starts" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Input label="Ends" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>

        <Select label="Format" value={isOnline ? 'online' : 'in-person'} onChange={(e) => setIsOnline(e.target.value === 'online')}>
          <option value="in-person">In person</option>
          <option value="online">Online</option>
        </Select>

        {isOnline ? (
          <Input label="Meeting link" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://…" />
        ) : (
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue and address" />
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

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
