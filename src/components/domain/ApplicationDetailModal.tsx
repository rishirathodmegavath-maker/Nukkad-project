import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Star, MessageSquare, Globe, Link2, Briefcase, FolderGit2 } from 'lucide-react'
import type { Application, ApplicationStatus } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getOrCreateConversationWith } from '@/services/messages.service'
import * as opportunitiesService from '@/services/opportunities.service'
import { ConnectAction } from '@/components/domain/ConnectAction'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'
import { safeHref } from '@/lib/links'

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  Pending: 'info',
  Shortlisted: 'brand',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
}

interface ApplicationDetailModalProps {
  application: Application | null
  onClose: () => void
}

export function ApplicationDetailModal({ application, onClose }: ApplicationDetailModalProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidate = () => {
    if (application) queryClient.invalidateQueries({ queryKey: ['opportunities', application.opportunityId, 'applications'] })
  }

  const shortlistMutation = useMutation({
    mutationFn: () => opportunitiesService.shortlistApplication(application!.id),
    onSuccess: () => {
      invalidate()
      toast.success('Application shortlisted')
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => opportunitiesService.acceptApplication(application!.id),
    onSuccess: () => {
      invalidate()
      toast.success('Application accepted')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => opportunitiesService.rejectApplication(application!.id),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(application!.applicant.id),
    onSuccess: (conversation) => {
      onClose()
      navigate(`/messages/${conversation.id}`)
    },
  })

  if (!application) return null

  return (
    <Modal
      open={!!application}
      onClose={onClose}
      title="Application Details"
      description={`Submitted for ${application.opportunityTitle}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          {application.status === 'Accepted' ? (
            <Button
              size="sm"
              leftIcon={<MessageSquare className="size-3.5" />}
              isLoading={messageMutation.isPending}
              onClick={() => messageMutation.mutate()}
            >
              Message applicant
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 ml-auto">
            {application.status === 'Pending' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Star className="size-3.5" />}
                isLoading={shortlistMutation.isPending}
                onClick={() => shortlistMutation.mutate()}
              >
                Shortlist
              </Button>
            )}
            {(application.status === 'Pending' || application.status === 'Shortlisted') && (
              <>
                <Button
                  variant="danger-subtle"
                  size="sm"
                  leftIcon={<X className="size-3.5" />}
                  isLoading={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Check className="size-3.5" />}
                  isLoading={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  Accept
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/80">
          <Link to={`/people/${application.applicant.id}`} className="flex items-start gap-3 min-w-0 group">
            <Avatar src={application.applicant.avatarUrl} name={application.applicant.name} size="lg" />
            <div className="min-w-0">
              <p className="font-bold text-fg truncate">
                {application.applicant.name}
              </p>
              <p className="text-xs text-fg-muted truncate">{application.applicant.headline}</p>
              <p className="text-xs text-fg-muted mt-0.5">{application.applicant.location}</p>
            </div>
          </Link>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge tone={STATUS_TONE[application.status]}>{application.status}</Badge>
            <span className="text-xs text-fg-muted">Applied {formatRelativeTime(application.createdAt)}</span>
            <ConnectAction user={application.applicant} />
          </div>
        </div>

        {(safeHref(application.applicant.socialLinks?.linkedin ?? '') || safeHref(application.applicant.socialLinks?.github ?? '') || safeHref(application.applicant.socialLinks?.portfolio ?? '')) && (
          <div className="flex items-center gap-3 text-fg-muted">
            {safeHref(application.applicant.socialLinks?.linkedin ?? '') && (
              <a href={safeHref(application.applicant.socialLinks?.linkedin ?? '')!} target="_blank" rel="noreferrer" className="hover:text-fg" title="LinkedIn">
                <Link2 className="size-4" />
              </a>
            )}
            {safeHref(application.applicant.socialLinks?.github ?? '') && (
              <a href={safeHref(application.applicant.socialLinks?.github ?? '')!} target="_blank" rel="noreferrer" className="hover:text-fg" title="GitHub">
                <Link2 className="size-4" />
              </a>
            )}
            {safeHref(application.applicant.socialLinks?.portfolio ?? '') && (
              <a href={safeHref(application.applicant.socialLinks?.portfolio ?? '')!} target="_blank" rel="noreferrer" className="hover:text-fg" title="Portfolio">
                <Globe className="size-4" />
              </a>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Why they're interested</p>
          <p className="text-sm text-fg-secondary leading-relaxed">{application.whyInterested}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Why they're a good fit</p>
          <p className="text-sm text-fg-secondary leading-relaxed">{application.whyGoodFit}</p>
        </div>

        {application.relevantSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Relevant skills</p>
            <div className="flex flex-wrap gap-1.5">
              {application.relevantSkills.map((skill) => (
                <Badge key={skill} tone="neutral">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {application.relevantExperience.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Relevant experience</p>
            <div className="flex flex-col gap-2">
              {application.relevantExperience.map((exp) => (
                <div key={exp.id} className="flex items-start gap-2 text-sm">
                  <Briefcase className="size-3.5 text-fg-muted mt-0.5 shrink-0" />
                  <span className="text-fg">
                    {exp.role} · <span className="text-fg-muted">{exp.company}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {application.relevantProjects.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Relevant projects</p>
            <div className="flex flex-col gap-2">
              {application.relevantProjects.map((project) => (
                <div key={project.id} className="flex items-start gap-2 text-sm">
                  <FolderGit2 className="size-3.5 text-fg-muted mt-0.5 shrink-0" />
                  <span className="text-fg">{project.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {application.availability && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1">Availability</p>
              <p className="text-sm text-fg">{application.availability}</p>
            </div>
          )}
          {application.expectedCommitment && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1">Expected commitment</p>
              <p className="text-sm text-fg">{application.expectedCommitment}</p>
            </div>
          )}
        </div>

        {application.additionalMessage && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-1.5">Additional message</p>
            <p className="text-sm text-fg-secondary leading-relaxed">{application.additionalMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
