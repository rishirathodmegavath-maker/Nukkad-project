import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-styles'

/** Shown instead of Investor Discovery to anyone without an active Startup Profile — the backend refuses the
 *  underlying API calls too (InvestorCatalogService), so this is UX, not the real boundary. */
export function InvestorDiscoveryLocked() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/80 bg-surface-sunken px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface text-fg-muted shadow-xs">
        <Lock className="size-5" />
      </div>
      <div className="max-w-sm">
        <h2 className="text-lg font-bold text-fg">Find investors</h2>
        <p className="mt-1.5 text-sm text-fg-muted">
          Create your Startup Profile to discover investors that match your startup — by sector, stage, location and cheque size.
        </p>
      </div>
      <Link to="/startups/new" className={buttonClasses()}>
        Create Startup Profile
      </Link>
    </div>
  )
}
