import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, X, Bell, Sun, Moon, User, Settings, LogOut } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { Avatar } from '@/components/ui/Avatar'
import { DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/DropdownMenu'
import { GlobalSearchBox } from '@/components/domain/GlobalSearchBox'
import { MessagesMenu } from '@/components/domain/MessagesMenu'
import { IconButton, iconButtonClasses, iconButtonActiveClasses } from '@/components/ui/IconButton'
import { NotificationDot } from '@/components/ui/NotificationDot'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

export function Topbar() {
  const navigate = useNavigate()
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const theme = useThemeStore((s) => s.theme)
  const setThemePreference = useThemeStore((s) => s.setThemePreference)
  const toggleTheme = () => setThemePreference(theme === 'dark' ? 'light' : 'dark')
  const logout = useAuthStore((s) => s.logout)
  const { data: currentUser } = useCurrentUser()
  const { data: unreadNotifs = 0 } = useUnreadNotificationCount()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  async function handleLogout() {
    await logout()
    toast.info('You’ve been logged out.')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-header/90 backdrop-blur-md">
      {/* Same width and side gutters as <main>, so the search box lines up with the page content. */}
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 lg:px-8">
        {/* Mobile Drawer Trigger */}
        <IconButton
          label="Open mobile menu"
          onClick={() => setMobileNavOpen(true)}
          className={cn('lg:hidden', mobileSearchOpen && 'hidden')}
        >
          <Menu className="size-5" />
        </IconButton>

        <GlobalSearchBox variant="desktop" />

        {mobileSearchOpen ? (
          <>
            <GlobalSearchBox variant="mobile" />
            <IconButton label="Close search" onClick={() => setMobileSearchOpen(false)} className="sm:hidden">
              <X className="size-5" />
            </IconButton>
          </>
        ) : (
          <IconButton label="Open search" onClick={() => setMobileSearchOpen(true)} className="sm:hidden">
            <Search className="size-4.5" />
          </IconButton>
        )}

        <div className={cn('items-center gap-2 ml-auto', mobileSearchOpen ? 'hidden sm:flex' : 'flex')}>
          <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="size-4.5 text-amber-400" /> : <Moon className="size-4.5" />}
          </IconButton>

          <MessagesMenu />

          <NavLink
            to="/notifications"
            aria-label={unreadNotifs > 0 ? `Notifications, ${unreadNotifs} unread` : 'Notifications'}
            className={({ isActive }) => cn(iconButtonClasses, 'relative', isActive && iconButtonActiveClasses)}
          >
            <Bell className="size-4.5" aria-hidden="true" />
            <NotificationDot count={unreadNotifs} />
          </NavLink>

          <DropdownMenu
            trigger={
              <button className="ml-1 cursor-pointer rounded-full ring-2 ring-transparent hover:ring-brand-500/30 transition-all" aria-label="User profile menu">
                <Avatar src={currentUser?.avatarUrl} name={currentUser?.name ?? ''} size="sm" />
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-border/60 mb-1 bg-surface-sunken/40">
              <p className="text-sm font-bold text-fg truncate">{currentUser?.name}</p>
              <p className="text-xs text-fg-muted truncate mt-0.5">{currentUser?.headline || 'Member'}</p>
            </div>
            <DropdownItem icon={<User className="size-4 text-fg-brand" />} onClick={() => navigate(`/people/${currentUser?.id}`)}>
              View profile
            </DropdownItem>
            <DropdownItem icon={<Settings className="size-4" />} onClick={() => navigate('/settings')}>
              Settings
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<LogOut className="size-4 text-danger-500" />} danger onClick={handleLogout}>
              Log out
            </DropdownItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
