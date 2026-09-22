import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronUp, FileText, Globe, Image, Link2, Plus, Send, Smile, Users, Video, X } from 'lucide-react'
import { createAdminPost, uploadAdminPostAttachment, type AdminCreatePostInput } from '@/services/admin.service'
import type { AttachmentRef } from '@/services/feed.service'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { UploadButton, UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { EmojiPicker } from '@/components/domain/EmojiPicker'
import { PostLinkCard } from '@/components/domain/PostLinkCard'
import { DocumentIcon } from '@/components/domain/DocumentIcon'
import { attachmentKindOf, FILE_ACCEPT, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, MEDIA_ACCEPT, UNSUPPORTED_FILE_MESSAGE } from '@/lib/attachments'
import { normalizeLink } from '@/lib/links'
import { generalPostKind, mainPostKinds, morePostKinds, postKind, type PostKind } from '@/lib/postTypeMeta'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast.store'
import type { AttachmentKind, PostType, PostVisibility } from '@/types'

/** The server's limit on a post's text (matches CreatePostRequest.content, same as the member composer). */
const MAX_CONTENT = 4000

interface PendingFile {
  file: File
  kind: AttachmentKind
  previewUrl?: string
}

function revokePreview(file: PendingFile) {
  if (file.previewUrl) URL.revokeObjectURL(file.previewUrl)
}

const TOOLBAR_BUTTON =
  'flex h-9 items-center justify-center gap-1.5 rounded-lg bg-surface-sunken/70 px-3 text-xs font-semibold text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-60'

function KindTile({ kind, selected, onSelect }: { kind: PostKind; selected: boolean; onSelect: () => void }) {
  const Icon = kind.icon
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-150 cursor-pointer',
        selected
          ? 'border-brand-500 bg-brand-500/10 shadow-xs ring-1 ring-brand-500/40'
          : 'border-border/80 bg-surface hover:border-border-strong hover:bg-surface-hover',
      )}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-600 text-white">
          <Check className="size-3" aria-hidden="true" />
        </span>
      )}
      <span className={cn('flex size-9 items-center justify-center rounded-xl', kind.tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-[13px] font-bold leading-tight text-fg">{kind.label}</span>
      <span className="text-xs leading-tight text-fg-muted">{kind.blurb}</span>
    </button>
  )
}

/**
 * Admin-only version of the member "Create a Post" dialog (CreatePostModal.tsx) — same kind tiles,
 * composer, emoji picker, photo/video/file attachments, link and visibility, built from the same
 * shared utilities and components (postTypeMeta, EmojiPicker, PostLinkCard, the attachment helpers).
 * What's different: it posts through the admin-scoped endpoints (createAdminPost /
 * uploadAdminPostAttachment) instead of the member ones — an admin token can't call the member
 * endpoints — and it adds an optional "post as" member email, mirroring AdminStartupFormModal's
 * founderEmail: with it, that member becomes the author and is told; without it, the admin's own
 * account is the author. Unlike the member dialog: no draft-persists-across-close behavior (it always
 * starts fresh), no visibility-silently-ignored rollback check (this backend already honors it), and
 * no kind.help nudge ("post the full idea", "create the event") — those route to member-only
 * creation pages that don't fit an admin posting on someone else's behalf.
 */
export function AdminPostFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<PostType>('text')
  const [showMore, setShowMore] = useState(false)
  const [content, setContent] = useState('')
  const [pending, setPending] = useState<PendingFile[]>([])
  const [link, setLink] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')
  const [linkError, setLinkError] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [authorEmail, setAuthorEmail] = useState('')
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const kind = type === 'text' ? generalPostKind : postKind(type)
  const canPostText = content.trim().length > 0 || pending.length > 0 || link !== null || linkDraft.trim().length > 0

  const postMutation = useMutation({
    mutationFn: async (linkUrl: string | null) => {
      const attachments: AttachmentRef[] = await Promise.all(pending.map((p) => uploadAdminPostAttachment(p.file)))
      const input: AdminCreatePostInput = {
        content: content.trim(),
        type,
        attachments,
        visibility,
        linkUrl: linkUrl ?? undefined,
        authorEmail: authorEmail.trim() || undefined,
      }
      return createAdminPost(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      pending.forEach(revokePreview)
      setPhase('done')
      toast.success(authorEmail.trim() ? 'Post added — the author has been notified' : 'Posted — members can see it now')
      setTimeout(onClose, 600)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not create this post')
      setPhase('idle')
    },
  })

  function commitLinkDraft() {
    const typed = linkDraft.trim()
    if (!typed) return
    const normalized = normalizeLink(typed)
    if (!normalized) {
      setLinkError('Enter a valid link, like https://example.com')
      return
    }
    setLink(normalized)
    setLinkDraft('')
    setLinkError('')
    setLinkOpen(false)
  }

  function handlePost() {
    let linkUrl = link
    if (linkDraft.trim()) {
      linkUrl = normalizeLink(linkDraft)
      if (!linkUrl) {
        setLinkError('Enter a valid link, like https://example.com')
        return
      }
    }
    setPhase('uploading')
    postMutation.mutate(linkUrl)
  }

  function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files ?? [])
    e.target.value = ''
    const accepted: PendingFile[] = []
    let unsupported = 0
    let tooBig = 0
    for (const file of all) {
      const kindOfFile = attachmentKindOf(file)
      if (!kindOfFile) unsupported++
      else if (file.size > MAX_ATTACHMENT_BYTES) tooBig++
      else accepted.push({ file, kind: kindOfFile, previewUrl: kindOfFile === 'image' ? URL.createObjectURL(file) : undefined })
    }
    if (unsupported > 0) {
      toast.error(unsupported === 1 ? UNSUPPORTED_FILE_MESSAGE : `${unsupported} files were skipped. ${UNSUPPORTED_FILE_MESSAGE}`)
    }
    if (tooBig > 0) {
      toast.error(tooBig === 1 ? 'That file is over 50 MB. Attach a smaller one, or add a link instead.' : `${tooBig} files were over 50 MB and were skipped.`)
    }
    if (accepted.length === 0) return
    const room = MAX_ATTACHMENTS - pending.length
    if (accepted.length > room) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files`)
      accepted.slice(room).forEach(revokePreview)
    }
    setPending((prev) => [...prev, ...accepted.slice(0, Math.max(room, 0))])
  }

  function removeFile(index: number) {
    const removed = pending[index]
    if (removed) revokePreview(removed)
    setPending((prev) => prev.filter((_, i) => i !== index))
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    const start = el?.selectionStart ?? content.length
    const end = el?.selectionEnd ?? content.length
    const next = content.slice(0, start) + emoji + content.slice(end)
    if (next.length > MAX_CONTENT) return
    setContent(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  function pickKind(key: PostType) {
    setType((current) => (current === key ? 'text' : key))
  }

  const busy = postMutation.isPending

  return (
    <Modal open onClose={onClose} size="xl" title="Add a post" description="Publish a post to the Feed directly, on behalf of BuildAdda or a member.">
      <div className="flex flex-col gap-4">
        <Input
          label="Post as (member's email)"
          hint="Optional. That member becomes the author and is told. Leave empty to post under the admin account."
          type="email"
          value={authorEmail}
          maxLength={255}
          onChange={(e) => setAuthorEmail(e.target.value)}
        />

        <div role="group" aria-label="Post type" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {mainPostKinds.map((k) => (
            <KindTile key={k.key} kind={k} selected={type === k.key} onSelect={() => pickKind(k.key)} />
          ))}
        </div>

        {showMore && (
          <div role="group" aria-label="More post types" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {morePostKinds.map((k) => (
              <KindTile key={k.key} kind={k} selected={type === k.key} onSelect={() => pickKind(k.key)} />
            ))}
          </div>
        )}

        <button
          type="button"
          aria-expanded={showMore}
          onClick={() => setShowMore((v) => !v)}
          className="flex flex-col items-center gap-0.5 rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-2.5 text-center transition-colors hover:bg-brand-500/10 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-brand">
            {showMore ? <ChevronUp className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {showMore ? 'Fewer options' : 'More options'}
          </span>
          {!showMore && <span className="text-xs text-fg-muted">Resource, Hiring, Fundraising, Product Launch, Event</span>}
        </button>

        <div className="border-t border-border/70" />

        <div className="relative">
          <textarea
            ref={textareaRef}
            id="admin-create-post-text"
            name="admin-create-post-text"
            aria-label={kind.key === 'text' ? 'Post text' : `${kind.label} post text`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_CONTENT}
            rows={4}
            placeholder={kind.placeholder}
            className="w-full resize-none rounded-xl border border-border/80 bg-surface-sunken/40 px-4 py-3 pr-11 text-sm leading-relaxed text-fg outline-none transition-all placeholder:text-fg-muted focus:border-brand-500 focus:bg-surface focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="button"
            data-emoji-trigger
            aria-label="Add emoji"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((v) => !v)}
            className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
          >
            <Smile className="size-5" />
          </button>
          {emojiOpen && <EmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />}
          {content.length > MAX_CONTENT * 0.9 && (
            <p className="mt-1 text-right text-xs tabular-nums text-fg-muted">
              {content.length} of {MAX_CONTENT}
            </p>
          )}
        </div>

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {pending.map((p, i) => (
              <div key={`${p.file.name}-${i}`} className="group relative size-18 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-sunken shadow-2xs">
                {p.previewUrl ? (
                  <img src={p.previewUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-1 bg-surface-sunken p-1 text-center">
                    {p.kind === 'video' ? <Video className="size-5 text-fg-brand" /> : <DocumentIcon fileName={p.file.name} className="size-5 text-accent-500" />}
                    <span className="w-full truncate px-1 text-xs font-medium text-fg-muted">{p.file.name}</span>
                  </div>
                )}
                <UploadSpinnerOverlay phase={phase} />
                {phase === 'idle' && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-neutral-900/80 text-white shadow-xs transition-colors hover:bg-neutral-900 cursor-pointer"
                    aria-label={`Remove ${p.file.name}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {link && <PostLinkCard url={link} onRemove={() => setLink(null)} />}

        {linkOpen && !link && (
          <div>
            <div className="flex items-center gap-2">
              <input
                id="admin-create-post-link"
                name="admin-create-post-link"
                type="url"
                inputMode="url"
                autoFocus
                aria-label="Link to add"
                aria-invalid={linkError ? true : undefined}
                value={linkDraft}
                onChange={(e) => {
                  setLinkDraft(e.target.value)
                  setLinkError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitLinkDraft()
                  }
                }}
                placeholder="Paste a link, like https://example.com"
                className={cn(
                  'h-10 min-w-0 flex-1 rounded-lg border bg-surface px-3.5 text-sm text-fg outline-none transition-all placeholder:text-fg-muted focus:ring-2',
                  linkError ? 'border-danger-500 focus:ring-danger-500/20' : 'border-border focus:border-brand-500 focus:ring-brand-500/20',
                )}
              />
              <button type="button" onClick={commitLinkDraft} disabled={!linkDraft.trim()} className={cn(TOOLBAR_BUTTON, 'h-10')}>
                Add link
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkOpen(false)
                  setLinkDraft('')
                  setLinkError('')
                }}
                aria-label="Cancel adding a link"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            {linkError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-danger-500">
                {linkError}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={TOOLBAR_BUTTON} onClick={() => mediaInputRef.current?.click()} disabled={busy} aria-label="Add photo or video">
            <Image className="size-4 text-fg-brand" aria-hidden="true" />
            Add Photo
          </button>
          <button
            type="button"
            className={TOOLBAR_BUTTON}
            onClick={() => setLinkOpen((v) => !v)}
            disabled={busy || link !== null}
            aria-expanded={linkOpen}
            aria-label="Add a link"
          >
            <Link2 className="size-4 text-fg-brand" aria-hidden="true" />
            Add Link
          </button>
          <button type="button" className={TOOLBAR_BUTTON} onClick={() => fileInputRef.current?.click()} disabled={busy} aria-label="Add a file (PDF, Word, PowerPoint or Excel)">
            <FileText className="size-4 text-accent-500" aria-hidden="true" />
            Add File
          </button>
          <input ref={mediaInputRef} type="file" id="admin-create-post-media" name="admin-create-post-media" accept={MEDIA_ACCEPT} multiple hidden onChange={addFiles} />
          <input ref={fileInputRef} type="file" id="admin-create-post-file" name="admin-create-post-file" accept={FILE_ACCEPT} multiple hidden onChange={addFiles} />

          <div className="relative ml-auto">
            {visibility === 'PUBLIC' ? (
              <Globe className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
            ) : (
              <Users className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
            )}
            <Select
              aria-label="Who can see this post"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="h-9 w-40 py-0 pl-9 text-xs font-semibold"
            >
              <option value="PUBLIC">Public</option>
              <option value="CONNECTIONS">Connections</option>
            </Select>
          </div>
        </div>

        <p className="-mt-1 text-xs text-fg-muted">
          {visibility === 'PUBLIC' ? 'Anyone on BuildAdda can see this post.' : 'Only the author and their connections can see this post.'}
        </p>

        <div className="flex justify-end">
          <UploadButton
            size="md"
            phase={phase}
            idleLabel="Post"
            leftIcon={phase === 'idle' ? <Send className="size-3.5" /> : undefined}
            uploadingLabel={pending.length > 0 ? 'Uploading…' : 'Posting…'}
            doneLabel="Posted"
            disabled={!canPostText || busy}
            onClick={handlePost}
          />
        </div>
      </div>
    </Modal>
  )
}
