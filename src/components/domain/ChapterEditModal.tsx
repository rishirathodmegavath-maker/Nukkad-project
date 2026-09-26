import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { ChapterCoverField } from '@/components/domain/ChapterCoverField'
import { ChapterLogoField } from '@/components/domain/ChapterLogoField'
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
  const [logoUrl, setLogoUrl] = useState(chapter.logoUrl ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [foundedAt, setFoundedAt] = useState(chapter.foundedAt ?? '')
  const [institution, setInstitution] = useState(chapter.institution ?? '')
  const [type, setType] = useState(chapter.type ?? '')
  const [focusAreas, setFocusAreas] = useState<string[]>(chapter.focusAreas ?? [])

  const mutation = useMutation({
    // An empty string clears the cover/logo; `undefined` would mean "leave it as it is".
    mutationFn: () =>
      updateChapter(chapter.id, {
        name,
        city,
        country,
        description,
        coverImageUrl: coverImageUrl.trim(),
        logoUrl: logoUrl.trim(),
        foundedAt: foundedAt || undefined,
        institution: institution.trim(),
        type: type.trim(),
        focusAreas,
      }),
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

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Institution" hint="Optional" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. IIT Mandi" />
          <Input label="Type" hint="Optional" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. University Chapter" />
        </div>
        <Input label="Founded" hint="Optional" type="date" value={foundedAt} onChange={(e) => setFoundedAt(e.target.value)} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Focus areas</p>
          <TagInput value={focusAreas} onChange={setFocusAreas} placeholder="Add a focus area and press Enter…" maxLength={50} />
        </div>

        <ChapterCoverField value={coverImageUrl} onChange={setCoverImageUrl} onUploadingChange={setCoverUploading} />
        <ChapterLogoField value={logoUrl} onChange={setLogoUrl} chapterName={name} onUploadingChange={setLogoUploading} />

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={coverUploading || logoUploading} onClick={() => mutation.mutate()}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
