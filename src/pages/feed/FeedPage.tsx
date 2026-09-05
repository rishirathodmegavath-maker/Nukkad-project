import { useRef, useState, useMemo, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Image, FileText, X, Video, Bookmark, Sparkles, Plus, FileType2 } from 'lucide-react'
import { listFeed, createPost, uploadAttachment } from '@/services/feed.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PostCard } from '@/components/domain/PostCard'
import { typeMeta } from '@/lib/postTypeMeta'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { PillTabs } from '@/components/ui/Tabs'
import { UploadButton, UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from '@/store/toast.store'
import type { Post } from '@/types'

const MAX_ATTACHMENTS = 10

interface PendingFile {
  file: File
  previewUrl?: string
}

function pickKind(file: File): 'image' | 'video' | 'pdf' | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf') return 'pdf'
  return null
}

const FEED_TABS = [
  { key: 'all', label: 'All Feed' },
  { key: 'saved', label: 'Saved Posts' },
]

/** Blank-card guard: image → video frame → PDF tile → related-entity chip → text → generic fallback.
 *  A saved post must never render with none of these, which is what happened before for
 *  video-only/PDF-only posts and startup_update/idea/opportunity/event posts (those rely on the
 *  typeMeta chip instead of free-text content, exactly like the real PostCard already does). */
function SavedPostThumbnail({ post }: { post: Post }) {
  const image = post.attachments.find((a) => a.kind === 'image')
  const video = post.attachments.find((a) => a.kind === 'video')
  const pdf = post.attachments.find((a) => a.kind === 'pdf')
  const meta = typeMeta[post.type]

  if (image) {
    return <img src={image.url} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
  }
  if (video) {
    return (
      <div className="relative size-full bg-black">
        <video src={video.url} muted preload="metadata" className="size-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-xs text-white">
            <Video className="size-4" />
          </span>
        </span>
      </div>
    )
  }
  if (pdf) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20 shrink-0">
          <FileType2 className="size-4.5" />
        </span>
        <p className="text-[11px] font-semibold text-fg-secondary truncate max-w-full">{pdf.fileName ?? 'Document.pdf'}</p>
      </div>
    )
  }
  if (meta) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
          <meta.icon className="size-4.5" />
        </span>
        <p className="text-[11px] font-semibold text-fg-secondary">{meta.label}</p>
      </div>
    )
  }
  if (post.content) {
    return (
      <div className="flex size-full items-center justify-center p-3 text-center bg-surface">
        <p className="text-xs text-fg-secondary line-clamp-5 leading-relaxed">{post.content}</p>
      </div>
    )
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center bg-surface">
      <span className="flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-secondary border border-border/80 shrink-0">
        <FileText className="size-4.5" />
      </span>
      <p className="text-[11px] font-semibold text-fg-secondary">View post</p>
    </div>
  )
}

function SavedPostsGrid({ posts }: { posts: Post[] }) {
  const postIds = posts.map((p) => p.id)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/feed/${post.id}`}
          state={{ from: '/feed?tab=saved', fromLabel: 'Back to saved posts', postIds }}
          className="group relative aspect-square overflow-hidden rounded-xl bg-surface-sunken border border-border/80 hover:border-brand-500 transition-all"
        >
          <SavedPostThumbnail post={post} />
          {post.attachments.length > 1 && (
            <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5">
              +{post.attachments.length - 1}
            </span>
          )}
          <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-xs text-amber-400">
            <Bookmark className="size-3.5 fill-current" />
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[11px] font-semibold text-white truncate">
              {post.content || typeMeta[post.type]?.label || 'View post'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function FeedPage() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'saved' ? 'saved' : 'all'
  const setTab = (next: string) => setSearchParams(next === 'saved' ? { tab: 'saved' } : {})
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [content, setContent] = useState('')
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [postPhase, setPostPhase] = useState<UploadPhase>('idle')
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const { data: posts, isLoading, isError, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: () => listFeed(),
  })

  const filteredPosts = useMemo(() => {
    if (!posts) return []
    if (tab === 'saved') {
      return posts.filter((p) => p.isSaved)
    }
    return posts
  }, [posts, tab])

  const postMutation = useMutation({
    mutationFn: async () => {
      const attachments = await Promise.all(pendingFiles.map((p) => uploadAttachment(p.file)))
      return createPost(content.trim(), 'text', undefined, attachments)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      pendingFiles.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
      setContent('')
      setPendingFiles([])
      setIsComposerOpen(false)
      setPostPhase('done')
      setTimeout(() => setPostPhase('idle'), 1200)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not create post')
      setPostPhase('idle')
    },
  })

  function handlePost() {
    setPostPhase('uploading')
    postMutation.mutate()
  }

  function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter((f) => pickKind(f) !== null)
    setPendingFiles((prev) => {
      const combined = [
        ...prev,
        ...selected.map((file) => ({
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        })),
      ]
      if (combined.length > MAX_ATTACHMENTS) {
        toast.error(`You can attach up to ${MAX_ATTACHMENTS} files`)
        return combined.slice(0, MAX_ATTACHMENTS)
      }
      return combined
    })
    e.target.value = ''
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const removed = prev[index]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const canPost = (content.trim().length > 0 || pendingFiles.length > 0) && !postMutation.isPending

  return (
    <div className="max-w-[620px] mx-auto flex flex-col gap-6">
      <PillTabs items={FEED_TABS} value={tab} onChange={setTab} className="self-start" />

      {tab === 'all' && (
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface p-4 text-left shadow-xs transition-all duration-150 hover:border-border-strong active:scale-[0.995] cursor-pointer"
        >
          <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="md" />
          <span className="flex-1 min-w-0 truncate text-sm text-fg-muted">
            Share an update, ask for feedback, or celebrate a milestone…
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Plus className="size-4.5" />
          </span>
        </button>
      )}

      <Modal
        open={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title="Create post"
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="md" />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share an update, ask for feedback, or celebrate a milestone…"
                rows={4}
                className="w-full resize-none rounded-xl border border-border/80 bg-surface-sunken/40 px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand-500 focus:bg-surface focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-fg-muted leading-relaxed"
              />

              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {pendingFiles.map((p, i) => {
                    const kind = pickKind(p.file)
                    return (
                      <div
                        key={i}
                        className="relative size-18 rounded-xl overflow-hidden border border-border/80 bg-surface-sunken shrink-0 shadow-2xs group"
                      >
                        {p.previewUrl ? (
                          <img src={p.previewUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex flex-col items-center justify-center gap-1 p-1 text-center bg-surface-sunken">
                            {kind === 'video' ? (
                              <Video className="size-5 text-brand-600 dark:text-brand-400" />
                            ) : (
                              <FileText className="size-5 text-accent-500" />
                            )}
                            <span className="text-[10px] font-medium text-fg-muted truncate w-full px-1">
                              {p.file.name}
                            </span>
                          </div>
                        )}
                        <UploadSpinnerOverlay phase={postPhase} />
                        {postPhase === 'idle' && (
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer transition-colors shadow-xs"
                            aria-label="Remove attachment"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    aria-label="Add photo or video"
                    className="flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold text-fg-secondary bg-surface-sunken/60 hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors shrink-0"
                  >
                    <Image className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span className="hidden sm:inline">Photo/Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    aria-label="Add document (PDF)"
                    className="flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold text-fg-secondary bg-surface-sunken/60 hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors shrink-0"
                  >
                    <FileText className="size-4 text-accent-500 shrink-0" />
                    <span className="hidden sm:inline">Document (PDF)</span>
                  </button>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={addFiles}
                  />
                  <input
                    ref={docInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    hidden
                    onChange={addFiles}
                  />
                </div>
                <UploadButton
                  size="md"
                  className="shrink-0"
                  phase={postPhase}
                  idleLabel="Post"
                  leftIcon={postPhase === 'idle' ? <Send className="size-3.5" /> : undefined}
                  uploadingLabel={pendingFiles.length > 0 ? 'Uploading…' : 'Posting…'}
                  doneLabel="Posted"
                  disabled={!canPost}
                  onClick={handlePost}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {isLoading ? (
        <CardSkeletonGrid count={3} />
      ) : isError ? (
        <EmptyState
          title="Could not load feed"
          description="Something went wrong while loading updates. Please try again."
          action={
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 underline"
            >
              Retry
            </button>
          }
        />
      ) : filteredPosts && filteredPosts.length > 0 ? (
        tab === 'saved' ? (
          <SavedPostsGrid posts={filteredPosts} />
        ) : (
          <div className="flex flex-col gap-5">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : tab === 'saved' ? (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title="No saved posts yet"
          description="Click the bookmark icon on any post in your feed to save it for later reference."
        />
      ) : (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Your feed is waiting for your voice"
          description="Be the first to share an update, showcase a project, or ask a question to the community."
        />
      )}
    </div>
  )
}

