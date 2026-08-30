# GMS — Gym Membership Software

Multi-tenant SaaS for managing gyms with multiple physical locations. Each location
gets its own self-contained management system. A platform team (superadmin + admin)
provisions and oversees those systems.

---

## 1. Product overview

| Concept | Meaning |
| --- | --- |
| **Platform** | The whole SaaS. Owned and operated by us. |
| **Tenant** | One gym location and its management system. Data is scoped to the tenant. |
| **Superadmin** | Platform owner. Full CRUD over every tenant, every platform user, every setting. The **only** role that can create or delete a tenant. Can access any location's management system. |
| **Admin** | Platform **supervisor**. Read-only oversight across **all** tenants — can view every tenant, its data, and its reports, but cannot create, edit, suspend, or delete anything. Pure monitoring role. |
| **Location staff** | Users that belong to a single tenant — manager, front desk, trainer, etc. Scoped entirely to their location. Roles for this tier are defined in Milestone 3. |
| **Member** | A gym customer of a specific location. Not a login user in early milestones (TBD in Milestone 3). |

### Role hierarchy

```
Superadmin          platform-wide, full control (only role that can create/delete tenants)
   └── Admin        platform-wide, READ-ONLY oversight of every tenant
         └── Location staff   scoped to one tenant
               └── (Member)   scoped to one tenant, scope TBD
```

---

## 2. Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend + backend | **Next.js (App Router)** | Server Components for reads, **Server Actions** for mutations, **Route Handlers** for anything external (webhooks, integrations, health checks). |
| Language | **TypeScript** | Strict mode. |
| Database | **PostgreSQL** | Single instance on the VPS. |
| ORM | **Prisma** | Migrations checked into the repo. |
| Auth | **Auth.js (NextAuth v5)** — credentials + session | Final decision at Milestone 1 start. JWT or DB sessions TBD. |
| Styling | **Tailwind CSS** | Component layer TBD (shadcn/ui likely). |
| Validation | **Zod** | Shared schemas for Server Action inputs and forms. |
| Hosting | **Personal VPS** | Node process behind a reverse proxy (Nginx/Caddy), Postgres on the same box, TLS via Let's Encrypt. |
| Process mgmt | **PM2** or **systemd** | TBD. |
| CI/CD | GitHub Actions → SSH deploy, or a `git pull && build && restart` script | TBD. |

---

## 3. Multi-tenancy model

**Strategy: shared database, shared schema.**

- One PostgreSQL database, one set of tables.
- Every tenant-scoped row carries a `tenantId` (FK to `Tenant`).
- Isolation is enforced in the application layer:
  - A central data-access layer that **always** injects the current `tenantId` into
    every query — no raw model access from feature code.
  - The current tenant is resolved from the authenticated session (staff) or from
    the route (`/t/[tenantSlug]/...` or a subdomain — TBD) for platform users
    viewing a specific location.
  - Superadmin/admin queries can opt out of the tenant filter explicitly (admin
    reads only; superadmin reads and writes).
- Consider Postgres **Row-Level Security** as a second line of defense (later, not v1).

### Why this strategy
Simplest to run and back up on a single VPS, cleanest Prisma story, cheapest
operationally. Trade-off: isolation is code-enforced, so the tenant-scoping layer
is the single most security-critical piece of the codebase and must be tested hard.

---

## 4. Milestones

Scope is deliberately staged. Feature detail for each milestone is locked in when
that milestone starts.

### Milestone 1 — Superadmin
The platform control plane.

- Auth for platform users (superadmin, admin).
- Superadmin dashboard.
- Full CRUD over **tenants** (locations): create, view, edit, suspend, delete.
- Full CRUD over **platform users** (create/disable admins and other superadmins).
- Ability to open/access any tenant's management system.
- Audit log of platform-level actions.
- Core Prisma schema: `Tenant`, `User`, `Role`, `AuditLog`.

**Done when:** a superadmin can log in, create a tenant, create an admin, and
enter any tenant.

### Milestone 2 — Admin (supervisor)
Read-only oversight of the whole platform.

- Admin dashboard: list of **all** tenants with status and key metrics.
- Drill into any tenant — view its data, activity, and reports.
- Cross-tenant reporting / rollups (totals across all locations).
- **No mutations anywhere.** Admin cannot create, edit, suspend, or delete a
  tenant, cannot manage platform users, cannot change any location's data.

**Done when:** an admin can log in and inspect every tenant and platform-wide
reports, with every write path denied.

### Milestone 3 — The gym management system (used by locations)
The actual per-location software. **Feature scope TBD — to be defined when we reach
this milestone.** Likely candidates (not committed): members & memberships, billing
& payments, check-in/attendance, staff/trainers/classes.

---

## 5. Data model (initial sketch — Milestones 1–2)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  status    TenantStatus @default(ACTIVE)   // ACTIVE | SUSPENDED
  createdById String // User.id of the superadmin who created it
  createdBy   User   @relation("TenantCreatedBy", fields: [createdById], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]   @relation("TenantUsers")
  // location-scoped models attach here from Milestone 3 on
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role                          // SUPERADMIN | ADMIN | (staff roles later)
  tenantId     String?  // null for platform users; set for location staff
  tenant       Tenant?  @relation("TenantUsers", fields: [tenantId], references: [id])
  createdTenants Tenant[] @relation("TenantCreatedBy")   // populated for SUPERADMINs
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String
  target    String   // e.g. "Tenant:abc123"
  meta      Json?
  tenantId  String?  // null for platform-level actions
  createdAt DateTime @default(now())
}

enum Role         { SUPERADMIN ADMIN }   // extended in Milestone 3
enum TenantStatus { ACTIVE SUSPENDED }
enum UserStatus   { ACTIVE DISABLED }
```

---

## 6. Role / permission matrix (Milestones 1–2)

| Capability | Superadmin | Admin |
| --- | :---: | :---: |
| Log into platform | ✅ | ✅ |
| View all tenants + their data + reports | ✅ | ✅ |
| Cross-tenant / platform-wide reporting | ✅ | ✅ |
| Create tenant / provision management system | ✅ | ❌ |
| Edit tenant | ✅ | ❌ |
| Suspend / reactivate tenant | ✅ | ❌ |
| Delete tenant | ✅ | ❌ |
| Act inside a tenant's management system (writes) | ✅ | ❌ |
| Create / disable admin users | ✅ | ❌ |
| Create / disable superadmin users | ✅ | ❌ |
| View platform audit log | ✅ | ✅ (read) |
| Change platform settings | ✅ | ❌ |

Admin is **read-only everywhere**. Every write path checks `role === SUPERADMIN`.

---

## 7. Project structure (proposed)

```
gms/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (platform)/            # superadmin + admin UI
│   │   │   ├── login/
│   │   │   ├── superadmin/
│   │   │   └── admin/             # read-only dashboards + reports
│   │   ├── (tenant)/
│   │   │   └── t/[tenantSlug]/    # per-location management system (M3)
│   │   └── api/                   # route handlers: webhooks, health
│   ├── server/
│   │   ├── auth/                  # Auth.js config, session helpers, role guards
│   │   ├── db/                    # Prisma client + tenant-scoping layer
│   │   ├── actions/               # Server Actions, grouped by domain
│   │   └── services/              # business logic (provisioning, audit, reports)
│   ├── lib/                       # shared utils
│   ├── schemas/                   # Zod schemas
│   └── components/
├── plan.md
└── README.md
```

---

## 8. Cross-cutting concerns

- **Security:** the tenant-scoping data layer is the critical control. Every
  tenant-scoped query goes through it; direct Prisma model access is disallowed
  outside `src/server/db`. Add tests that assert cross-tenant reads/writes fail.
- **Authorization:** a single `requireRole()` guard wraps every Server Action and
  protected page. Admin sessions can reach read paths only — mutations hard-fail
  for any role below `SUPERADMIN`. Test that every mutation denies an admin.
- **Auth:** password hashing with `argon2` or `bcrypt`. Session strategy decided
  at M1. Rate-limit login.
- **Audit:** every create/update/delete by a platform user is written to `AuditLog`.
- **Migrations:** `prisma migrate` only; never edit the DB by hand. Deploy runs
  `prisma migrate deploy`.
- **Backups:** nightly `pg_dump` on the VPS, off-box copy. Set up before M2 ships.
- **Env config:** `.env` for local, real secrets on the VPS only. `DATABASE_URL`,
  `NEXTAUTH_SECRET`, etc. documented in `.env.example`.
- **Seeding:** a seed script creates the first superadmin from env vars.

---

## 9. Open questions

- Tenant routing: subdomain (`acme.gms.app`) vs path (`/t/acme`)?
- Auth.js session strategy: JWT vs database sessions?
- Does "delete tenant" hard-delete or soft-delete (retain data for N days)?
- Can there be more than one superadmin? (schema allows it; confirm the intent)
- Does the admin dashboard need real-time metrics, or are periodic/cached
  rollups fine?
- PM2 vs systemd; deploy mechanism.
- Component library: shadcn/ui or hand-rolled?
