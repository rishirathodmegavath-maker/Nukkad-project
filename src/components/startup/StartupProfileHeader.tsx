import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Globe, Heart, Lock, MapPin, MessageSquare, MoreHorizontal, Settings2, Trash2 } from 'lucide-react'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { ModerationBadge } from '@/components/domain/ModerationBadge'
import { StartupLogo } from '@/components/startup/StartupLogo'
import { ShareStartupButton } from '@/components/startup/ShareStartupButton'
import { STAGE_TONE, safeHref } from '@/lib/startup-meta'
import { toast } from '@/store/toast.store'
import type { Startup } from '@/types'

interface StartupProfileHeaderProps {
  startup: Startup
  /** Founder or admin of this startup (the server's word, from /my-membership). */
  canManage: boolean
  isFounder: boolean
  /** The founder a visitor can message. Undefined when there is nobody else to contact (e.g. the viewer is the only founder). */
  contactUserId?: string
  followPending: boolean
  onFollow: () => void
  /** Opens the management page. */
  onManage: () => void
  onDelete: () => void
}

/** The top of a startup's profile: who they are, what stage they're at, and what a visitor can do about it. */
export function StartupProfileHeader({
  startup,
  canManage,
  isFounder,
  contactUserId,
  followPending,
  onFollow,
  onManage,
  onDelete,
}: StartupProfileHeaderProps) {
  const navigate = useNavigate()
  const isFollowing = !!startup.isFollowing
  const websiteHref = safeHref(startup.website)
  const websiteLabel = startup.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')

  const contact = useMutation({
    mutationFn: () => getOrCreateConversationWith(contactUserId!),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not start the conversation'),
  })

  return (
    <Card padding="none" className="overflow-hidden">
      <div aria-hidden="true" className="h-16 bg-gradient-to-br from-brand-500/20 via-brand-500/8 to-transparent sm:h-24" />

      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-10 sm:-mt-12">
          <StartupLogo startup={startup} canManage={canManage} />
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg [overflow-wrap:anywhere]">{startup.name}</h1>
            {startup.tagline.trim() && <p className="mt-1 text-base text-fg-secondary [overflow-wrap:anywhere]">{startup.tagline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge tone={STAGE_TONE[startup.stage] ?? 'neutral'} size="md">
                {startup.stage}
              </Badge>
              {startup.isRaising && (
                <Badge tone="accent" size="md" dot>
                  Raising now
                </Badge>
              )}
              {startup.sector.trim() && (
                <Badge tone="neutral" size="md">
                  {startup.sector}
                </Badge>
              )}
              {startup.visibility === 'Nukkad Members' && (
                <Badge tone="neutral" size="md">
                  <Lock className="size-3" aria-hidden="true" /> Members only
                </Badge>
              )}
              <ModerationBadge status={startup.moderationStatus} />
            </div>

            {(startup.location.trim() || websiteLabel) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fg-muted">
                {startup.location.trim() && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    <span className="[overflow-wrap:anywhere]">{startup.location}</span>
                  </span>
                )}
                {websiteLabel &&
                  (websiteHref ? (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-1.5 hover:text-fg-brand hover:underline"
                    >
                      <Globe className="size-4 shrink-0" aria-hidden="true" />
                      <span className="[overflow-wrap:anywhere]">{websiteLabel}</span>
                    </a>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Globe className="size-4 shrink-0" aria-hidden="true" />
                      <span className="[overflow-wrap:anywhere]">{websiteLabel}</span>
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            <Button
              variant={isFollowing ? 'soft' : 'primary'}
              leftIcon={<Heart className={isFollowing ? 'size-4 fill-current' : 'size-4'} />}
              isLoading={followPending}
              aria-pressed={isFollowing}
              onClick={onFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <ShareStartupButton startupId={startup.id} startupName={startup.name} />
            {contactUserId && (
              <Button variant="secondary" leftIcon={<MessageSquare className="size-4" />} isLoading={contact.isPending} onClick={() => contact.mutate()}>
                Contact
              </Button>
            )}
            {canManage && (
              <Button variant="secondary" leftIcon={<Settings2 className="size-4" />} onClick={onManage}>
                Manage startup
              </Button>
            )}
            {isFounder && (
              <DropdownMenu
                trigger={
                  <Button variant="secondary" size="icon" aria-label="More actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              >
                <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={onDelete}>
                  Delete startup
                </DropdownItem>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
