import type { ReactNode } from 'react'
import { Lightbulb, Puzzle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { RichText } from '@/components/startup/ProfileParts'
import type { Startup } from '@/types'

interface Section {
  title: string
  description?: string
  text: string
}

function NarrativeTab({
  sections,
  icon,
  emptyTitle,
  emptyDescription,
  canManage,
  onEdit,
  addLabel,
}: {
  sections: Section[]
  icon: ReactNode
  emptyTitle: string
  emptyDescription: string
  canManage: boolean
  onEdit: () => void
  addLabel: string
}) {
  const filled = sections.filter((s) => s.text.trim())
  if (filled.length === 0) {
    return (
      <EmptyState
        as="h3"
        className="py-12"
        icon={icon}
        title={emptyTitle}
        description={canManage ? emptyDescription : 'The founders haven’t added this yet.'}
        action={
          canManage ? (
            <Button size="sm" onClick={onEdit}>
              {addLabel}
            </Button>
          ) : undefined
        }
      />
    )
  }
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {filled.map((s) => (
        <SectionCard key={s.title} title={s.title} description={s.description}>
          <RichText className="text-[15px]">{s.text.trim()}</RichText>
        </SectionCard>
      ))}
    </div>
  )
}

interface TabProps {
  startup: Startup
  canManage: boolean
  onEdit: () => void
}

/** The problem the startup says it is solving, and who has it: the startup's own words, nothing added. */
export function StartupProblemTab({ startup, canManage, onEdit }: TabProps) {
  return (
    <NarrativeTab
      icon={<Puzzle className="size-5" />}
      emptyTitle="No problem described yet"
      emptyDescription="Explain the problem you’re solving so people understand why this startup exists."
      addLabel="Describe the problem"
      canManage={canManage}
      onEdit={onEdit}
      sections={[
        { title: 'The problem', description: 'What is broken, and why it matters.', text: startup.problem },
        { title: 'Who has this problem', description: 'The target customer.', text: startup.targetCustomer },
      ]}
    />
  )
}

/** How the startup solves it: the solution, what is being built, and how it earns. */
export function StartupSolutionTab({ startup, canManage, onEdit }: TabProps) {
  return (
    <NarrativeTab
      icon={<Lightbulb className="size-5" />}
      emptyTitle="No solution described yet"
      emptyDescription="Describe what you’re building and how it solves the problem."
      addLabel="Describe the solution"
      canManage={canManage}
      onEdit={onEdit}
      sections={[
        { title: 'The solution', description: 'How the startup addresses the problem.', text: startup.solution },
        { title: 'What we’re building', text: startup.whatBuilding },
        { title: 'Business model', description: 'How it makes money.', text: startup.businessModel },
      ]}
    />
  )
}
