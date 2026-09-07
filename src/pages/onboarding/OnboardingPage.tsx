import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import * as usersService from '@/services/users.service'
import type { LookingFor } from '@/types'
import { toast } from '@/store/toast.store'
import { useAuthStore } from '@/store/auth.store'

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

const SUGGESTED_SKILLS = [
  'Product',
  'Design',
  'Engineering',
  'AI/ML',
  'Marketing',
  'Sales',
  'Operations',
  'Fundraising',
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const firstName = useAuthStore((s) => s.session?.name?.trim().split(/\s+/)[0])
  const markOnboardingComplete = useAuthStore((s) => s.markOnboardingComplete)
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [collegeOrCompany, setCollegeOrCompany] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([])
  const [goals, setGoals] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      await usersService.updateCurrentUser({
        role,
        collegeOrCompany,
        location,
        skills,
        lookingFor,
        goals,
      })
      await usersService.completeOnboarding()
    },
    onSuccess: () => {
      markOnboardingComplete()
      toast.success('Profile set up — welcome to Nukkad!')
      navigate('/')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save profile setup'),
  })

  function toggle<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-fg">Nukkad</span>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn('h-1.5 flex-1 rounded-full', s <= step ? 'bg-brand-500' : 'bg-surface-sunken')} />
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center gap-5 text-center py-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-fg">Welcome to Nukkad{firstName ? `, ${firstName}` : ''}!</h1>
              <p className="text-sm text-fg-muted mt-1.5 max-w-sm">
                Let's set up your profile so we can connect you with the right people, ideas and opportunities.
              </p>
            </div>
            <Button size="lg" className="w-full mt-2" rightIcon={<ArrowRight className="size-4" />} onClick={() => setStep(2)}>
              Get started
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-fg">Tell us about you</h1>
              <p className="text-sm text-fg-muted mt-1">This helps us personalize what you see.</p>
            </div>
            <Input label="Current role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Product Designer" />
            <Input
              label="College or company"
              value={collegeOrCompany}
              onChange={(e) => setCollegeOrCompany(e.target.value)}
              placeholder="e.g. IIT Bombay"
            />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, IN" />
            <Button size="lg" className="w-full mt-2" rightIcon={<ArrowRight className="size-4" />} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-fg">What are you looking for?</h1>
              <p className="text-sm text-fg-muted mt-1">Select all that apply — you can change this anytime.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-fg mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggle(skills, setSkills, skill)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                      skills.includes(skill)
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                    )}
                  >
                    {skills.includes(skill) && <Check className="inline size-3.5 mr-1" />}
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-fg mb-2">Looking for</p>
              <div className="flex flex-wrap gap-1.5">
                {LOOKING_FOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(lookingFor, setLookingFor, option)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98]',
                      lookingFor.includes(option)
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-surface text-fg-secondary border-border/80 hover:bg-surface-hover hover:border-border-strong hover:text-fg',
                    )}
                  >
                    {lookingFor.includes(option) && <Check className="inline size-3.5 mr-1" />}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Your goals on Nukkad"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What are you hoping to build or find?"
            />

            <div className="flex gap-3 mt-2">
              <Button variant="secondary" size="lg" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
