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

## Phase 2 — Backlog (priority order)
- **P0** Auth (custom or Emergent Google) — required before payments
- **P0** Stripe Checkout — purchase credit packs
- **P1** Partner Dashboard — studio reservations, revenue insights
- **P1** Add Class flow — studio owners list new sessions
- **P2** Platform Admin Panel — users, studios, transactions overview
- **P2** Mobile-optimized polish, waitlists, recurring schedules
- **P2** Reviews + ratings submission

## Architecture
- Backend: FastAPI single file (`/app/backend/server.py`), Motor (async MongoDB), Pydantic v2 models.
- Frontend: React 19 + react-router-dom v7 + @tanstack/react-query + Tailwind + shadcn UI + sonner + lucide-react + framer-motion.
- Pages under `/app/frontend/src/pages/`, shared in `/app/frontend/src/components/`, API in `/app/frontend/src/lib/api.js`.

## Endpoints
- GET /api/studios, /api/studios/{id}, /api/studios/{id}/classes
- GET /api/classes?category=&max_credits=&search=&time_of_day=
- GET /api/classes/{id}
- GET /api/me
- GET /api/bookings, POST /api/bookings, POST /api/bookings/{id}/cancel

## Next Action Items
1. Decide auth approach for Phase 2 (Emergent Google vs JWT)
2. Stripe integration for credit packs (test keys already in env)
3. Partner dashboard + Add Class flow
4. Admin panel
