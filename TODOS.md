# DriverDirect — Deferred Items

Items explicitly deferred from the Settings Redesign (2026-05-17).

## Settings — Future Sections

- [ ] **User Management** — team members, roles, invite links (requires auth)
- [ ] **Billing** — subscription plan, usage limits, payment method (requires billing infra)
- [ ] **Usage Dashboard** — API calls per provider, token usage, cost tracking
- [ ] **Notifications** — run completion alerts, error notifications

## UX Improvements

- [ ] **Theme toggle in Settings** — currently in Header (AnimatedThemeToggler). Move to Settings > General section for consistency. Low effort.
- [ ] **Test infrastructure** — no test runner exists. Add Vitest + React Testing Library. 20 smoke tests identified (see test plan at `~/.gstack/projects/ShreyKansal-DriverDirect/main-test-plan-*.md`)

## SaaS Readiness Checklist (pre-handoff)

These are required BEFORE handing the product to end users:

- [ ] Auth (NextAuth is present but verify registration/login flows work end-to-end)
- [ ] Multi-tenancy / project isolation (projects are per-user, not shared)
- [ ] Rate limiting on API endpoints
- [ ] CSRF protection audit (flagged in prior review as separate security task)
- [ ] Error boundaries on all major UI sections
- [ ] 500/404 page handling
