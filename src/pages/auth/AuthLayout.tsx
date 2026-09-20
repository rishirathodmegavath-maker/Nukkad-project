import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-neutral-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(108,71,255,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(247,140,10,0.25), transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-2">
          <Logo size="md" />
          <span className="text-xl font-bold tracking-tight">BuildAdda</span>
        </div>
        <div className="relative">
          <p className="text-3xl font-bold leading-tight tracking-tight">
            Discover → Connect → Build → Opportunity
          </p>
          <p className="mt-4 text-neutral-400 max-w-sm">
            Find the people, ideas and startups worth building your next thing around — and the chapter, capital and
            opportunities to take it further.
          </p>
        </div>
        <p className="relative text-xs text-neutral-500">© {new Date().getFullYear()} BuildAdda. All rights reserved.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Logo />
            <span className="text-lg font-bold tracking-tight text-fg">BuildAdda</span>
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">{title}</h1>
          <p className="text-sm text-fg-muted mt-1.5 mb-8">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
