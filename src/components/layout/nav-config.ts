import {
  Home,
  Users,
  Lightbulb,
  Rocket,
  Briefcase,
  MapPin,
  Landmark,
  Rss,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  HandCoins,
} from 'lucide-react'

export const navSections = [
  {
    title: 'Core',
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/feed', label: 'Feed', icon: Rss, end: false },
      { to: '/people', label: 'People', icon: Users, end: false },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
    ],
  },
  {
    title: 'Venture Hub',
    items: [
      { to: '/ideas', label: 'Ideas', icon: Lightbulb, end: false },
      { to: '/startups', label: 'Startups', icon: Rocket, end: false },
      { to: '/opportunities', label: 'Opportunities', icon: Briefcase, end: false },
      { to: '/grants', label: 'Grants', icon: HandCoins, end: false },
    ],
  },
  {
    title: 'Community',
    items: [
      { to: '/chapters', label: 'Chapters', icon: MapPin, end: false },
      { to: '/investors', label: 'Investors', icon: Landmark, end: false },
      { to: '/events', label: 'Events', icon: CalendarDays, end: false },
      { to: '/resources', label: 'Resources', icon: FolderOpen, end: false },
    ],
  },
] as const

export const primaryNav = [
  ...navSections[0].items,
  ...navSections[1].items,
  ...navSections[2].items,
]

