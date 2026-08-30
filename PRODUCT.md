# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) with Server Components for reads, Server Actions for mutations,
and Route Handlers for external endpoints. TypeScript in strict mode. PostgreSQL with
Prisma. **UI: Tailwind CSS with shadcn/ui components.** Zod for validation. Auth.js
(NextAuth v5) is the working choice for authentication, confirmed at Milestone 1.
Self-hosted on a single personal VPS behind a reverse proxy.

## Users

Three distinct users, each on their own surface:

1. **Superadmin** — the platform owner. Creates and deletes gym locations (tenants).
   Works occasionally, from a desk, in short administrative sessions.
2. **Admin** — a platform supervisor. Monitors every location from one consolidated
   read-only dashboard. Never edits anything. Wants to see how locations are
   performing without operating them.
3. **Tenant user** — the person running one gym location. One account per location,
   with full access to that location's system. This is the heaviest user by far:
   they work in the software all day at a front desk, enrolling members, taking
   renewal payments, selling retail items, and recording expenses. Often mid-task
   with a customer standing in front of them, so speed and scan-ability matter more
   than depth.

Gym members are subjects in the system, not users — they never log in.

## Product Purpose

GMS lets one operator run gym-management software for many physical locations. A
superadmin provisions a fresh, self-contained system per location; each location then
operates independently inside it, while an admin watches all of them at once.

Success means: a new location can be provisioned and operating the same day, and a
front-desk user can complete the common tasks — enroll a member, take a renewal,
ring up a retail sale — quickly and without training.

## Positioning

Most gym software is single-tenant, sold to one gym at a time. GMS is built for an
operator running several locations: provisioning is a first-class feature, and the
supervisory layer over all locations exists from day one rather than being bolted on.

It also combines two things gyms usually run separately: membership management and a
retail/inventory back office (supplements, protein bars, drinks). The front desk uses
one system for both.

## Operating Context

- **Front desk, in person.** The tenant user works with a customer present. Renewals
  are looked up by scanning a printed barcode. Retail sales are rung up by scanning
  or searching a product. Interruption is constant.
- **Cash-heavy, manual payments.** There is no payment gateway. Money is taken in
  person and recorded against a named payment method (cash, card, bank transfer,
  mobile wallet). The software is a record of what happened, not a processor.
- **Monthly renewal rhythm.** The membership business runs on a monthly cycle. The
  Renewals list — who is due, who is overdue — is the recurring daily job.
- **Pakistan.** Single market, single currency.

## Capabilities and Constraints

**Confirmed capabilities**

- Superadmin: create a tenant (name, location, login email, login password), delete a
  tenant, list all tenants. Creating a tenant provisions an empty system and its one
  login account.
- Admin: read-only view of all tenants, a consolidated all-locations dashboard, and
  drill-down into any single tenant. No write access anywhere.
- Tenant system: gym membership (packages, 1:1 member-membership, monthly renewals,
  barcode renewal lookup), inventory/stock, retail invoicing, suppliers and purchase
  invoices, expenses, payment methods, reports, and a raw-record data viewer.

**Durable constraints**

- **One user account per tenant.** No staff sub-accounts, no roles inside a location.
- **A member has exactly one membership.** Strictly 1:1.
- **Barcodes are for renewal lookup only** — not check-in or attendance.
- **No cost-price tracking.** Products carry a sale price only. Purchase invoices
  record what a supplier charged but never write it back to a product. There is
  therefore no gross-profit or stock-value figure anywhere in the product.
- **No tax/VAT, no refunds or returns.**
- **No payment gateway.** All payments are recorded manually.
- **Single locale and currency: en-PK, PKR (Rs), Asia/Karachi.** No multi-currency,
  no internationalization.
- Multi-tenancy is shared-database, shared-schema; tenant isolation is enforced in
  application code, which makes the data-access layer the most security-critical part
  of the system.
- Single personal VPS hosts both the application and the database.

**Terminology** — Tenant (one gym location and its system), Package (a membership
plan: duration + price), Membership (a member's enrolment, renewed monthly), Tenant
user (the single account for one location).

**Explicitly undecided** — tenant routing (subdomain vs path); whether more than one
superadmin exists; whether tenant deletion is hard or soft; barcode symbology; where
member photos are stored; the exact metrics on the admin dashboard.

## Brand Commitments

**Product name: Iron Reserve.** ("GMS" is a working label in the planning documents
and the repository folder, not the product name.)

A visual identity already exists and is binding, supplied as Google Stitch output in
[stitch_maroon_minimalist_gym_portal/](stitch_maroon_minimalist_gym_portal/). Two
`DESIGN.md` variants are present; **`iron_reserve_2/DESIGN.md` is the authority** —
it is the same identity tuned for dense administrative screens, adding semantic
success/warning colors, a tabular `data-mono` scale, `body-sm` for data grids, a
1440px container, and explicit breakpoints.

Binding commitments:

- **Primary Maroon `#800000`** — used with restraint: primary actions, active states,
  critical status. Deep maroon `#570000` for primary text-on-light contexts.
- **Surface `#FCF9F8`** page background; containers and tables pure `#FFFFFF`.
- **Text `#1C1B1B`** (deep charcoal, never pure black); secondary `#5D5F5F`.
- **Inter** throughout — headlines at heavy weights with tight tracking;
  `label-caps` (12px/700/0.08em) for table headers and metadata.
- **No shadows, no gradients, no blurs.** Depth comes from 1px `#E5E2E1` borders and
  tonal layering. This is explicit and absolute in the design system.
- **4px (0.25rem) radius** on all elements. No pill shapes, including status chips.
- Active navigation items use a **4px left maroon border**, not a background fill.
- Stated philosophy: "High-Performance Minimalism" — efficiency over embellishment,
  architectural rigor, premium utility.

**Caveat on the mockups:** the Stitch screens were generated before the scope was
settled and some drift outside it. `gym_membership_dashboard/` in particular is a
member-facing view showing classes and attendance — both explicitly out of scope, and
members never log in. Treat the mockups as authority on *visual language*, not on
*scope or information architecture*; requirements.md governs what exists.

## Evidence on Hand

- [plan.md](plan.md) — architecture, tech stack, multi-tenancy strategy, milestones,
  data model, permission matrix.
- [requirements.md](requirements.md) — full requirements specification: 55 functional
  requirements across three milestones, non-functional requirements, data model, open
  questions, and a decision log.
- No code exists yet. No design assets, screenshots, logo files, or copy have been
  supplied. There are no customers, testimonials, benchmarks, or pricing figures —
  future work must not fabricate any.

## Product Principles

1. **The front desk is the product.** The tenant user works the software all day with
   a customer waiting. Their common paths — renew, sell, enroll — must be the fastest
   things in the system. The two platform surfaces are administrative by comparison.
2. **Provisioning is a feature, not setup.** Creating a location is four fields and
   yields a working, empty system. Nothing about it should feel like installation.
3. **Record, don't process.** GMS documents money that changed hands in person. It
   never moves money itself. Every figure traces to a manual entry against a named
   payment method.
4. **Read and write are separate powers.** The admin sees everything and changes
   nothing; only the superadmin creates or destroys. This separation is enforced in
   code, not convention, and the interface should make each role's reach obvious.
5. **Deliberately narrow.** The absent features — profit reporting, tax, refunds,
   staff roles, attendance — are decisions, not gaps. Do not design affordances that
   imply them.

## Accessibility & Inclusion

No product-specific standard has been established. Note that the front-desk context
(fast repeated data entry, barcode scanning, possible glare and shared screens)
argues for large targets, high contrast, and full keyboard operability regardless of
a formal target being set.
