import type { ReactNode } from 'react'
import { CalendarDays, ChartColumn, Lightbulb, MoveRight, Rocket, ShieldCheck, Users, Zap, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
// A photo of the team at work, imported (not referenced from /public) so the build content-hashes it. It is the
// artwork from the client's login design; swap the file for a higher-resolution version of the same shot to
// sharpen it — nothing else needs to change.
import heroPhotoUrl from '@/assets/login-hero.jpg'

const HERO_CHIPS = ['Startups', 'Founders', 'Investors', 'Builders', 'Ideas', 'Opportunities']

const HERO_FEATURES: Array<{ icon: LucideIcon; title: string; caption: string }> = [
  { icon: Rocket, title: 'Startups', caption: 'Discover & showcase' },
  { icon: Users, title: 'People', caption: 'Connect & collaborate' },
  { icon: ChartColumn, title: 'Investors', caption: 'Find capital & network' },
  { icon: Lightbulb, title: 'Ideas', caption: 'Share & get feedback' },
  { icon: CalendarDays, title: 'Opportunities', caption: 'Jobs, grants, events & more' },
]

const BENEFITS: Array<{ icon: LucideIcon; title: string; caption: string }> = [
  { icon: Zap, title: 'Free to join', caption: 'Build your profile' },
  { icon: Users, title: 'Join the ecosystem', caption: 'Founders, builders, investors' },
  { icon: ShieldCheck, title: 'Get opportunities', caption: 'Jobs, grants, events & more' },
]

/** Words "written on the window" in the design — decorative only. */
const WINDOW_WORDS = ['Ideas', 'People', 'Capital', 'Community', 'Opportunities']

/** The sky through the window, top to bottom (sampled from the design). Its last stop is the photo's own top-edge
 * color, so the sky meets the photograph without a visible seam. */
const WINDOW_SKY = 'linear-gradient(to bottom, #0c1023 0%, #181c3d 26%, #28294f 46%, #4e436d 63%, #745379 80%, #ae7574 100%)'

/** Fades the photo's top and bottom edges into the backdrop instead of ending in a hard line. */
const PHOTO_EDGE_MASK = 'linear-gradient(to bottom, transparent 0%, #000 30%, #000 80%, transparent 100%)'

/** Softens the window's left frame edge, so the pane reads as part of the room rather than a pasted rectangle. */
const WINDOW_EDGE_MASK = 'linear-gradient(to right, transparent 0%, #000 22%)'

/** The window's mullion dissolves into the photo's own (which sits at the same place) instead of stopping dead. */
const MULLION_MASK = 'linear-gradient(to bottom, #000 0%, #000 75%, transparent 100%)'

/** The left pane's shading fades out toward the photo, so it doesn't leave a line where the two meet. */
const PANE_SHADE_MASK = 'linear-gradient(to bottom, #000 0%, #000 40%, transparent 92%)'

/** The sky keeps going for a while behind the photo, from the rose it ends the upper area with down to nothing.
 * The photo's masked top edge lets this show through, which is what makes the sky and the photo one scene —
 * without it the fade would reveal the near-black backdrop and leave a hard line across the window. */
const SKY_BEHIND_PHOTO = 'linear-gradient(to bottom, #ae7574 0%, rgba(174, 117, 116, 0) 100%)'

function Arrow() {
  return (
    <MoveRight
      aria-hidden="true"
      strokeWidth={1.25}
      className="mx-[0.28em] inline-block h-[0.55em] w-[0.8em] align-middle text-white/70"
    />
  )
}

/** The dark, always-dark half of the page (it is artwork, not UI, so it doesn't follow the light/dark theme). */
function HeroPanel() {
  return (
    <aside className="relative hidden min-h-screen w-[58%] shrink-0 flex-col overflow-hidden bg-[#05060d] text-white lg:flex xl:w-[60%]">
      <div className="relative flex flex-1 flex-col justify-between gap-6 px-[6.5%] pb-5 pt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[54%] right-0"
          style={{ background: WINDOW_SKY, maskImage: WINDOW_EDGE_MASK, WebkitMaskImage: WINDOW_EDGE_MASK }}
        >
          {/* The darker left pane, the window's mullion, and the words written on the glass. */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#05060d]/60 to-transparent to-55%"
            style={{ maskImage: PANE_SHADE_MASK, WebkitMaskImage: PANE_SHADE_MASK }}
          />
          <div
            className="absolute inset-y-0 left-[38%] w-[3.5%] bg-gradient-to-b from-[#03040b] to-[#342d43]"
            style={{ maskImage: MULLION_MASK, WebkitMaskImage: MULLION_MASK }}
          />
          <div
            className="absolute right-[12%] top-[12%] flex -rotate-[4deg] flex-col gap-[0.1em] text-[clamp(0.95rem,1.5vw,1.75rem)] leading-tight text-white/55"
            style={{ fontFamily: "'Segoe Script', 'Bradley Hand', 'Lucida Handwriting', cursive" }}
          >
            {WINDOW_WORDS.map((word, i) => (
              <span key={word} style={{ marginLeft: `${[0, 4, 2, 8, 12][i]}%` }}>
                {word}
              </span>
            ))}
          </div>
        </div>
        {/* Keeps the headline readable where it crosses the window. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05060d]/85 via-[#05060d]/40 to-transparent to-70%" />

        <header className="relative flex items-center gap-3">
          <Logo className="size-10" />
          <span className="text-[1.65rem] font-semibold tracking-tight">BuildAdda</span>
        </header>

        <div className="relative">
          {/* Two fixed lines, as designed — never let an arrow orphan itself onto a line of its own. */}
          <h2 className="text-[clamp(2.1rem,3.3vw,4rem)] font-extrabold leading-[1.08] tracking-tight">
            <span className="block whitespace-nowrap">
              Discover
              <Arrow />
              Connect
              <Arrow />
            </span>
            <span className="block whitespace-nowrap">
              Build
              <Arrow />
              <span className="text-brand-500">Grow</span>
            </span>
          </h2>
          <p className="mt-4 max-w-[31rem] text-[clamp(1rem,1.25vw,1.25rem)] leading-normal text-neutral-300">
            Find the people, startups, ideas and opportunities to build your next thing — all in one place.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {HERO_CHIPS.map((chip) => (
              <li key={chip} className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-neutral-200 backdrop-blur-sm">
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 left-[54%] h-2/3"
          style={{ background: SKY_BEHIND_PHOTO, maskImage: WINDOW_EDGE_MASK, WebkitMaskImage: WINDOW_EDGE_MASK }}
        />
        {/* On a short screen the photo is cropped from its sides rather than pushing the page taller. */}
        <img
          src={heroPhotoUrl}
          alt=""
          aria-hidden="true"
          width={963}
          height={260}
          draggable={false}
          className="relative block h-auto max-h-[38vh] w-full select-none object-cover object-[50%_35%]"
          style={{ maskImage: PHOTO_EDGE_MASK, WebkitMaskImage: PHOTO_EDGE_MASK }}
        />
      </div>

      <ul className="relative grid grid-cols-3 gap-x-4 gap-y-5 px-[6.5%] pb-6 pt-1 xl:grid-cols-5">
        {HERO_FEATURES.map(({ icon: Icon, title, caption }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-6 shrink-0 text-white/85" />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/55">{caption}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/** Three short reasons to sign up, pinned to the foot of the form column. */
function BenefitStrip() {
  return (
    <div className="px-6 pb-6">
      {/* Side by side when the column is wide (tablet portrait, big desktop); stacked when it is narrow (phone, and
          the 1024-1279px range where the hero panel takes most of the width). */}
      <ul className="mx-auto grid w-full max-w-[34rem] gap-4 rounded-2xl border border-border-subtle bg-surface/70 px-5 py-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, caption }) => (
          <li key={title} className="flex items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight text-fg">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{caption}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[11px] text-fg-muted">© {new Date().getFullYear()} BuildAdda. All rights reserved.</p>
    </div>
  )
}

interface LoginLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  /** Rendered in a tinted call-out under the form — the "create an account" prompt. */
  footer?: ReactNode
}

/** The client-designed sign-in screen: a hero panel on the left (large screens), the form on the right.
 *  Only the login page uses it — the other auth pages keep AuthLayout. */
export function LoginLayout({ title, subtitle, children, footer }: LoginLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <HeroPanel />

      <div className="flex min-h-screen flex-1 flex-col bg-canvas">
        <div className="flex flex-1 items-center justify-center px-6 py-6">
          <div className="w-full max-w-[26.5rem]">
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <Logo />
              <span className="text-lg font-bold tracking-tight text-fg">BuildAdda</span>
            </div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-fg">{title}</h1>
            <p className="mb-8 mt-1.5 text-sm text-fg-muted">{subtitle}</p>
            {children}
            {footer && (
              <div className="mt-5 rounded-xl border border-brand-500/15 bg-brand-500/[0.06] px-4 py-3.5 text-center text-sm text-fg-secondary">
                {footer}
              </div>
            )}
          </div>
        </div>
        <BenefitStrip />
      </div>
    </div>
  )
}
