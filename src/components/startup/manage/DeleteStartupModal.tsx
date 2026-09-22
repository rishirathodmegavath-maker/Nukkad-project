import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { deleteStartup } from '@/services/startups.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/store/toast.store'
import type { Startup } from '@/types'

/**
 * The confirmation before a startup is deleted for good. The founder has to type the startup's name, so it can't be
 * done by a stray click. If the server refuses (for example because job postings still exist for the startup) its
 * reason is shown here, in words, and nothing has been deleted.
 */
export function DeleteStartupModal({ startup, open, onClose }: { startup: Startup; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [typed, setTyped] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  const matches = typed.trim() === startup.name.trim()

  const mutation = useMutation({
    mutationFn: () => deleteStartup(startup.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['startup', startup.id] })
      queryClient.invalidateQueries({ queryKey: ['startups'] })
      toast.info(`${startup.name} was deleted`)
      navigate('/startups', { replace: true })
    },
    onError: (err) => setRefusal(err instanceof Error && err.message ? err.message : 'The startup couldn’t be deleted. Nothing was removed. Try again.'),
  })

  function close() {
    if (mutation.isPending) return
    setTyped('')
    setRefusal(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Delete this startup?"
      description="This is permanent and can’t be undone."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!matches} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete startup
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-secondary [overflow-wrap:anywhere]">
          <strong className="font-semibold text-fg">{startup.name}</strong> will be removed along with its team, followers, updates, open roles, materials and fundraising. People who follow it will no longer find it.
        </p>
        <Input
          id="delete-startup-confirm"
          label={`Type the startup’s name to confirm`}
          hint={startup.name}
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value)
            setRefusal(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches && !mutation.isPending) mutation.mutate()
          }}
          autoComplete="off"
          spellCheck={false}
        />
        {refusal && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-sm text-danger-500">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{refusal}</span>
          </p>
        )}
      </div>
    </Modal>
  )
}
