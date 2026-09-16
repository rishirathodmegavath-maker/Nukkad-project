import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Check, X, Star, MessageSquare, Clock } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Application, ApplicationStatus } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getOrCreateConversationWith } from '@/services/messages.service'
import * as opportunitiesService from '@/services/opportunities.service'
import { ConnectAction } from '@/components/domain/ConnectAction'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  Pending: 'info',
  Shortlisted: 'brand',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
}

interface ApplicationCardProps {
  application: Application
  onView: (application: Application) => void
}

export function ApplicationCard({ application, onView }: ApplicationCardProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['opportunities', application.opportunityId, 'applications'] })

  const shortlistMutation = useMutation({
    mutationFn: () => opportunitiesService.shortlistApplication(application.id),
    onSuccess: () => {
      invalidate()
      toast.success(`${application.applicant.name} shortlisted`)
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => opportunitiesService.acceptApplication(application.id),
    onSuccess: () => {
      invalidate()
      toast.success(`${application.applicant.name} accepted — you can now message them`)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => opportunitiesService.rejectApplication(application.id),
    onSuccess: () => {
      invalidate()
      toast.info(`${application.applicant.name}'s application rejected`)
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(application.applicant.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  })

  const isPending = application.status === 'Pending'
  const isShortlisted = application.status === 'Shortlisted'
  const canDecide = isPending || isShortlisted

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/people/${application.applicant.id}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={application.applicant.avatarUrl} name={application.applicant.name} size="lg" />
          <div className="min-w-0">
            <p className="font-semibold text-fg truncate">{application.applicant.name}</p>
            <p className="text-sm text-fg-muted truncate">{application.applicant.headline}</p>
            <p className="text-xs text-fg-muted flex items-center gap-1 mt-0.5">
              <MapPin className="size-3" /> {application.applicant.location}
            </p>
          </div>
        </Link>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge tone={STATUS_TONE[application.status]}>{application.status}</Badge>
          <span className="text-xs text-fg-muted flex items-center gap-1">
            <Clock className="size-3" /> {formatRelativeTime(application.createdAt)}
          </span>
        </div>
      </div>

      {application.relevantSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {application.relevantSkills.slice(0, 4).map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-sm text-fg-secondary leading-relaxed line-clamp-2">"{application.whyInterested}"</p>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
        <Button size="sm" variant="secondary" onClick={() => onView(application)}>
          View
        </Button>
        {isPending && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Star className="size-3.5" />}
            isLoading={shortlistMutation.isPending}
            onClick={() => shortlistMutation.mutate()}
          >
            Shortlist
          </Button>
        )}
        {canDecide && (
          <>
            <Button
              size="sm"
              leftIcon={<Check className="size-3.5" />}
              isLoading={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="danger-subtle"
              leftIcon={<X className="size-3.5" />}
              isLoading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              Reject
            </Button>
          </>
        )}
        {application.status === 'Accepted' && (
          <Button
            size="sm"
            leftIcon={<MessageSquare className="size-3.5" />}
            isLoading={messageMutation.isPending}
            onClick={() => messageMutation.mutate()}
          >
            Message
          </Button>
        )}
        <ConnectAction user={application.applicant} />
      </div>
    </Card>
  )
}
