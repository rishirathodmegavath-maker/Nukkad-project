import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdminChapter, updateAdminChapter, uploadAdminChapterCoverImage, uploadAdminChapterLogoImage } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { ChapterCoverField } from '@/components/domain/ChapterCoverField'
import { ChapterLogoField } from '@/components/domain/ChapterLogoField'
import { toast } from '@/store/toast.store'
import type { Chapter } from '@/types'

/**
 * Admin create/edit for a chapter. Mounted only while open, so its fields start fresh each time —
 * same convention as every other Admin*FormModal. President is real-user-only: on create it's a
 * required email that must resolve to an existing, active member (never a fake/auto-created
 * account, never the admin's own account); editing never reassigns the president — that is a
 * separate governance action, not a profile-field edit, so the field simply doesn't appear then.
 */
export function AdminChapterFormModal({ chapter, onClose }: { chapter?: Chapter; onClose: () => void }) {
  const editing = !!chapter
  const queryClient = useQueryClient()
  const [name, setName] = useState(chapter?.name ?? '')
  const [description, setDescription] = useState(chapter?.description ?? '')
  const [city, setCity] = useState(chapter?.city ?? '')
  const [country, setCountry] = useState(chapter?.country ?? '')
  const [institution, setInstitution] = useState(chapter?.institution ?? '')
  const [type, setType] = useState(chapter?.type ?? '')
  const [foundedAt, setFoundedAt] = useState(chapter?.foundedAt ?? '')
  const [focusAreas, setFocusAreas] = useState<string[]>(chapter?.focusAreas ?? [])
  const [coverImageUrl, setCoverImageUrl] = useState(chapter?.coverImageUrl ?? '')
  const [coverUploading, setCoverUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(chapter?.logoUrl ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [presidentEmail, setPresidentEmail] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const shared = {
        name: name.trim(),
        description: description.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        coverImageUrl: coverImageUrl.trim(),
        logoUrl: logoUrl.trim(),
        foundedAt: foundedAt || undefined,
        institution: institution.trim() || undefined,
        type: type.trim() || undefined,
        focusAreas,
      }
      return editing
        ? updateAdminChapter(chapter!.id, shared)
        : createAdminChapter({ ...shared, presidentEmail: presidentEmail.trim() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chapters'] })
      queryClient.invalidateQueries({ queryKey: ['chapter', chapter?.id] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success(editing ? 'Chapter updated' : 'Chapter created')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this chapter'),
  })

  const canSubmit = name.trim().length > 0 && description.trim().length > 0 && (editing || presidentEmail.trim().length > 0)

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit chapter' : 'Add chapter'} size="lg">
      <div className="flex flex-col gap-5">
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nukkad Pitch IIT Mandi" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mandi" />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" />
        </div>
        <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Institution" hint="Optional" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. IIT Mandi" />
          <Input label="Type" hint="Optional" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. University Chapter" />
        </div>
        <Input label="Founded" hint="Optional" type="date" value={foundedAt} onChange={(e) => setFoundedAt(e.target.value)} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-secondary">Focus areas</p>
          <TagInput value={focusAreas} onChange={setFocusAreas} placeholder="Add a focus area and press Enter…" maxLength={50} />
        </div>

        <ChapterCoverField value={coverImageUrl} onChange={setCoverImageUrl} onUploadingChange={setCoverUploading} uploadFn={uploadAdminChapterCoverImage} />
        <ChapterLogoField
          value={logoUrl}
          onChange={setLogoUrl}
          chapterName={name}
          onUploadingChange={setLogoUploading}
          uploadFn={uploadAdminChapterLogoImage}
        />

        {!editing && (
          <Input
            label="President's email"
            required
            hint="Must be an existing BuildAdda member — they become the chapter's real president, never a fake account."
            type="email"
            value={presidentEmail}
            maxLength={255}
            onChange={(e) => setPresidentEmail(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            isLoading={mutation.isPending}
            disabled={!canSubmit || coverUploading || logoUploading}
            onClick={() => mutation.mutate()}
          >
            {editing ? 'Save changes' : 'Create chapter'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
