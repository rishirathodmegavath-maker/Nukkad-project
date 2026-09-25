import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { DesktopSidebar, MobileDrawer } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { Toaster } from '@/components/ui/Toaster'
import { IncomingMessageToaster } from '@/components/domain/IncomingMessageToaster'
import { useAppearanceSync } from '@/hooks/useAppearanceSync'

export function AppShell() {
  useAppearanceSync()
  return (
    <div className="flex min-h-screen bg-canvas">
      <DesktopSidebar />
      <MobileDrawer />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 py-6 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto">
          {/* A page's code loads on demand; the sidebar and top bar stay put while it does. */}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
      <IncomingMessageToaster />
      <Toaster />
    </div>
  )
}

