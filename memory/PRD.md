# AnySpot — Product Requirements

## Original Problem Statement
Build AnySpot — a boutique fitness platform (re-skin of "Vitality"). 8 screens total spanning consumer + partner + admin journeys. Light theme: Tea Green (#CBF3D2), Coral Glow (#FF8552), Deep Twilight (#0E0E52).

## User Personas
- **Consumer (Alex)**: Wants one membership for many boutique studios. Discovers, books, manages credits.
- **Studio Partner**: Lists studios + classes, manages reservations and revenue (Phase 2).
- **Platform Admin**: Oversees users, studios, transactions (Phase 2).

## Core Static Requirements
- Light, community-focused aesthetic (Outfit headings, Manrope body)
- Credit-based booking economy
- Mobile responsive

## Phase 1 — Shipped (2026-06-09)
**Goal: Aha moment — feel the discover→book→manage core value.**
- ✅ Landing (/) — hero, search, category chips, featured studios grid, CTA, footer
- ✅ Explore (/explore) — search + category + max-credits slider + time-of-day filters, class cards with Book
- ✅ Studio Profile (/studio/:id) — cover, vibe, amenities, gallery, instructor, sticky schedule w/ booking
- ✅ Dashboard (/dashboard) — credit balance, upcoming/past tabs, cancel w/ refund
- ✅ Backend: FastAPI + MongoDB, 4 seeded studios × 14 days × 3 slots = ~168 classes
- ✅ Demo user "demo-user", 24 starter credits, atomic credit deduction + spot decrement, cancel refund

## Phase 2 — Shipped (2026-06-09)
**Goal: Studio partner can run their business; waitlist closes the booking loop.**
- ✅ Partner Dashboard (`/partner`) — KPIs (7d/30d reservations, 7d credits, active classes), upcoming roster w/ fill bars, top classes leaderboard, classes table
- ✅ Add Class dialog (studio, category, title, instructor, start time, duration, credits, capacity, description)
- ✅ Edit Class + Delete Class (auto-cancels active bookings + refunds confirmed users)
- ✅ View Roster dialog per class (confirmed + waitlist pills)
- ✅ Waitlist: full classes auto-route to waitlist (no credit charge); confirmed cancel auto-promotes earliest waitlist user (deducts their credits, restores spot)
- ✅ Explore + Dashboard reflect waitlist state in UI

## Phase 3a — Shipped (2026-06-09)
**Goal: Real auth on protected routes; multi-user isolation.**
- ✅ Emergent Google Auth — `/login` with Continue-with-Google CTA, OAuth bounce + `/auth/session` exchange, httpOnly secure session cookie (7-day TTL) + Bearer-header fallback for tests
- ✅ Backend `get_current_user` dependency; all member endpoints (`/me`, `/bookings*`) and partner endpoints (`/partner/*`) require auth and use the authed `user_id`
- ✅ Public still open: `/api/studios*`, `/api/classes*`
- ✅ Multi-user isolation verified — two users do NOT see each other's bookings; waitlist auto-promotion works across users
- ✅ ProtectedRoute on `/dashboard` and `/partner` (redirect to `/login`); AppRouter handles `#session_id=...` callback synchronously to avoid race conditions
- ✅ Header: avatar dropdown (dashboard / partner / sign out) when authed; "Sign in" CTA otherwise
- ✅ New users start with 24 free credits; auth-me cached via react-query `["auth-me"]` and refetched after every booking mutation

## Phase 3b — Backlog (priority order)
- **P0** Stripe Checkout — credit pack purchase (test keys in env)
- **P1** Partner RBAC — link users to studio ownership (currently any logged-in user can hit `/partner`)
- **P1** Platform Admin Panel
- **P2** Split `server.py` into modules (auth/partner/public/seed) — file is ~650 lines
- **P2** Mongo indexes: unique on `user_sessions.session_token`, TTL on `expires_at`
- **P2** Walk-the-waitlist promotion (not just the first user)

## Next Action Items
1. Stripe credit-pack checkout
2. Partner ownership / RBAC
3. Admin panel
