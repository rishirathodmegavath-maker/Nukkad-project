import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TagInput } from '@/components/ui/TagInput'
import { updateCurrentUser } from '@/services/users.service'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'
import { SOCIAL_PLATFORMS } from '@/lib/social-platforms'
import type { Availability, LookingFor, OpenTo, SocialPlatform, User } from '@/types'

const LOOKING_FOR_OPTIONS: LookingFor[] = [
  'Co-founder',
  'Team to join',
  'Mentorship',
  'Investment',
  'Job',
  'Internship',
  'Founding Role',
  'Collaborators',
]

const OPEN_TO_OPTIONS: OpenTo[] = [
  'Collaborating',
  'Building ideas',
  'Startup projects',
  'Technical projects',
  'Research',
  'Speaking',
  'Mentorship',
]

function ChipGroup<T extends string>({ options, value, onChange }: { options: T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== option) : [...value, option])}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
              active
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
            )}
          >
            {active && <Check className="inline size-3.5 mr-1" />}
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function EditProfileModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [headline, setHeadline] = useState(user.headline)
  const [role, setRole] = useState(user.role)
  const [collegeOrCompany, setCollegeOrCompany] = useState(user.collegeOrCompany)
  const [location, setLocation] = useState(user.location)
  const [experienceYears, setExperienceYears] = useState(user.experienceYears)
  const [bio, setBio] = useState(user.bio)
  const [availability, setAvailability] = useState<Availability>(user.availability)
  const [skills, setSkills] = useState<string[]>(user.skills)
  const [lookingFor, setLookingFor] = useState<LookingFor[]>(user.lookingFor)
  const [openTo, setOpenTo] = useState<OpenTo[]>(user.openTo ?? [])
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialPlatform, string>>>(user.socialLinks ?? {})

  function setLink(platform: SocialPlatform, url: string) {
    setSocialLinks((prev) => ({ ...prev, [platform]: url }))
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateCurrentUser({
        name,
        headline,
        role,
        collegeOrCompany,
        location,
        experienceYears,
        bio,
        availability,
        skills,
        lookingFor,
        openTo,
        socialLinks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      toast.success('Profile updated')
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update profile'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" size="lg">
      <div className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. AI/ML Developer | Builder" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Student, Developer" />
          <Input label="College / Company" value={collegeOrCompany} onChange={(e) => setCollegeOrCompany(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
          />
        </div>
        <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Weekends">Weekends</option>
          <option value="Not available">Not available</option>
        </Select>
        <Textarea label="About" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />

        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Skills</p>
          <TagInput value={skills} onChange={setSkills} placeholder="Add a skill and press Enter…" />
        </div>

        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Looking for</p>
          <ChipGroup options={LOOKING_FOR_OPTIONS} value={lookingFor} onChange={setLookingFor} />
        </div>

        <div>
          <p className="text-sm font-medium text-fg mb-1.5">Open to</p>
          <ChipGroup options={OPEN_TO_OPTIONS} value={openTo} onChange={setOpenTo} />
        </div>

        <div>
          <p className="text-sm font-medium text-fg mb-2">Links</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <Input
                key={platform.value}
                label={platform.label}
                value={socialLinks[platform.value] ?? ''}
                onChange={(e) => setLink(platform.value, e.target.value)}
                placeholder={platform.placeholder}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
          <Button variant="ghost" onClick={onClose}>
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
