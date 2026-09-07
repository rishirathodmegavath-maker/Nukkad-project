import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Crown, Plus, ChevronRight, CheckCircle2, Camera, Trash2, Pencil, UserPlus, X } from 'lucide-react'
import {
  getChapter,
  joinChapter,
  leaveChapter,
  uploadChapterCover,
  removeChapterCover,
  removeChapterMember,
  deleteChapter,
} from '@/services/chapters.service'
import { listUsers } from '@/services/users.service'
import { listIdeas } from '@/services/ideas.service'
import { listStartups } from '@/services/startups.service'
import { listOpportunities } from '@/services/opportunities.service'
import { listEvents } from '@/services/events.service'
import { listResources } from '@/services/resources.service'
import { useUser } from '@/hooks/useUser'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { Skeleton, CardSkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import { UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { Modal } from '@/components/ui/Modal'
import { PersonCard } from '@/components/domain/PersonCard'
import { ChapterEditModal } from '@/components/domain/ChapterEditModal'
import { AddChapterMemberModal } from '@/components/domain/AddChapterMemberModal'
import { IdeaCard } from '@/components/domain/IdeaCard'
import { StartupCard } from '@/components/domain/StartupCard'
import { OpportunityCard } from '@/components/domain/OpportunityCard'
import { EventCard } from '@/components/domain/EventCard'
import { ResourceCard } from '@/components/domain/ResourceCard'
import { toast } from '@/store/toast.store'

type TabKey = 'members' | 'ideas' | 'startups' | 'opportunities' | 'events' | 'resources'

/** Shared loading/error/empty/data rendering for each of the 6 tab queries below — none of them
 *  previously checked isLoading or isError at all, so a failed request silently rendered the
 *  tab's "No X yet" empty copy as if the count were genuinely zero. */
function TabSection<T>({
  query,
  emptyState,
  children,
}: {
  query: { data?: T[]; isLoading: boolean; isError: boolean; refetch: () => void }
  emptyState: ReactNode
  children: (data: T[]) => ReactNode
}) {
  if (query.isLoading) return <CardSkeletonGrid count={3} />
  if (query.isError) return <ErrorState title="Couldn't load this" onRetry={() => query.refetch()} />
  if (!query.data || query.data.length === 0) return <>{emptyState}</>
  return <>{children(query.data)}</>
}

export default function ChapterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('members')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const { data: chapter, isLoading, isError, refetch } = useQuery({
    queryKey: ['chapter', id],
    queryFn: () => getChapter(id!),
    enabled: !!id,
  })

  const { data: president } = useUser(chapter?.presidentUserId)
  const { data: currentUser } = useCurrentUser()
  const canManageEvents = !!currentUser && currentUser.id === chapter?.presidentUserId
  const isPresident = canManageEvents

  const joinMutation = useMutation({
    mutationFn: () => joinChapter(id!),
    onSuccess: () => {
      // "Member" vs "Join" is derived from currentUser.chapterId (see isMember below), not from
      // the chapter query — both must be invalidated or the button stays stuck on "Join" until a
      // full page reload happens to refetch currentUser on its own.
      queryClient.invalidateQueries({ queryKey: ['chapter', id] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      // The member count shown on ChapterCard in the chapters grid comes from this separate
      // plural query — without this it stays stale there until its own staleTime expires.
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success(`Joined ${chapter?.name}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not join this chapter'),
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveChapter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', id] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success(`Left ${chapter?.name}`)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not leave this chapter'),
  })

  const [editOpen, setEditOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeChapterMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'chapter', id] })
      queryClient.invalidateQueries({ queryKey: ['chapter', id] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success('Removed from chapter')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove member'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteChapter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.info('Chapter deleted')
      navigate('/chapters')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not delete this chapter')
      setConfirmDeleteOpen(false)
    },
  })

  const coverInputRef = useRef<HTMLInputElement>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [coverPhase, setCoverPhase] = useState<UploadPhase>('idle')
  const [showRemoveCoverModal, setShowRemoveCoverModal] = useState(false)

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => uploadChapterCover(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', id] })
      setCoverPhase('done')
      setTimeout(() => setCoverPhase('idle'), 1200)
      toast.success('Cover photo updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setCoverPhase('idle')
    },
  })

  const removeCoverMutation = useMutation({
    mutationFn: () => removeChapterCover(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', id] })
      toast.success('Cover photo removed')
      setShowRemoveCoverModal(false)
    },
  })

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingCoverFile(file)
    e.target.value = ''
  }

  const membersQuery = useQuery({
    queryKey: ['users', 'chapter', id],
    queryFn: () => listUsers({ chapterId: id }),
    enabled: tab === 'members' && !!id,
  })
  const ideasQuery = useQuery({
    queryKey: ['ideas', 'chapter', id],
    queryFn: () => listIdeas({ chapterId: id }),
    enabled: tab === 'ideas' && !!id,
  })
  const startupsQuery = useQuery({
    queryKey: ['startups', 'chapter', id],
    queryFn: () => listStartups({ chapterId: id }),
    enabled: tab === 'startups' && !!id,
  })
  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', 'chapter', id],
    queryFn: () => listOpportunities({ chapterId: id }),
    enabled: tab === 'opportunities' && !!id,
  })
  const eventsQuery = useQuery({
    queryKey: ['events', 'chapter', id],
    queryFn: () => listEvents({ chapterId: id }),
    enabled: tab === 'events' && !!id,
  })
  const resourcesQuery = useQuery({
    queryKey: ['resources', 'chapter', id],
    queryFn: () => listResources({ chapterId: id }),
    enabled: tab === 'resources' && !!id,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !chapter) {
    return <ErrorState title="Couldn’t load this chapter" onRetry={refetch} />
  }

  const isMember = !!currentUser && currentUser.chapterId === chapter.id

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Link to="/chapters" className="hover:text-fg transition-colors">
          Chapters
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-fg truncate max-w-sm">{chapter.name}</span>
      </div>

      <Card padding="none" className="overflow-hidden rounded-2xl border border-border/80 shadow-xs bg-surface">
        <div className="relative h-44 sm:h-56 w-full bg-surface-sunken overflow-hidden group">
          {chapter.coverImageUrl ? (
            <img src={chapter.coverImageUrl} alt={chapter.name} className="size-full object-cover" />
          ) : isPresident ? (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="flex items-center justify-center gap-2 size-full text-xs font-semibold text-fg-muted hover:text-fg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Camera className="size-4" /> Add a cover photo
            </button>
          ) : (
            <div className="size-full bg-gradient-to-br from-brand-500/10 via-surface-sunken to-accent-500/10" />
          )}

          <UploadSpinnerOverlay phase={isPresident ? coverPhase : 'idle'} />

          {isPresident && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              {chapter.coverImageUrl ? (
                <DropdownMenu
                  align="right"
                  trigger={
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-surface/90 text-fg hover:bg-surface text-xs font-semibold px-3 py-2 cursor-pointer backdrop-blur-md transition-all shadow-md border border-border/80"
                      aria-label="Cover photo options"
                    >
                      <Camera className="size-3.5 text-fg-muted" />
                      <span className="hidden sm:inline">Edit cover</span>
                    </button>
                  }
                >
                  <DropdownItem icon={<Camera className="size-4" />} onClick={() => coverInputRef.current?.click()}>
                    Change cover photo
                  </DropdownItem>
                  <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => setShowRemoveCoverModal(true)}>
                    Delete cover photo
                  </DropdownItem>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-surface/90 text-fg hover:bg-surface text-xs font-semibold px-3 py-2 cursor-pointer backdrop-blur-md transition-all shadow-md border border-border/80"
                  aria-label="Add cover photo"
                >
                  <Camera className="size-3.5 text-fg-muted" />
                  <span className="hidden sm:inline">Add cover</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="p-6 sm:p-7 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight leading-tight mb-1.5">{chapter.name}</h1>
            <p className="text-sm text-fg-muted leading-relaxed max-w-xl">{chapter.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm text-fg-muted font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-fg-muted" /> {chapter.memberCount ?? 0} members
              </span>
              {president && (
                <Link to={`/people/${president.id}`} className="flex items-center gap-1.5 text-fg hover:underline group">
                  <Crown className="size-4 text-amber-500 shrink-0" />
                  <Avatar src={president.avatarUrl} name={president.name} size="xs" />
                  <span>{president.name} (President)</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isPresident && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                  Edit chapter
                </Button>
                <Button
                  variant="danger-subtle"
                  size="sm"
                  leftIcon={<Trash2 className="size-3.5" />}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
            )}
            {isMember && isPresident ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="size-4" /> Member
              </span>
            ) : isMember ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="size-4" /> Member
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={leaveMutation.isPending}
                  onClick={() => leaveMutation.mutate()}
                >
                  Leave chapter
                </Button>
              </div>
            ) : (
              <Button isLoading={joinMutation.isPending} onClick={() => joinMutation.mutate()}>
                Join chapter
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'members', label: 'Members', count: chapter.memberCount ?? 0 },
          { key: 'ideas', label: 'Ideas', count: chapter.ideaCount ?? 0 },
          { key: 'startups', label: 'Startups', count: chapter.startupCount ?? 0 },
          { key: 'opportunities', label: 'Opportunities', count: chapter.opportunityCount ?? 0 },
          { key: 'events', label: 'Events', count: chapter.eventCount ?? 0 },
          { key: 'resources', label: 'Resources', count: chapter.resourceCount ?? 0 },
        ]}
      />

      {tab === 'members' && (
        <div className="flex flex-col gap-4">
          {isPresident && (
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" leftIcon={<UserPlus className="size-3.5" />} onClick={() => setAddMemberOpen(true)}>
                Add member
              </Button>
            </div>
          )}
          <TabSection
            query={membersQuery}
            emptyState={
              <EmptyState
                title="No members joined this chapter yet"
                description="Be among the first founders and builders to represent this local hub."
              />
            }
          >
            {(members) => (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {members.map((u) => (
                  <PersonCard
                    key={u.id}
                    user={u}
                    topRightAction={
                      isPresident && u.id !== chapter.presidentUserId ? (
                        <button
                          type="button"
                          disabled={removeMemberMutation.isPending && removeMemberMutation.variables === u.id}
                          onClick={() => removeMemberMutation.mutate(u.id)}
                          title="Remove from chapter"
                          className="shrink-0 rounded-full p-1.5 bg-surface/90 backdrop-blur-md border border-border/80 text-fg-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </TabSection>
        </div>
      )}

      {tab === 'ideas' && (
        <TabSection
          query={ideasQuery}
          emptyState={
            <EmptyState
              title="No ideas posted from this chapter yet"
              description="Explore ideas from other chapters, or pitch an idea to find co-founders."
              action={
                <Link to="/ideas/new">
                  <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                    Pitch an Idea
                  </Button>
                </Link>
              }
            />
          }
        >
          {(ideas) => (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </TabSection>
      )}

      {tab === 'startups' && (
        <TabSection
          query={startupsQuery}
          emptyState={
            <EmptyState
              title="No startups active in this chapter yet"
              description="Ventures built by members of this chapter will be highlighted here."
            />
          }
        >
          {(startups) => (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {startups.map((s) => (
                <StartupCard key={s.id} startup={s} />
              ))}
            </div>
          )}
        </TabSection>
      )}

      {tab === 'opportunities' && (
        <TabSection
          query={opportunitiesQuery}
          emptyState={
            <EmptyState
              title="No open opportunities in this chapter right now"
              description="Internships, co-founder roles, and founding positions posted here will show up."
            />
          }
        >
          {(opportunities) => (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {opportunities.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} />
              ))}
            </div>
          )}
        </TabSection>
      )}

      {tab === 'events' && (
        <div>
          {canManageEvents && (
            <div className="flex justify-end mb-4">
              <Link to={`/events/new?chapterId=${chapter.id}`}>
                <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                  New chapter event
                </Button>
              </Link>
            </div>
          )}
          <TabSection
            query={eventsQuery}
            emptyState={
              <EmptyState
                title="No events scheduled for this chapter"
                description="Meetups, hackathons, and demo nights organized by this chapter will be shown here."
                action={
                  canManageEvents ? (
                    <Link to={`/events/new?chapterId=${chapter.id}`}>
                      <Button size="sm" leftIcon={<Plus className="size-3.5" />}>
                        Create Chapter Event
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            }
          >
            {(events) => (
              <div className="grid sm:grid-cols-2 gap-4">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </TabSection>
        </div>
      )}

      {tab === 'resources' && (
        <TabSection
          query={resourcesQuery}
          emptyState={
            <EmptyState
              title="No resources shared with this chapter yet"
              description="Templates, guides, and slide decks shared by members will appear here."
            />
          }
        >
          {(resources) => (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </TabSection>
      )}

      <input
        ref={coverInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleCoverChange}
      />
      <ImageCropModal
        file={pendingCoverFile}
        aspect={16 / 6}
        title="Crop cover photo"
        onCancel={() => setPendingCoverFile(null)}
        onConfirm={(cropped) => {
          setPendingCoverFile(null)
          setCoverPhase('uploading')
          uploadCoverMutation.mutate(cropped)
        }}
      />
      <Modal
        open={showRemoveCoverModal}
        onClose={() => setShowRemoveCoverModal(false)}
        title="Delete cover photo?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRemoveCoverModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={removeCoverMutation.isPending} onClick={() => removeCoverMutation.mutate()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">This will remove {chapter.name}'s cover photo. You can add a new one anytime.</p>
      </Modal>
      <ChapterEditModal open={editOpen} onClose={() => setEditOpen(false)} chapter={chapter} />
      <AddChapterMemberModal
        chapterId={chapter.id}
        chapterName={chapter.name}
        existingMemberIds={(membersQuery.data ?? []).map((u) => u.id)}
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this chapter?"
        description={`"${chapter.name}" can only be deleted once it has no other members and no linked ideas, startups, opportunities, events, or resources.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete chapter
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">Are you sure you want to permanently delete this chapter?</p>
      </Modal>
    </div>
  )
}
