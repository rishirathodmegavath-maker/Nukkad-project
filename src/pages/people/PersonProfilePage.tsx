import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  UserPlus,
  UserCheck,
  UserMinus,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Pencil,
  Camera,
  Trash2,
  Plus,
  Globe,
  Rocket,
  Lightbulb,
  Lock,
  CheckCircle2,
  Circle,
  Share2,
  Award,
  FileText,
  BookOpen,
  ExternalLink,
  Eye,
  Layers,
  Activity,
  Wallet,
  User as UserIcon,
} from 'lucide-react'
import {
  getUser,
  toggleConnect,
  declineConnection,
  uploadAvatar,
  removeAvatar,
  uploadCoverPhoto,
  removeCoverPhoto,
  getMutualConnections,
} from '@/services/users.service'
import { getOrCreateConversationWith } from '@/services/messages.service'
import { listStartups } from '@/services/startups.service'
import { listIdeas } from '@/services/ideas.service'
import { listOpportunities } from '@/services/opportunities.service'
import { listFeed } from '@/services/feed.service'
import * as profileSections from '@/services/profile-sections.service'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { TagInput } from '@/components/ui/TagInput'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import { ImageCropModal } from '@/components/ui/ImageCropModal'
import { socialPlatformMeta } from '@/lib/social-platforms'
import { toggleEndorsement } from '@/services/endorsements.service'
import * as recommendationsService from '@/services/recommendations.service'
import * as privacyService from '@/services/privacy.service'
import { UploadSpinnerOverlay, type UploadPhase } from '@/components/ui/UploadButton'
import { EditProfileModal } from '@/components/domain/EditProfileModal'
import { UserConnectionsModal } from '@/components/domain/UserConnectionsModal'
import { ModerationBadge } from '@/components/domain/ModerationBadge'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'
import type {
  Achievement,
  Certification,
  Education,
  Experience,
  ProfileSection,
  ProjectType,
  Publication,
  Recommendation,
  SectionVisibility,
  User,
  UserProject,
} from '@/types'

function formatMonthYear(iso?: string) {
  if (!iso) return ''
  const [y, m] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function ConfirmRemoveModal({
  open,
  title,
  onConfirm,
  onClose,
  isPending,
}: {
  open: boolean
  title: string
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-2 pb-4">
        <p className="text-lg font-bold text-fg">{title}</p>
        <p className="text-xs text-fg-muted">This action cannot be undone.</p>
      </div>
      <div className="-mx-5 -mb-5 border-t border-border/60 flex flex-col">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="py-3 text-sm font-semibold text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/30 cursor-pointer border-b border-border/60 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Removing…' : 'Remove'}
        </button>
        <button onClick={onClose} className="py-3 text-sm font-medium text-fg hover:bg-surface-hover cursor-pointer transition-colors">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

const COVER_ASPECT = 3.5
const AVATAR_ASPECT = 1

// ---- Experience Section & Form ----

function ExperienceFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Experience
}) {
  const queryClient = useQueryClient()
  const [company, setCompany] = useState(initial?.company ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [employmentType, setEmploymentType] = useState(initial?.employmentType ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [isCurrent, setIsCurrent] = useState(initial?.isCurrent ?? false)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [companyUrl, setCompanyUrl] = useState(initial?.companyUrl ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        company,
        role,
        employmentType: employmentType || undefined,
        location: location || undefined,
        startDate,
        endDate: isCurrent ? undefined : endDate || undefined,
        isCurrent,
        description: description || undefined,
        companyUrl: companyUrl || undefined,
      }
      return initial ? profileSections.updateExperience(initial.id, input) : profileSections.addExperience(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Experience updated' : 'Experience added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save experience'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit experience' : 'Add experience'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Role" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Lead Engineer" />
        <Input label="Company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Employment type" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} placeholder="e.g. Full-time, Founding" />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, IN" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Start date" type="month" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          {!isCurrent && <Input label="End date" type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} />}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg cursor-pointer select-none">
          <input type="checkbox" id="experience-current-role" name="experience-current-role" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded accent-brand-500 size-4" />
          I currently work here
        </label>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What were your key responsibilities and impact?" />
        <Input label="Company URL" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} placeholder="https://…" />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!role.trim() || !company.trim() || !startDate} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ExperienceSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const experiences = user.experiences ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Experience removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && experiences.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <Briefcase className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Experience</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add Experience
          </button>
        )}
      </div>

      {experiences.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">You haven't added any work experience yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {experiences.map((exp) => (
            <div key={exp.id} className="py-3.5 first:pt-0 last:pb-0 group flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-fg text-sm sm:text-base">{exp.role}</p>
                  <span className="text-xs text-fg-muted">at</span>
                  <span className="font-semibold text-fg text-sm">{exp.company}</span>
                  {exp.isCurrent && (
                    <Badge tone="neutral" className="text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-fg-muted font-medium mt-1">
                  {exp.employmentType && `${exp.employmentType} · `}
                  {formatMonthYear(exp.startDate)} – {exp.isCurrent ? 'Present' : exp.endDate ? formatMonthYear(exp.endDate) : ''}
                  {exp.location && ` · ${exp.location}`}
                </p>
                {exp.description && <p className="text-sm text-fg-secondary mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>}
                {exp.companyUrl && (
                  <a href={exp.companyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg font-medium mt-2 underline-offset-2 hover:underline">
                    Company website <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {isSelf && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditing(exp)
                      setFormOpen(true)
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Edit experience"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(exp.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label="Delete experience"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <ExperienceFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this experience?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

// ---- Education Section & Form ----

function EducationFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Education
}) {
  const queryClient = useQueryClient()
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [degree, setDegree] = useState(initial?.degree ?? '')
  const [fieldOfStudy, setFieldOfStudy] = useState(initial?.fieldOfStudy ?? '')
  const [startYear, setStartYear] = useState(initial?.startYear?.toString() ?? '')
  const [endYear, setEndYear] = useState(initial?.endYear?.toString() ?? '')
  const [grade, setGrade] = useState(initial?.grade ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        institution,
        degree: degree || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        startYear: startYear ? Number(startYear) : undefined,
        endYear: endYear ? Number(endYear) : undefined,
        grade: grade || undefined,
        description: description || undefined,
      }
      return initial ? profileSections.updateEducation(initial.id, input) : profileSections.addEducation(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Education updated' : 'Education added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save education'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit education' : 'Add education'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Institution" required value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. IIT Bombay" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. B.Tech" />
          <Input label="Field of study" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="e.g. Computer Science" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Start year" type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2018" />
          <Input label="End year" type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="2022" />
          <Input label="Grade / GPA" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 9.1 / 10" />
        </div>
        <Textarea label="Activities & societies" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Clubs, leadership roles, honors…" />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!institution.trim()} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EducationSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Education | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const education = user.education ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Education removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && education.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <GraduationCap className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Education</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add Education
          </button>
        )}
      </div>

      {education.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">You haven't added any education credentials yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {education.map((edu) => (
            <div key={edu.id} className="py-3.5 first:pt-0 last:pb-0 group flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-fg text-sm sm:text-base">{edu.institution}</p>
                <p className="text-xs text-fg-muted font-medium mt-1">
                  {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' — ')}
                  {(edu.startYear || edu.endYear) && ` · ${edu.startYear ?? ''}${edu.endYear ? ` – ${edu.endYear}` : ''}`}
                  {edu.grade && ` · Grade: ${edu.grade}`}
                </p>
                {edu.description && <p className="text-sm text-fg-secondary mt-2 leading-relaxed whitespace-pre-line">{edu.description}</p>}
              </div>

              {isSelf && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditing(edu)
                      setFormOpen(true)
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Edit education"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(edu.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label="Delete education"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <EducationFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this education entry?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

// ---- Projects Section & Form ----

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  PERSONAL: 'Personal',
  ACADEMIC: 'Academic',
  OPEN_SOURCE: 'Open Source',
  STARTUP: 'Startup',
}

function ProjectFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: UserProject
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [technologies, setTechnologies] = useState<string[]>(initial?.technologies ?? [])
  const [githubUrl, setGithubUrl] = useState(initial?.githubUrl ?? '')
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? '')
  const [projectType, setProjectType] = useState<ProjectType>(initial?.projectType ?? 'PERSONAL')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        title,
        description: description || undefined,
        technologies,
        githubUrl: githubUrl || undefined,
        liveUrl: liveUrl || undefined,
        projectType,
      }
      return initial ? profileSections.updateProject(initial.id, input) : profileSections.addProject(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Project updated' : 'Project added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save project'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit project' : 'Add project'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BuildAdda Matching Engine" />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does this project do and what was your role?" />
        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Technologies</p>
          <TagInput value={technologies} onChange={setTechnologies} placeholder="e.g. React, TypeScript, Python…" />
        </div>
        <Select label="Type" value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
          {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
          <Input label="Live Demo URL" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!title.trim()} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ProjectsSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserProject | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const projects = user.projects

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Project removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && projects.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <Layers className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Built Projects</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">You haven't added any projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {projects.map((project) => (
            <div key={project.id} className="border border-border/80 rounded-xl p-4 group bg-surface-sunken/40 hover:bg-surface-sunken transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-fg text-sm sm:text-base">{project.title}</p>
                    <Badge tone="neutral" className="text-[10px]">
                      {PROJECT_TYPE_LABELS[project.projectType]}
                    </Badge>
                  </div>
                  {project.description && <p className="text-sm text-fg-secondary mt-1.5 leading-relaxed">{project.description}</p>}
                </div>
                {isSelf && (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditing(project)
                        setFormOpen(true)
                      }}
                      className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                      aria-label="Edit project"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(project.id)}
                      className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                      aria-label="Delete project"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {project.technologies.map((t) => (
                    <Badge key={t} tone="neutral" className="text-[11px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {(project.githubUrl || project.liveUrl) && (
                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border/50">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-fg-secondary hover:text-fg underline-offset-2 hover:underline">
                      GitHub <ExternalLink className="size-3" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-fg-secondary hover:text-fg underline-offset-2 hover:underline">
                      Live Project <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this project?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

// ---- Achievements, Certifications & Publications ----

function AchievementFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Achievement
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [organization, setOrganization] = useState(initial?.organization ?? '')
  const [achievedOn, setAchievedOn] = useState(initial?.achievedOn ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [credentialUrl, setCredentialUrl] = useState(initial?.credentialUrl ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        title,
        organization: organization || undefined,
        achievedOn: achievedOn || undefined,
        description: description || undefined,
        credentialUrl: credentialUrl || undefined,
      }
      return initial ? profileSections.updateAchievement(initial.id, input) : profileSections.addAchievement(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Achievement updated' : 'Achievement added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save achievement'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit achievement' : 'Add achievement'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Smart India Hackathon — 1st Place" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Issuing organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <Input label="Date achieved" type="date" value={achievedOn} onChange={(e) => setAchievedOn(e.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <Input label="Credential URL" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="https://…" />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!title.trim()} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AchievementsSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const achievements = user.achievements ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deleteAchievement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Achievement removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && achievements.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <Award className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Achievements & Honors</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add
          </button>
        )}
      </div>

      {achievements.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">No achievements added yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {achievements.map((a) => (
            <div key={a.id} className="py-3.5 first:pt-0 last:pb-0 group flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-fg text-sm sm:text-base">🏆 {a.title}</p>
                <p className="text-xs text-fg-muted font-medium mt-1">
                  {[a.organization, a.achievedOn && formatMonthYear(a.achievedOn)].filter(Boolean).join(' · ')}
                </p>
                {a.description && <p className="text-sm text-fg-secondary mt-1.5 leading-relaxed whitespace-pre-line">{a.description}</p>}
                {a.credentialUrl && (
                  <a href={a.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg font-medium mt-2 underline-offset-2 hover:underline">
                    View credential <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {isSelf && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditing(a)
                      setFormOpen(true)
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Edit achievement"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label="Delete achievement"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <AchievementFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this achievement?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

function CertificationFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Certification
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [issuingOrg, setIssuingOrg] = useState(initial?.issuingOrg ?? '')
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '')
  const [credentialId, setCredentialId] = useState(initial?.credentialId ?? '')
  const [credentialUrl, setCredentialUrl] = useState(initial?.credentialUrl ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        title,
        issuingOrg: issuingOrg || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        credentialId: credentialId || undefined,
        credentialUrl: credentialUrl || undefined,
      }
      return initial ? profileSections.updateCertification(initial.id, input) : profileSections.addCertification(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Certification updated' : 'Certification added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save certification'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit certification' : 'Add certification'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" />
        <Input label="Issuing organization" required value={issuingOrg} onChange={(e) => setIssuingOrg(e.target.value)} placeholder="e.g. Amazon Web Services" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Issue date" type="month" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Expiry date" type="month" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <Input label="Credential ID" value={credentialId} onChange={(e) => setCredentialId(e.target.value)} placeholder="e.g. AWS-123456" />
        <Input label="Credential URL" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} placeholder="https://…" />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!title.trim() || !issuingOrg.trim()} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CertificationsSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Certification | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const certifications = user.certifications ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Certification removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && certifications.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <FileText className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Certifications</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add
          </button>
        )}
      </div>

      {certifications.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">No certifications added yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {certifications.map((c) => (
            <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 group flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-fg text-sm sm:text-base">📜 {c.title}</p>
                <p className="text-xs text-fg-muted font-medium mt-1">
                  {[c.issuingOrg, c.issueDate && `Issued ${formatMonthYear(c.issueDate)}`, c.expiryDate && `Expires ${formatMonthYear(c.expiryDate)}`].filter(Boolean).join(' · ')}
                </p>
                {c.credentialId && <p className="text-xs text-fg-muted mt-0.5">Credential ID: {c.credentialId}</p>}
                {c.credentialUrl && (
                  <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg font-medium mt-2 underline-offset-2 hover:underline">
                    Verify credential <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {isSelf && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditing(c)
                      setFormOpen(true)
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Edit certification"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label="Delete certification"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <CertificationFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this certification?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

function PublicationFormModal({
  open,
  onClose,
  userId,
  initial,
}: {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Publication
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [publisher, setPublisher] = useState(initial?.publisher ?? '')
  const [publishDate, setPublishDate] = useState(initial?.publishDate ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        title,
        publisher: publisher || undefined,
        publishDate: publishDate || undefined,
        url: url || undefined,
        description: description || undefined,
      }
      return initial ? profileSections.updatePublication(initial.id, input) : profileSections.addPublication(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success(initial ? 'Publication updated' : 'Publication added')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save publication'),
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit publication' : 'Add publication'} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scaling real-time systems at BuildAdda" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Publisher / Conference" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="e.g. IEEE, Medium" />
          <Input label="Publish date" type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
        </div>
        <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <Textarea label="Abstract / Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!title.trim()} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PublicationsSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Publication | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const publications = user.publications ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileSections.deletePublication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Publication removed')
      setDeleteId(null)
    },
  })

  if (!isSelf && publications.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <BookOpen className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Publications & Articles</h2>
        </div>
        {isSelf && (
          <button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Add
          </button>
        )}
      </div>

      {publications.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">No publications added yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {publications.map((p) => (
            <div key={p.id} className="py-3.5 first:pt-0 last:pb-0 group flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-fg text-sm sm:text-base">📝 {p.title}</p>
                <p className="text-xs text-fg-muted font-medium mt-1">
                  {[p.publisher, p.publishDate && formatMonthYear(p.publishDate)].filter(Boolean).join(' · ')}
                </p>
                {p.description && <p className="text-sm text-fg-secondary mt-1.5 leading-relaxed whitespace-pre-line">{p.description}</p>}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-fg-secondary hover:text-fg font-medium mt-2 underline-offset-2 hover:underline">
                    Read publication <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {isSelf && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditing(p)
                      setFormOpen(true)
                    }}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
                    aria-label="Edit publication"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-fg-muted hover:bg-danger-50 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label="Delete publication"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && <PublicationFormModal open={formOpen} onClose={() => setFormOpen(false)} userId={user.id} initial={editing} />}
      <ConfirmRemoveModal
        open={!!deleteId}
        title="Remove this publication?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Card>
  )
}

// ---- Recommendations ----

function WriteRecommendationModal({
  open,
  onClose,
  subjectId,
  subjectName,
}: {
  open: boolean
  onClose: () => void
  subjectId: string
  subjectName: string
}) {
  const queryClient = useQueryClient()
  const [relationship, setRelationship] = useState('')
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: () => recommendationsService.writeRecommendation(subjectId, { relationship: relationship || undefined, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', subjectId] })
      toast.success('Recommendation sent — it will appear once approved')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send recommendation'),
  })

  return (
    <Modal open={open} onClose={onClose} title={`Write a recommendation for ${subjectName}`} size="md">
      <div className="flex flex-col gap-4">
        <Input label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Worked together at BuildAdda" />
        <Textarea label="Recommendation" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={`What was it like collaborating with ${subjectName}?`} />
        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={mutation.isPending} disabled={!body.trim()} onClick={() => mutation.mutate()}>
            Send Recommendation
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function RecommendationCard({ r }: { r: Recommendation }) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Avatar src={r.authorAvatarUrl} name={r.authorName} size="md" />
        <div className="min-w-0">
          <Link to={`/people/${r.authorUserId}`} className="text-sm font-bold text-fg hover:underline truncate block">
            {r.authorName}
          </Link>
          {r.authorHeadline && <p className="text-xs text-fg-muted truncate">{r.authorHeadline}</p>}
        </div>
      </div>
      {r.relationship && <p className="text-xs text-fg-muted font-medium mt-2">{r.relationship}</p>}
      <p className="text-sm text-fg-secondary mt-1.5 leading-relaxed whitespace-pre-line">{r.body}</p>
    </div>
  )
}

function RecommendationsSection({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [writeOpen, setWriteOpen] = useState(false)
  const recommendations = user.recommendations ?? []
  const canWrite = !isSelf && user.connectionStatus === 'CONNECTED'

  if (recommendations.length === 0 && !canWrite) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-fg-secondary border border-border/60">
            <Award className="size-4" />
          </div>
          <h2 className="font-bold text-base text-fg">Recommendations</h2>
        </div>
        {canWrite && (
          <button
            onClick={() => setWriteOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-fg-secondary hover:text-fg hover:bg-surface-hover px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" /> Write Recommendation
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-fg-muted py-2">No recommendations received yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {recommendations.map((r) => (
            <RecommendationCard key={r.id} r={r} />
          ))}
        </div>
      )}

      {writeOpen && (
        <WriteRecommendationModal open={writeOpen} onClose={() => setWriteOpen(false)} subjectId={user.id} subjectName={user.name} />
      )}
    </Card>
  )
}

function PendingRecommendationsCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const { data: pending } = useQuery({
    queryKey: ['recommendations', 'pending'],
    queryFn: recommendationsService.listPendingRecommendations,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => recommendationsService.approveRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Recommendation approved')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => recommendationsService.rejectRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'pending'] })
      toast.info('Recommendation declined')
    },
  })

  if (!pending || pending.length === 0) return null

  return (
    <Card className="rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs mb-4">
      <h2 className="font-bold text-fg text-sm mb-3">Pending Recommendations to Review</h2>
      <div className="flex flex-col gap-4 divide-y divide-border/60">
        {pending.map((r) => (
          <div key={r.id} className="pt-3 first:pt-0">
            <RecommendationCard r={r} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(r.id)}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate(r.id)}>
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---- Ideas, Startups & Activity Sections ----

function IdeasSection({ userId }: { userId: string }) {
  const { data: ideas } = useQuery({ queryKey: ['ideas', { creatorId: userId }], queryFn: () => listIdeas({ creatorId: userId }) })
  if (!ideas || ideas.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
          <Lightbulb className="size-4" />
        </div>
        <h2 className="font-bold text-base text-fg">Ideas Exploring</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ideas.map((idea) => (
          <Link
            key={idea.id}
            to={`/ideas/${idea.id}`}
            className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-surface-sunken/40 hover:bg-surface-sunken hover:border-border transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="neutral" className="text-[10px]">
                    {idea.stage}
                  </Badge>
                  <ModerationBadge status={idea.moderationStatus} />
                </div>
                <span className="text-[11px] text-fg-muted">{idea.category}</span>
              </div>
              <p className="font-bold text-sm text-fg leading-snug">{idea.title}</p>
              <p className="text-xs text-fg-muted line-clamp-2 mt-1">{idea.problem}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function StartupsSection({ userId }: { userId: string }) {
  const { data: startups } = useQuery({ queryKey: ['startups', { memberId: userId }], queryFn: () => listStartups({ memberId: userId }) })
  if (!startups || startups.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
          <Rocket className="size-4" />
        </div>
        <h2 className="font-bold text-base text-fg">Startups & Ventures</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {startups.map((startup) => (
          <Link
            key={startup.id}
            to={`/startups/${startup.id}`}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-surface-sunken/40 hover:bg-surface-sunken hover:border-border transition-all"
          >
            {startup.logoUrl ? (
              <Avatar src={startup.logoUrl} name={startup.name} size="md" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500 text-white font-bold shrink-0">
                {startup.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-fg truncate">{startup.name}</p>
                {startup.isRaising && <Badge tone="accent" dot className="text-[10px]">Raising</Badge>}
              </div>
              <p className="text-xs text-fg-muted line-clamp-2 mt-0.5">{startup.tagline}</p>
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <Badge tone="neutral" className="text-[10px]">{startup.stage}</Badge>
                <ModerationBadge status={startup.moderationStatus} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function OpportunitiesPostedSection({ userId }: { userId: string }) {
  // Uses the same open-listing endpoint as the public Opportunities browse page, so a viewer only
  // ever sees this person's currently-open postings here — never a stranger's closed history.
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities', { postedByUserId: userId }],
    queryFn: () => listOpportunities({ postedByUserId: userId }),
  })
  if (!opportunities || opportunities.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
          <Briefcase className="size-4" />
        </div>
        <h2 className="font-bold text-base text-fg">Open Positions Posted</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opportunities.map((opp) => (
          <Link
            key={opp.id}
            to={`/opportunities/${opp.id}`}
            className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-surface-sunken/40 hover:bg-surface-sunken hover:border-border transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="neutral" className="text-[10px]">
                    {opp.type}
                  </Badge>
                  <ModerationBadge status={opp.moderationStatus} />
                </div>
                <span className="text-[11px] text-fg-muted">{opp.workMode}</span>
              </div>
              <p className="font-bold text-sm text-fg leading-snug">{opp.title}</p>
              <p className="text-xs text-fg-muted line-clamp-2 mt-1">{opp.organizationName}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function ActivitySection({ userId }: { userId: string }) {
  const { data: posts } = useQuery({ queryKey: ['feed', { authorId: userId }], queryFn: () => listFeed(userId) })
  if (!posts || posts.length === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
          <Activity className="size-4" />
        </div>
        <h2 className="font-bold text-base text-fg">Recent Activity & Posts</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {posts.slice(0, 6).map((post) => {
          const image = post.attachments.find((a) => a.kind === 'image')
          return (
            <Link
              key={post.id}
              to={`/feed/${post.id}`}
              state={{ from: `/people/${userId}#posts`, postIds: posts.slice(0, 6).map((p) => p.id) }}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-sunken border border-border/80 hover:border-brand-500 transition-all"
            >
              {image ? (
                <img src={image.url} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex size-full items-center justify-center p-3 text-center">
                  <p className="text-xs text-fg-secondary line-clamp-4 leading-relaxed">{post.content}</p>
                </div>
              )}
              {post.attachments.length > 1 && (
                <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5">
                  +{post.attachments.length - 1}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

function MutualConnectionsStrip({ userId }: { userId: string }) {
  const { data } = useQuery({ queryKey: ['user', userId, 'mutual-connections'], queryFn: () => getMutualConnections(userId) })
  if (!data || data.totalCount === 0) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          {data.users.slice(0, 3).map((u) => (
            <Avatar key={u.id} src={u.avatarUrl} name={u.name} size="sm" className="ring-2 ring-surface" />
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            {data.totalCount} mutual connection{data.totalCount === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-fg-muted truncate mt-0.5">{data.users.map((u) => u.name).join(', ')}</p>
        </div>
      </div>
    </Card>
  )
}

function SkillChip({ skill, user, isSelf }: { skill: string; user: User; isSelf: boolean }) {
  const queryClient = useQueryClient()
  const summary = (user.endorsementSummary ?? []).find((e) => e.skill === skill)
  const count = summary?.count ?? 0
  const endorsedByViewer = summary?.endorsedByViewer ?? false
  const canEndorse = !isSelf && user.connectionStatus === 'CONNECTED'

  const mutation = useMutation({
    mutationFn: () => toggleEndorsement(user.id, skill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', user.id] }),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update endorsement'),
  })

  if (!canEndorse) {
    return (
      <Badge tone={endorsedByViewer ? 'brand' : 'neutral'} className="text-xs py-1 px-2.5">
        {skill}
        {count > 0 && <span className="ml-1 opacity-70 font-semibold">{count}</span>}
      </Badge>
    )
  }

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium border cursor-pointer transition-all active:scale-95 disabled:opacity-60',
        endorsedByViewer
          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
          : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
      )}
    >
      {skill}
      {count > 0 && <span className="opacity-80 font-bold">+{count}</span>}
    </button>
  )
}

function SkillsCard({ user, isSelf, onEdit }: { user: User; isSelf: boolean; onEdit?: () => void }) {
  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-fg">Skills & Endorsements</h2>
        {isSelf && onEdit && (
          <button onClick={onEdit} className="text-xs font-semibold text-fg-secondary hover:text-fg cursor-pointer">
            Edit
          </button>
        )}
      </div>
      {user.skills.length === 0 ? (
        <p className="text-xs text-fg-muted">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {user.skills.map((skill) => (
            <SkillChip key={skill} skill={skill} user={user} isSelf={isSelf} />
          ))}
        </div>
      )}
    </Card>
  )
}

function LinksCard({ user, isSelf, onEdit }: { user: User; isSelf: boolean; onEdit: () => void }) {
  const links = Object.entries(user.socialLinks ?? {}).filter(([, url]) => !!url)
  if (links.length === 0 && !isSelf) return null

  return (
    <Card className="rounded-2xl border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-fg">Social & Web Links</h2>
        {isSelf && (
          <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-fg-secondary hover:text-fg cursor-pointer">
            <Pencil className="size-3" /> Edit
          </button>
        )}
      </div>
      {links.length === 0 ? (
        <p className="text-xs text-fg-muted">No links connected.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {links.map(([platform, url]) => {
            const meta = socialPlatformMeta(platform)
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-surface-hover border border-transparent hover:border-border/60 transition-all text-xs font-medium"
              >
                <span className={cn('flex size-6 items-center justify-center rounded-full text-xs font-bold shrink-0', meta.badgeClass)}>
                  {meta.badge || <Globe className="size-3.5" />}
                </span>
                <span className="text-fg truncate flex-1">{meta.label}</span>
                <ExternalLink className="size-3 text-fg-muted shrink-0" />
              </a>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function ProfileCompletenessBanner({
  user,
  open,
  onOpenChange,
  onEditProfile,
  onUploadPhoto,
  onUploadCover,
  onGoToSection,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditProfile: () => void
  onUploadPhoto: () => void
  onUploadCover: () => void
  onGoToSection: (tab: TabType, sectionId: string) => void
}) {
  const score = user.profileCompleteness ?? 0
  if (score >= 100) return null

  const radius = 25
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  return (
    <>
      <div className="flex flex-col gap-4 px-5 py-4 rounded-2xl border border-border/80 bg-surface-sunken/60 hover:bg-surface-sunken transition-all shadow-xs mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <svg width="58" height="58" viewBox="0 0 58 58" className="shrink-0">
              <circle cx="29" cy="29" r={radius} fill="none" strokeWidth="5" className="stroke-border" />
              <circle
                cx="29"
                cy="29"
                r={radius}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 29 29)"
                stroke="url(#profile-completeness-gradient)"
                className="transition-[stroke-dashoffset] duration-500"
              />
              <defs>
                <linearGradient id="profile-completeness-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-brand-500)" />
                  <stop offset="100%" stopColor="var(--color-success-500)" />
                </linearGradient>
              </defs>
              <text x="29" y="30" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" className="fill-fg">
                {score}%
              </text>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm sm:text-base text-fg">
                Profile is {score}% complete
              </p>
              <p className="text-xs sm:text-sm text-fg-muted font-medium mt-0.5">
                Add projects, achievements, and social links to reach 100%.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end">
            <Button size="sm" variant="primary" onClick={() => onOpenChange(true)} className="rounded-full px-5 font-bold">
              Complete Profile
            </Button>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${score}%`, background: 'linear-gradient(90deg, var(--color-brand-500), var(--color-success-500))' }}
          />
        </div>
      </div>

      <ProfileCompletenessModal
        open={open}
        onClose={() => onOpenChange(false)}
        user={user}
        onEditProfile={onEditProfile}
        onUploadPhoto={onUploadPhoto}
        onUploadCover={onUploadCover}
        onGoToSection={onGoToSection}
      />
    </>
  )
}

type CompletenessKey =
  | 'PHOTO'
  | 'COVER'
  | 'HEADLINE'
  | 'BIO'
  | 'LOCATION'
  | 'SKILLS'
  | 'EXPERIENCE_OR_EDUCATION'
  | 'PROJECTS'
  | 'SOCIAL_LINKS'
  | 'LOOKING_FOR'
  | 'CREDENTIALS'

function buildCompletenessChecklist(user: User): CompletenessItem[] {
  return [
    { key: 'PHOTO', label: 'Profile photo', hint: 'Add a profile picture', done: !!user.avatarUrl },
    { key: 'COVER', label: 'Cover photo', hint: 'Add a cover photo', done: !!user.coverUrl },
    { key: 'HEADLINE', label: 'Headline', hint: 'Add a professional headline', done: !!user.headline },
    { key: 'BIO', label: 'Bio', hint: 'Write at least 20 characters about yourself', done: (user.bio?.trim().length ?? 0) >= 20 },
    { key: 'LOCATION', label: 'Location', hint: 'Add your location', done: !!user.location },
    { key: 'SKILLS', label: 'Skills', hint: 'Add at least 3 skills', done: (user.skills?.length ?? 0) >= 3 },
    {
      key: 'EXPERIENCE_OR_EDUCATION',
      label: 'Experience or education',
      hint: 'Add a work experience or education entry',
      done: (user.experiences?.length ?? 0) > 0 || (user.education?.length ?? 0) > 0,
    },
    { key: 'PROJECTS', label: 'Projects', hint: 'Add at least one project', done: (user.projects?.length ?? 0) > 0 },
    { key: 'SOCIAL_LINKS', label: 'Social links', hint: 'Add a social or portfolio link', done: Object.keys(user.socialLinks ?? {}).length > 0 },
    {
      key: 'LOOKING_FOR',
      label: 'Looking for / open to',
      hint: 'Set what you are looking for or open to',
      done: (user.lookingFor?.length ?? 0) > 0 || (user.openTo?.length ?? 0) > 0,
    },
    {
      key: 'CREDENTIALS',
      label: 'Achievements, certifications, or publications',
      hint: 'Add an achievement, certification, or publication',
      done: (user.achievements?.length ?? 0) > 0 || (user.certifications?.length ?? 0) > 0 || (user.publications?.length ?? 0) > 0,
    },
  ]
}

interface CompletenessItem {
  key: CompletenessKey
  label: string
  hint: string
  done: boolean
}

function ProfileCompletenessModal({
  open,
  onClose,
  user,
  onEditProfile,
  onUploadPhoto,
  onUploadCover,
  onGoToSection,
}: {
  open: boolean
  onClose: () => void
  user: User
  onEditProfile: () => void
  onUploadPhoto: () => void
  onUploadCover: () => void
  onGoToSection: (tab: TabType, sectionId: string) => void
}) {
  const items = buildCompletenessChecklist(user)

  function handleItemClick(key: CompletenessKey) {
    switch (key) {
      case 'PHOTO':
        onUploadPhoto()
        break
      case 'COVER':
        onUploadCover()
        break
      case 'HEADLINE':
      case 'BIO':
      case 'LOCATION':
      case 'SKILLS':
      case 'SOCIAL_LINKS':
      case 'LOOKING_FOR':
        onEditProfile()
        break
      case 'EXPERIENCE_OR_EDUCATION':
        onGoToSection('overview', 'profile-section-experience')
        break
      case 'PROJECTS':
        onGoToSection('ventures', 'profile-section-projects')
        break
      case 'CREDENTIALS':
        onGoToSection('credentials', 'profile-section-achievements')
        break
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete your profile" description="Strengthen your credibility across the BuildAdda network." size="md">
      <div className="flex flex-col divide-y divide-border/60">
        {items.map((item) =>
          item.done ? (
            <div key={item.key} className="flex items-start gap-3 py-3">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-fg-muted line-through">{item.label}</p>
            </div>
          ) : (
            <button
              key={item.key}
              type="button"
              onClick={() => handleItemClick(item.key)}
              className="flex items-start gap-3 py-3 w-full text-left rounded-lg -mx-2 px-2 cursor-pointer hover:bg-surface-hover transition-colors"
            >
              <Circle className="size-5 text-fg-muted/60 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">{item.label}</p>
                <p className="text-xs text-fg-muted mt-0.5">{item.hint}</p>
              </div>
              <ChevronRight className="size-4 text-fg-muted/60 shrink-0 mt-1" />
            </button>
          ),
        )}
      </div>
    </Modal>
  )
}

const PRIVACY_SECTIONS: { section: ProfileSection; label: string }[] = [
  { section: 'EXPERIENCE', label: 'Experience' },
  { section: 'EDUCATION', label: 'Education' },
  { section: 'ACHIEVEMENTS', label: 'Achievements' },
  { section: 'PROJECTS', label: 'Projects' },
  { section: 'CERTIFICATIONS', label: 'Certifications' },
  { section: 'PUBLICATIONS', label: 'Publications' },
  { section: 'SOCIAL_LINKS', label: 'Social links' },
  { section: 'RECOMMENDATIONS', label: 'Recommendations' },
]

const VISIBILITY_OPTIONS: { value: SectionVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Everyone' },
  { value: 'CONNECTIONS', label: 'Connections' },
  { value: 'PRIVATE', label: 'Only me' },
]

function PrivacySettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: privacyService.getPrivacySettings,
    enabled: open,
  })
  const [overrides, setOverrides] = useState<Partial<Record<ProfileSection, SectionVisibility>>>({})
  const draft = { ...(settings ?? {}), ...overrides }

  const mutation = useMutation({
    mutationFn: () => privacyService.updatePrivacySettings(draft),
    onSuccess: (updated) => {
      queryClient.setQueryData(['privacy-settings'], updated)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      toast.success('Privacy settings saved')
      setOverrides({})
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save privacy settings'),
  })

  function handleClose() {
    setOverrides({})
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Profile privacy" description="Choose who can see each section of your profile." size="md">
      <div className="flex flex-col gap-4">
        {PRIVACY_SECTIONS.map(({ section, label }) => (
          <div key={section} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
            <span className="text-sm font-medium text-fg">{label}</span>
            <div className="flex flex-wrap gap-1">
              {VISIBILITY_OPTIONS.map((opt) => {
                const active = (draft[section] ?? 'PUBLIC') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOverrides((prev) => ({ ...prev, [section]: opt.value }))}
                    className={cn(
                      'rounded-xl px-2.5 py-1 text-xs font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                      active ? 'bg-brand-600 text-white border-brand-600 shadow-xs' : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border/60 px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={handleClose}>
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

type TabType = 'overview' | 'ventures' | 'credentials' | 'activity'

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const isSelf = !!currentUser && id === currentUser.id
  const [editOpen, setEditOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>(() => (location.hash === '#posts' ? 'activity' : 'overview'))
  const [completenessOpen, setCompletenessOpen] = useState(false)
  const [returnToCompleteness, setReturnToCompleteness] = useState(false)
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [avatarPhase, setAvatarPhase] = useState<UploadPhase>('idle')
  const [coverPhase, setCoverPhase] = useState<UploadPhase>('idle')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false)
  const [showRemoveCoverModal, setShowRemoveCoverModal] = useState(false)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    queryClient.invalidateQueries({ queryKey: ['user', id] })
  }

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      invalidate()
      setAvatarPhase('done')
      setTimeout(() => setAvatarPhase('idle'), 1200)
      toast.success('Avatar updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setAvatarPhase('idle')
    },
  })

  const removeAvatarMutation = useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      invalidate()
      toast.success('Profile photo removed')
      setShowRemoveAvatarModal(false)
    },
  })

  const uploadCoverMutation = useMutation({
    mutationFn: uploadCoverPhoto,
    onSuccess: () => {
      invalidate()
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
    mutationFn: removeCoverPhoto,
    onSuccess: () => {
      invalidate()
      toast.success('Cover photo removed')
      setShowRemoveCoverModal(false)
    },
  })

  const connectMutation = useMutation({
    mutationFn: () => toggleConnect(id!, user?.connectionStatus),
    onSuccess: (updated) => {
      invalidate()
      const messages: Record<string, string> = {
        PENDING_OUTGOING: `Connection request sent to ${updated.name}`,
        CONNECTED: `You're now connected with ${updated.name}`,
        NONE: 'Connection removed',
      }
      toast.success(messages[updated.connectionStatus ?? 'NONE'])
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => declineConnection(id!),
    onSuccess: (updated) => {
      invalidate()
      toast.info(`Declined ${updated.name}'s request`)
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => getOrCreateConversationWith(id!),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  })

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingAvatarFile(file)
    e.target.value = ''
  }

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingCoverFile(file)
    e.target.value = ''
  }

  function handleShareProfile() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied to clipboard')
  }

  // Runs after a tab switch triggered by the completeness checklist, once the target section
  // has actually mounted in the newly-active tab.
  useEffect(() => {
    if (!pendingScrollId) return
    const el = document.getElementById(pendingScrollId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setPendingScrollId(null)
    }
  }, [pendingScrollId, activeTab])

  function goToSection(tab: TabType, sectionId: string) {
    setCompletenessOpen(false)
    setActiveTab(tab)
    setPendingScrollId(sectionId)
  }

  function openEditFromChecklist() {
    setCompletenessOpen(false)
    setReturnToCompleteness(true)
    setEditOpen(true)
  }

  function openPhotoPickerFromChecklist() {
    setCompletenessOpen(false)
    fileInputRef.current?.click()
  }

  function openCoverPickerFromChecklist() {
    setCompletenessOpen(false)
    coverInputRef.current?.click()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return <ErrorState title="Couldn’t load this profile" onRetry={refetch} />
  }

  const venturesCount = (user.projects?.length ?? 0)
  const credentialsCount = (user.achievements?.length ?? 0) + (user.certifications?.length ?? 0) + (user.publications?.length ?? 0)

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-12">
      {isSelf && (
        <ProfileCompletenessBanner
          user={user}
          open={completenessOpen}
          onOpenChange={setCompletenessOpen}
          onEditProfile={openEditFromChecklist}
          onUploadPhoto={openPhotoPickerFromChecklist}
          onUploadCover={openCoverPickerFromChecklist}
          onGoToSection={goToSection}
        />
      )}
      {isSelf && <PendingRecommendationsCard userId={user.id} />}

      <div className="relative rounded-2xl border border-border/80 bg-surface shadow-xs overflow-hidden">
        {/* Cover Photo Banner (LinkedIn-style Background Image) */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-surface-sunken overflow-hidden group">
          {user.coverUrl ? (
            <img
              src={user.coverUrl}
              alt="Cover background"
              className="size-full object-cover select-none"
            />
          ) : isSelf ? (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="flex items-center justify-center gap-2 size-full text-xs font-semibold text-fg-muted hover:text-fg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Camera className="size-4" /> Add a background photo
            </button>
          ) : (
            <div className="size-full bg-gradient-to-br from-brand-500/10 via-surface-sunken to-accent-500/10" />
          )}

          <UploadSpinnerOverlay phase={isSelf ? coverPhase : 'idle'} />

          {/* LinkedIn-style Background Photo Actions (Top Right) */}
          {isSelf ? (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
              {user.coverUrl ? (
                <DropdownMenu
                  align="right"
                  trigger={
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-surface/90 text-fg hover:bg-surface text-xs font-semibold px-3 py-2 cursor-pointer backdrop-blur-md transition-all shadow-md border border-border/80"
                      aria-label="Background photo options"
                    >
                      <Camera className="size-3.5 text-fg-muted" />
                      <span className="hidden sm:inline">Edit background</span>
                    </button>
                  }
                >
                  <DropdownItem icon={<Eye className="size-4" />} onClick={() => setLightboxSrc(user.coverUrl!)}>
                    View background photo
                  </DropdownItem>
                  <DropdownItem icon={<Camera className="size-4" />} onClick={() => coverInputRef.current?.click()}>
                    Change background photo
                  </DropdownItem>
                  <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => setShowRemoveCoverModal(true)}>
                    Delete background photo
                  </DropdownItem>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-surface/90 text-fg hover:bg-surface text-xs font-semibold px-3 py-2 cursor-pointer backdrop-blur-md transition-all shadow-md border border-border/80"
                  aria-label="Add background photo"
                >
                  <Camera className="size-3.5 text-fg-muted" />
                  <span className="hidden sm:inline">Add background</span>
                </button>
              )}
            </div>
          ) : (
            user.coverUrl && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setLightboxSrc(user.coverUrl!)}
                  className="flex items-center gap-1.5 rounded-full bg-surface/90 text-fg hover:bg-surface text-xs font-semibold px-3 py-2 cursor-pointer backdrop-blur-md transition-all shadow-md border border-border/80"
                  aria-label="View background photo"
                >
                  <Eye className="size-3.5" />
                  <span className="hidden sm:inline">View background</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Hero Identity Body */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Elevated Avatar with Thick Ring */}
            <div className="relative shrink-0 rounded-full ring-4 ring-surface shadow-md bg-surface size-24 sm:size-28">
              {isSelf ? (
                <DropdownMenu
                  align="left"
                  trigger={
                    <button className="relative size-full rounded-full cursor-pointer group" aria-label="Profile photo options">
                      <Avatar src={user.avatarUrl} name={user.name} size="2xl" />
                      <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="size-5" />
                      </span>
                      <UploadSpinnerOverlay phase={avatarPhase} />
                    </button>
                  }
                >
                  {user.avatarUrl && (
                    <DropdownItem icon={<Eye className="size-4" />} onClick={() => setLightboxSrc(user.avatarUrl)}>
                      View profile photo
                    </DropdownItem>
                  )}
                  <DropdownItem icon={<Camera className="size-4" />} onClick={() => fileInputRef.current?.click()}>
                    Change profile photo
                  </DropdownItem>
                  {user.avatarUrl && (
                    <DropdownItem danger icon={<Trash2 className="size-4" />} onClick={() => setShowRemoveAvatarModal(true)}>
                      Delete profile photo
                    </DropdownItem>
                  )}
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => user.avatarUrl && setLightboxSrc(user.avatarUrl)}
                  className="size-full rounded-full cursor-pointer"
                  aria-label="View profile photo"
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="2xl" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {isSelf ? (
                <>
                  <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditOpen(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Lock className="size-3.5" />} onClick={() => setPrivacyOpen(true)}>
                    Privacy
                  </Button>
                  {/* Only reachable from your own profile, not the site-wide navigation. */}
                  <Button variant="outline" size="sm" leftIcon={<Wallet className="size-3.5" />} onClick={() => navigate('/wallet')}>
                    Wallet
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Share2 className="size-3.5" />} onClick={handleShareProfile} aria-label="Share profile">
                    Share
                  </Button>
                </>
              ) : (
                <>
                  {user.connectionStatus === 'PENDING_INCOMING' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={declineMutation.isPending}
                        onClick={() => declineMutation.mutate()}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<UserCheck className="size-3.5" />}
                        isLoading={connectMutation.isPending}
                        onClick={() => connectMutation.mutate()}
                      >
                        Accept Request
                      </Button>
                    </div>
                  ) : user.connectionStatus === 'CONNECTED' ? (
                    <DropdownMenu
                      trigger={
                        <Button variant="secondary" size="sm" leftIcon={<UserCheck className="size-3.5" />} rightIcon={<ChevronDown className="size-3.5" />}>
                          Connected
                        </Button>
                      }
                    >
                      <DropdownItem danger icon={<UserMinus className="size-4" />} onClick={() => connectMutation.mutate()}>
                        Remove connection
                      </DropdownItem>
                    </DropdownMenu>
                  ) : (
                    <Button
                      size="sm"
                      variant={user.connectionStatus === 'NONE' || !user.connectionStatus ? 'primary' : 'secondary'}
                      leftIcon={user.connectionStatus === 'PENDING_OUTGOING' ? <Clock className="size-3.5" /> : <UserPlus className="size-3.5" />}
                      isLoading={connectMutation.isPending}
                      onClick={() => connectMutation.mutate()}
                    >
                      {user.connectionStatus === 'PENDING_OUTGOING' ? 'Requested' : 'Connect'}
                    </Button>
                  )}

                  <Button
                    variant={user.connectionStatus === 'CONNECTED' ? 'primary' : 'secondary'}
                    size="sm"
                    leftIcon={<MessageSquare className="size-3.5" />}
                    isLoading={messageMutation.isPending}
                    onClick={() => messageMutation.mutate()}
                  >
                    Message
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Share2 className="size-3.5" />}
                    onClick={handleShareProfile}
                  >
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-fg tracking-tight">{user.name}</h1>
              {user.role && <Badge tone="brand" className="font-bold text-xs">{user.role}</Badge>}
              {user.availability && <Badge tone="accent" dot className="font-semibold text-xs">{user.availability}</Badge>}
            </div>

            {user.headline && (
              <p className="text-sm sm:text-base text-fg-secondary font-medium leading-relaxed max-w-3xl">
                {user.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs sm:text-sm text-fg-muted font-medium">
              {user.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-fg-muted shrink-0" />
                  <span>{user.location}</span>
                </span>
              )}
              {user.collegeOrCompany && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-fg-muted shrink-0" />
                  <span>{user.collegeOrCompany}</span>
                </span>
              )}
              {user.experienceYears !== undefined && user.experienceYears > 0 && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-fg-muted shrink-0" />
                  <span>{user.experienceYears} {user.experienceYears === 1 ? 'yr' : 'yrs'} exp</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setConnectionsModalOpen(true)}
                className="flex items-center gap-1.5 text-fg font-bold hover:underline underline-offset-2 cursor-pointer transition-colors"
                aria-label={`View ${user.name}'s connections`}
              >
                <UserCheck className="size-3.5 shrink-0 text-fg-muted" />
                <span>{user.connectionsCount} connection{user.connectionsCount === 1 ? '' : 's'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border/80 sticky top-16 z-20 bg-canvas/90 backdrop-blur-md py-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'overview'
              ? 'bg-surface text-fg font-bold shadow-xs border border-border/80'
              : 'text-fg-muted hover:text-fg hover:bg-surface-hover font-medium',
          )}
        >
          <UserIcon className="size-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ventures')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'ventures'
              ? 'bg-surface text-fg font-bold shadow-xs border border-border/80'
              : 'text-fg-muted hover:text-fg hover:bg-surface-hover font-medium',
          )}
        >
          <Rocket className="size-4" />
          <span>Ventures & Projects</span>
          {venturesCount > 0 && <span className="text-xs opacity-75 font-bold">({venturesCount})</span>}
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'credentials'
              ? 'bg-surface text-fg font-bold shadow-xs border border-border/80'
              : 'text-fg-muted hover:text-fg hover:bg-surface-hover font-medium',
          )}
        >
          <Award className="size-4" />
          <span>Credentials & Honors</span>
          {credentialsCount > 0 && <span className="text-xs opacity-75 font-bold">({credentialsCount})</span>}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'activity'
              ? 'bg-surface text-fg font-bold shadow-xs border border-border/80'
              : 'text-fg-muted hover:text-fg hover:bg-surface-hover font-medium',
          )}
        >
          <Activity className="size-4" />
          <span>Posts & Activity</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeTab === 'overview' && (
            <>
              {(user.bio || user.goals || isSelf) && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-base text-fg">About</h2>
                    {isSelf && (
                      <button onClick={() => setEditOpen(true)} className="text-xs font-semibold text-fg-secondary hover:text-fg cursor-pointer">
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-fg-secondary leading-relaxed">
                    {user.bio || (isSelf ? 'Add a short professional bio to help people know who you are and what you build.' : 'No bio provided.')}
                  </p>
                  {user.goals && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-fg-muted mb-1.5">Goals on BuildAdda</h3>
                      <p className="text-sm text-fg-secondary leading-relaxed">{user.goals}</p>
                    </div>
                  )}
                </Card>
              )}

              <div id="profile-section-experience">
                <ExperienceSection user={user} isSelf={isSelf} />
              </div>
              <EducationSection user={user} isSelf={isSelf} />
              <RecommendationsSection user={user} isSelf={isSelf} />
            </>
          )}

          {activeTab === 'ventures' && (
            <>
              <StartupsSection userId={user.id} />
              <OpportunitiesPostedSection userId={user.id} />
              <IdeasSection userId={user.id} />
              <div id="profile-section-projects">
                <ProjectsSection user={user} isSelf={isSelf} />
              </div>
            </>
          )}

          {activeTab === 'credentials' && (
            <>
              <div id="profile-section-achievements">
                <AchievementsSection user={user} isSelf={isSelf} />
              </div>
              <CertificationsSection user={user} isSelf={isSelf} />
              <PublicationsSection user={user} isSelf={isSelf} />
            </>
          )}

          {activeTab === 'activity' && (
            <ActivitySection userId={user.id} />
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <SkillsCard user={user} isSelf={isSelf} onEdit={() => setEditOpen(true)} />

          {(user.lookingFor.length > 0 || isSelf) && (
            <Card className="rounded-2xl border border-border/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-fg">Looking For</h2>
                {isSelf && (
                  <button onClick={() => setEditOpen(true)} className="text-xs font-semibold text-fg-secondary hover:text-fg cursor-pointer">
                    Edit
                  </button>
                )}
              </div>
              {user.lookingFor.length === 0 ? (
                <p className="text-xs text-fg-muted">Not specified yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {user.lookingFor.map((lf) => (
                    <Badge key={lf} tone="neutral" className="text-xs py-1 px-2.5 font-medium">
                      {lf}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          {((user.openTo?.length ?? 0) > 0 || isSelf) && (
            <Card className="rounded-2xl border border-border/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-fg">Open To</h2>
                {isSelf && (
                  <button onClick={() => setEditOpen(true)} className="text-xs font-semibold text-fg-secondary hover:text-fg cursor-pointer">
                    Edit
                  </button>
                )}
              </div>
              {(user.openTo?.length ?? 0) === 0 ? (
                <p className="text-xs text-fg-muted">Not specified yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {user.openTo?.map((ot) => (
                    <Badge key={ot} tone="neutral" className="text-xs py-1 px-2.5 font-medium">
                      {ot}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          <LinksCard user={user} isSelf={isSelf} onEdit={() => setEditOpen(true)} />

          {!isSelf && <MutualConnectionsStrip userId={user.id} />}
        </div>
      </div>

      <input ref={fileInputRef} type="file" id="profile-avatar-upload" name="profile-avatar-upload" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverInputRef} type="file" id="profile-cover-upload" name="profile-cover-upload" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleCoverChange} />
      <ImageLightbox src={lightboxSrc} alt={user.name} onClose={() => setLightboxSrc(null)} />

      <ImageCropModal
        file={pendingAvatarFile}
        aspect={AVATAR_ASPECT}
        shape="circle"
        title="Crop profile photo"
        outputWidth={640}
        onCancel={() => setPendingAvatarFile(null)}
        onConfirm={(cropped) => {
          setPendingAvatarFile(null)
          setAvatarPhase('uploading')
          uploadAvatarMutation.mutate(cropped)
        }}
      />
      <ConfirmRemoveModal
        open={showRemoveAvatarModal}
        title="Remove profile photo?"
        onConfirm={() => removeAvatarMutation.mutate()}
        onClose={() => setShowRemoveAvatarModal(false)}
        isPending={removeAvatarMutation.isPending}
      />

      <ImageCropModal
        file={pendingCoverFile}
        aspect={COVER_ASPECT}
        title="Crop cover photo"
        outputWidth={1600}
        onCancel={() => setPendingCoverFile(null)}
        onConfirm={(cropped) => {
          setPendingCoverFile(null)
          setCoverPhase('uploading')
          uploadCoverMutation.mutate(cropped)
        }}
      />
      <ConfirmRemoveModal
        open={showRemoveCoverModal}
        title="Remove cover photo?"
        onConfirm={() => removeCoverMutation.mutate()}
        onClose={() => setShowRemoveCoverModal(false)}
        isPending={removeCoverMutation.isPending}
      />

      {isSelf && (
        <EditProfileModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false)
            if (returnToCompleteness) {
              setReturnToCompleteness(false)
              setCompletenessOpen(true)
            }
          }}
          user={user}
        />
      )}
      {isSelf && <PrivacySettingsModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />}

      <UserConnectionsModal
        userId={user.id}
        userName={user.name}
        open={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
      />
    </div>
  )
}
