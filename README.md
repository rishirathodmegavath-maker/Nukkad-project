# Nukkad V1

Discover → Connect → Build → Opportunity. A web app for builders to discover people,
ideas, startups and opportunities, and act on them.

This is the **frontend only**, wired to a typed mock service layer with realistic seed
data. No backend exists yet — see [Backend integration](#backend-integration) below for
how to connect one.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (CSS-variable design tokens — see [Design system](#design-system))
- React Router v6
- TanStack Query (data fetching/caching over the mock service layer)
- Zustand (auth session + UI state)

## Getting started

```bash
npm install
npm run dev       # http://localhost:5174
```

Login accepts any email/password (mock auth). The signed-in demo user is Aarav Mehta.

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Design system

All visual tokens — brand/accent/neutral colors, semantic surface & text roles, type
scale, radius, shadows — live in one file:

```
src/styles/tokens.css
```

Change a value there and it propagates everywhere (components consume the semantic
Tailwind utilities like `bg-surface`, `text-fg-muted`, `border-border`, `bg-brand-500`,
generated from these tokens via `src/styles/index.css`'s `@theme` block). Dark mode is a
`data-theme="dark"` attribute on `<html>`, toggled from `src/store/ui.store.ts`.

> **Note on the LuxoRides Figma source:** the Figma REST API was rate-limited (HTTP 429)
> for the full session this app was built in, across two personal access tokens and
> multiple cooldown windows, so no colors/type/spacing were actually extracted from the
> LuxoRides file. The one thing that *was* confirmed via a successful shallow fetch is
> that the file's only canvas ("Chauffeur's App Design") contains exclusively mobile
> driver-app screens (splash/OTP/KYC uploads/duty-trip flow) — no desktop sidebar, table,
> or dashboard patterns exist in it to copy directly. The current visual system was
> designed fresh in that spirit (dark, premium, card-based) rather than extracted. If
> Figma access recovers, re-run the extraction and update `tokens.css` — the rest of the
> app should not need to change.

## Architecture

```
src/
  types/        typed domain models (User, Idea, Startup, Opportunity, Chapter,
                Investor, Event, Post, Notification, Message, Resource, ...)
  services/     one file per domain — the only thing that should change to swap
                mock data for a real backend (see below)
  services/mock/  seed data + in-memory "db" the mock services read/write
  store/        zustand: auth session, UI (theme/sidebar), toasts
  hooks/        shared react-query hooks (useCurrentUser, useUser, useNotifications, ...)
  components/ui/      design-system primitives (Button, Card, Input, Modal, Tabs, ...)
  components/layout/  app shell (sidebar, topbar, mobile drawer)
  components/domain/  domain cards & composed widgets (PersonCard, IdeaCard, ...)
  pages/        one folder per module, matching the route tree in routes/AppRoutes.tsx
```

The core relationship graph (`User ↔ Idea ↔ Startup ↔ Opportunity ↔ Chapter ↔
Investor`) is modeled directly in the types and mock data so new features can plug into
existing entities rather than bolting on parallel ones.

### Backend integration

Every function in `src/services/*.service.ts` has the exact async signature a real API
call would have (`Promise<T>`, typed payloads). To connect a real backend, replace each
function's body with a `fetch`/API-client call — no UI or hook code should need to
change, since components only ever import from `services/`, never from
`services/mock/` directly.

## What's deferred (per V1 scope)

Not built, by design — see `Nukkad_V1_Refined_Scope.pdf`: full Academy/LMS, advanced AI
matching (rules-based only for now), investment execution (introductions only, no money
movement), video calling, advanced chapter analytics, full college management, complex
payments, advanced feed ranking, complex mentorship platform.

## Release notes

### v1.0.0

First production-verified release. A real Spring Boot/MySQL backend has since replaced
the mock service layer this doc describes above (the service-layer contract stayed
stable, per the "Backend integration" section) — that background is kept here as
project history, not current architecture.

Areas covered by end-to-end production verification: security hardening (CSP,
authorization, IDOR/CORS/actuator regression checks), Networks (connections, requests,
blocking), Feed, Ideas, Startups, Opportunities, Chapters, Events, Resources, Messaging
(direct + group chat, WebSocket reconnect resync), Notifications, upload reliability
(avatar/cover/resource, crop flow), Saved Posts (dedicated server-side query, sorting,
filters), deep links, and responsive layout (desktop/laptop/mobile).

Known, deliberately deferred issues at this release — see the Final E2E report for
detail: a chapter cover-image URL field that accepts hosts the CSP doesn't allow-list,
event attendee visibility being open to any authenticated user (matches current backend
design), and a few unconfirmed/low-severity UI timing observations.
