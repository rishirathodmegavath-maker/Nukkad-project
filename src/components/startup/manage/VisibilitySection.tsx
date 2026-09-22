import { Eye, EyeOff, Globe, Lock } from 'lucide-react'
import { ChoiceCards } from '@/components/startup/ChoiceCards'
import { SectionForm } from '@/components/startup/manage/SectionForm'
import { useSectionForm } from '@/components/startup/manage/useSectionForm'
import type { Startup, StartupVisibility, UpdateStartupInput } from '@/types'

interface VisibilityDraft {
  visibility: StartupVisibility
  fundraisingVisible: boolean
}

function toDraft(startup: Startup): VisibilityDraft {
  return { visibility: startup.visibility || 'Public', fundraisingVisible: startup.fundraisingVisible }
}

function toInput(draft: VisibilityDraft): UpdateStartupInput {
  return { visibility: draft.visibility, fundraisingVisible: draft.fundraisingVisible }
}

const noProblems = () => ({})

/**
 * Who can see the startup, and who can see its fundraising. The server enforces both on every request (the profile,
 * search, Discovery and the Raising Now filter all follow them), so this only changes the setting.
 */
export function VisibilitySection({ startup, onDirtyChange }: { startup: Startup; onDirtyChange: (dirty: boolean) => void }) {
  const form = useSectionForm({ startup, toDraft, toInput, validate: noProblems, onDirtyChange, successMessage: 'Visibility saved' })
  const { draft, change } = form

  return (
    <SectionForm title="Visibility" description="Choose who can see your startup and its fundraising. Your own team can always see everything." form={form}>
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Startup visibility</p>
        <ChoiceCards<StartupVisibility>
          id="msf-visibility"
          label="Startup visibility"
          value={draft.visibility}
          onChange={(visibility) => change({ visibility })}
          options={[
            {
              value: 'Public',
              label: 'Public',
              description: 'Anyone can view your startup, including people without a BuildAdda account.',
              icon: <Globe className="size-4 text-fg-muted" aria-hidden="true" />,
            },
            {
              value: 'Nukkad Members',
              label: 'BuildAdda members',
              description: 'Only people signed in to BuildAdda can view it. Visitors who aren’t signed in can’t see it.',
              icon: <Lock className="size-4 text-fg-muted" aria-hidden="true" />,
            },
          ]}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-secondary">Fundraising visibility</p>
        <ChoiceCards<'show' | 'hide'>
          id="msf-fundraisingVisible"
          label="Fundraising visibility"
          value={draft.fundraisingVisible ? 'show' : 'hide'}
          onChange={(value) => change({ fundraisingVisible: value === 'show' })}
          options={[
            {
              value: 'show',
              label: 'Show',
              description: 'People who can see your startup can see that you’re raising and the details of your round.',
              icon: <Eye className="size-4 text-fg-muted" aria-hidden="true" />,
            },
            {
              value: 'hide',
              label: 'Hide',
              description: 'Only your team sees your round and “Raising now”. You won’t appear in the Raising Now filter.',
              icon: <EyeOff className="size-4 text-fg-muted" aria-hidden="true" />,
            },
          ]}
        />
      </div>
    </SectionForm>
  )
}
