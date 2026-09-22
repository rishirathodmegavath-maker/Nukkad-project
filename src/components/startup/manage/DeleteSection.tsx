import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DeleteStartupModal } from '@/components/startup/manage/DeleteStartupModal'
import type { Startup } from '@/types'

/** Deleting the startup. Only a founder can; an admin is told so instead of being offered a button the server would refuse. */
export function DeleteSection({ startup, isFounder }: { startup: Startup; isFounder: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="border border-danger-500/30">
      <h2 className="flex items-center gap-2 text-base font-semibold text-danger-500">
        <Trash2 className="size-4" aria-hidden="true" />
        Delete startup
      </h2>
      {isFounder ? (
        <>
          <p className="mt-2 text-sm text-fg-secondary [overflow-wrap:anywhere]">
            Permanently delete <strong className="font-semibold text-fg">{startup.name}</strong>. Its team, followers, updates, open roles, materials and fundraising are removed with it, and this can’t be undone.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg-muted">
            <li>Job postings made for this startup have to be deleted first, by whoever posted them.</li>
            <li>If it began as an idea on BuildAdda, that idea goes back to being an idea.</li>
          </ul>
          <div className="mt-5">
            <Button variant="danger" leftIcon={<Trash2 className="size-4" />} onClick={() => setOpen(true)}>
              Delete this startup
            </Button>
          </div>
          <DeleteStartupModal startup={startup} open={open} onClose={() => setOpen(false)} />
        </>
      ) : (
        <p className="mt-2 text-sm text-fg-muted">Only a founder of this startup can delete it. If it needs to go, ask a founder.</p>
      )}
    </Card>
  )
}
