import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ChapterCoverField } from '@/components/domain/ChapterCoverField'
import { updateChapter } from '@/services/chapters.service'
import { toast } from '@/store/toast.store'
import type { Chapter } from '@/types'

export function ChapterEditModal({ open, onClose, chapter }: { open: boolean; onClose: () => void; chapter: Chapter }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(chapter.name)
  const [city, setCity] = useState(chapter.city)
  const [country, setCountry] = useState(chapter.country)
  const [description, setDescription] = useState(chapter.description)
  const [coverImageUrl, setCoverImageUrl] = useState(chapter.coverImageUrl ?? '')
  const [coverUploading, setCoverUploading] = useState(false)

  const mutation = useMutation({
    // An empty string clears the cover; `undefined` would mean "leave it as it is".
    mutationFn: () => updateChapter(chapter.id, { name, city, country, description, coverImageUrl: coverImageUrl.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', chapter.id] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update chapter'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit chapter" size="lg">
      <div className="flex flex-col gap-5">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

        <ChapterCoverField value={coverImageUrl} onChange={setCoverImageUrl} onUploadingChange={setCoverUploading} />

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={coverUploading} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
