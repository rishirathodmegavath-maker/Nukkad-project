import { create } from 'zustand'

const SIDEBAR_KEY = 'buildadda.sidebarCollapsed'
/** Pre-rebrand key name — migrated on first read below so an existing preference isn't lost. */
const LEGACY_SIDEBAR_KEY = 'nukkad.sidebarCollapsed'

function getStoredSidebar(): boolean {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(SIDEBAR_KEY) === null) {
    const legacy = localStorage.getItem(LEGACY_SIDEBAR_KEY)
    if (legacy !== null) {
      localStorage.setItem(SIDEBAR_KEY, legacy)
      localStorage.removeItem(LEGACY_SIDEBAR_KEY)
    }
  }
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

interface UiState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: getStoredSidebar(),
  mobileNavOpen: false,
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return { sidebarCollapsed: next }
    }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
