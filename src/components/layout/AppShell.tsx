import { Outlet } from 'react-router-dom'
import { DesktopSidebar, MobileDrawer } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { Toaster } from '@/components/ui/Toaster'
import { MessengerWidget } from '@/components/domain/MessengerWidget'
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
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <MessengerWidget />
      <IncomingMessageToaster />
      <Toaster />
    </div>
  )
}

