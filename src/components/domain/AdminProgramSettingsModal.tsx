import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listPrograms } from '@/services/programs.service'
import { updateProgramSettings } from '@/services/admin.service'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/toast.store'
import type { Program, ProgramKey } from '@/types'

/** The only part of a program Admin can edit — its fixed content (copy, journey, benefits)
 *  lives in backend code, not here (see ProgramCatalog's own doc comment on the backend). One
 *  small modal for both SPARK and IGNITE rather than a page each, since there are exactly two. */
export function AdminProgramSettingsModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: programs, isLoading } = useQuery({ queryKey: ['programs'], queryFn: listPrograms })

  return (
    <Modal open onClose={onClose} title="Program settings" size="lg">
      {isLoading || !programs ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {programs.map((program) => (
            <ProgramSettingsSection key={program.key} program={program} onSaved={() => queryClient.invalidateQueries({ queryKey: ['programs'] })} />
          ))}
          <div className="flex justify-end -mx-5 -mb-5 border-t border-border-subtle px-5 pt-4 pb-5">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ProgramSettingsSection({ program, onSaved }: { program: Program; onSaved: () => void }) {
  const [applicationOpen, setApplicationOpen] = useState(program.applicationOpen)
  const [feeAmount, setFeeAmount] = useState(program.feeAmount != null ? String(program.feeAmount) : '')
  const [feeCurrency, setFeeCurrency] = useState(program.feeCurrency ?? '')
  const [enrollmentInfo, setEnrollmentInfo] = useState(program.enrollmentInfo ?? '')
  const [selective, setSelective] = useState(program.selective ?? false)

  const mutation = useMutation({
    mutationFn: () =>
      updateProgramSettings(program.key as ProgramKey, {
        applicationOpen,
        feeAmount: feeAmount.trim() ? Number(feeAmount) : null,
        feeCurrency: feeCurrency.trim() || null,
        enrollmentInfo: enrollmentInfo.trim() || null,
        selective,
      }),
    onSuccess: () => {
      toast.success(`${program.name} settings saved`)
      onSaved()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save settings'),
  })

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 p-4">
      <h3 className="text-base font-bold text-fg">{program.name}</h3>
      <label className="flex items-center gap-2 text-sm text-fg-secondary">
        <Checkbox checked={applicationOpen} onChange={(e) => setApplicationOpen(e.target.checked)} />
        Applications open
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Fee amount" hint="Optional" type="number" min={0} value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
        <Input label="Fee currency" hint="e.g. INR" value={feeCurrency} onChange={(e) => setFeeCurrency(e.target.value)} maxLength={10} />
      </div>
      <Input label="Enrollment info" hint="Shown on the program page" value={enrollmentInfo} onChange={(e) => setEnrollmentInfo(e.target.value)} maxLength={500} />
      <label className="flex items-center gap-2 text-sm text-fg-secondary">
        <Checkbox checked={selective} onChange={(e) => setSelective(e.target.checked)} />
        Selective process
      </label>
      <Button size="sm" className="self-end" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
        Save {program.name} settings
      </Button>
    </div>
  )
}
