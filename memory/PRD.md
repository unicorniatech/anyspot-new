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

## Phase 3 — Backlog (priority order)
- **P0** Auth (Emergent Google login recommended) — required before payments + multi-tenant partners
- **P0** Stripe Checkout — purchase credit packs (test keys in env)
- **P1** Platform Admin Panel — users, studios, transactions overview
- **P2** Recurring class schedules (every Mon @ 7am for 8 weeks)
- **P2** Walk waitlist until promotion succeeds (current code promotes 1 user only)
- **P2** Reviews + ratings, push notifications, mobile polish

## Next Action Items
1. Confirm auth approach (Emergent Google vs JWT)
2. Stripe credit-pack checkout
3. Platform Admin Panel
