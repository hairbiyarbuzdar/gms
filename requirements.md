# GMS — Software Requirements Specification

**Product:** GMS — Gym Membership Software
**Type:** Multi-tenant SaaS for gyms operating multiple locations
**Status:** Draft — for review
**Last updated:** 2026-08-29
**Related documents:** [plan.md](plan.md) (architecture & tech stack)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for GMS, a
multi-tenant platform that lets a central operator provision and oversee independent
gym-management systems, one per physical location.

### 1.2 Scope

GMS is delivered in three milestones:

| Milestone | Deliverable |
| --- | --- |
| **M1 — Superadmin** | The platform control plane: create and delete tenants (gym locations). |
| **M2 — Admin** | Read-only supervisory dashboard spanning every location. |
| **M3 — Gym management system** | The per-location application: memberships, retail, inventory, suppliers, expenses, and reporting. |

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| **Platform** | The whole SaaS, operated by us. |
| **Tenant** | One gym location and its self-contained management system. All tenant data is isolated. |
| **Superadmin** | Platform owner. The only role that can create or delete a tenant. |
| **Admin** | Platform supervisor. Read-only oversight across all tenants; cannot modify anything. |
| **Tenant user** | The single login account belonging to one tenant. Full access within that tenant only. |
| **Member** | A gym customer of one location. Not a login user. |
| **Package** | A named membership plan (duration + price) offered by a tenant. |
| **Membership** | A member's enrolment in a package, renewed monthly. |

---

## 2. Actors

| Actor | Description | Authenticated |
| --- | --- | --- |
| Superadmin | Platform owner. Full control. Only role that can create/delete tenants. | Yes |
| Admin | Platform supervisor. Read-only oversight across all tenants. | Yes |
| Tenant user | One account per tenant. Full access to that tenant's management system. | Yes |
| Member | Gym customer of one location. No login. | No |

---

## 3. Functional requirements

Priority uses MoSCoW: **Must**, **Should**, **Could**.

### 3.1 Milestone 1 — Superadmin

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A superadmin can authenticate to the platform. | Must |
| FR-2 | A superadmin can create a tenant by entering four fields: **name**, **location**, **login email**, **login password**. | Must |
| FR-3 | Creating a tenant provisions a fresh, empty management system for that location — a blank dashboard with no pre-existing data. Nothing is seeded beyond the tenant record and its login account. | Must |
| FR-4 | The email and password entered at creation become the tenant's login credentials. The password is stored hashed. Exactly one login account is created per tenant. | Must |
| FR-5 | A superadmin can delete a tenant. | Must |
| FR-6 | A superadmin can view a list of all tenants. | Must |
| FR-7 | Only the superadmin role can create or delete a tenant. This is enforced on every write path. | Must |

**Deferred to a later revision:** tenant suspend/reactivate, editing a tenant after
creation, creating admin accounts, the platform audit log, and the mechanism by
which a superadmin opens a specific tenant's system.

### 3.2 Milestone 2 — Admin (supervisor)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-8 | An admin can authenticate to the platform. | Must |
| FR-9 | An admin can view and supervise all tenants, read-only, across every location. | Must |
| FR-10 | The admin dashboard presents data from all locations in a single consolidated view. | Must |
| FR-11 | An admin can drill into any single tenant to view its data and activity. | Must |
| FR-12 | An admin cannot create, edit, suspend, or delete any tenant or platform user. Every write path denies the admin role. | Must |

**Deferred to a later revision:** the exact metrics and roll-ups shown, per-tenant
drill-down contents, whether figures are real-time or cached, and export formats.

### 3.3 Milestone 3 — Gym management system (per tenant)

The application a tenant user sees after logging in. It combines gym membership
management with a retail/inventory back office.

**Modules:** Gym Membership · Inventory / Stock · Retail Invoicing · Suppliers &
Purchase Invoices · Expenses · Payment Methods · Reports · Data Viewer.

#### 3.3.1 Gym Membership

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-13 | The tenant user can add a new membership: capture member details and select a package from the tenant's package list. | Must |
| FR-14 | The tenant user can maintain a list of packages, each with a name, duration, and price. | Must |
| FR-15 | A member has exactly one membership (1:1). Adding a membership creates the member and their membership together. | Must |
| FR-16 | A membership renews on a monthly cycle. The first renewal is due one month after the start date. | Must |
| FR-17 | A **Renewals** tab lists memberships due or overdue for renewal, sorted by due date, showing days overdue. | Must |
| FR-18 | The tenant user can renew a membership from the Renewals tab. Renewal records a payment against a payment method and advances the renewal date. | Must |
| FR-19 | On renewal, the next due date is set to the date the renewal was recorded plus one month. A late renewal therefore pushes the next due date forward; there are no catch-up charges for missed months. | Must |
| FR-20 | Creating a membership generates a unique barcode for that member. | Must |
| FR-21 | The tenant user can look up a membership by scanning or entering its barcode, to view status and renew. Barcode lookup for renewal is the barcode's only function. | Must |
| FR-22 | Membership status is one of: **Active**, **Due**, **Overdue/Expired**, **Cancelled**. | Should |
| FR-23 | A member profile stores: name, contact number, email (optional), photo (optional), join date, package, barcode, and status. | Should |

**Out of scope for v1:** check-in / attendance tracking, multiple packages per
member, membership freeze/hold, pro-rated first month, discounts and promotional
pricing, family or corporate memberships.

#### 3.3.2 Inventory / Stock

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-24 | The tenant user can maintain an inventory of retail products (e.g. protein bars, supplements, drinks, accessories). | Must |
| FR-25 | Each product records: name, SKU/barcode, category, sale price, quantity on hand, and reorder level. There is no cost-price field. | Must |
| FR-26 | Stock increases when a purchase invoice is posted (§3.3.4) and decreases when an item is sold on a retail invoice (§3.3.3). Every stock movement is tied to a document. | Must |
| FR-27 | Products at or below their reorder level are flagged in the inventory list and on the dashboard. | Should |
| FR-28 | The tenant user can record a manual stock adjustment (e.g. damage, count correction) with a reason. | Should |

**Out of scope for v1:** cost-price tracking, gross-profit reporting, and stock
valuation (FIFO / weighted average) — no cost basis is recorded. Per-product
barcode printing and batch/expiry tracking are deferred.

#### 3.3.3 Retail Invoicing

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-29 | The tenant user can create a retail invoice: add products by search or barcode scan, set quantities, apply a discount, and take payment. | Must |
| FR-30 | Completing a retail invoice reduces stock for each line item and records the payment against a payment method. | Must |
| FR-31 | A retail invoice can be printed or exported as PDF, showing itemised lines, discount, total, and payment method. No tax line is shown. | Should |
| FR-32 | A retail invoice can optionally be linked to a member for purchase history. | Could |

**Out of scope for v1:** tax / VAT, and refunds / returns. Held sales and cash-drawer
reconciliation are deferred.

#### 3.3.4 Suppliers & Purchase Invoices

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-33 | The tenant user can maintain a list of suppliers (name, contact, address, notes). | Must |
| FR-34 | The tenant user can record a purchase invoice from a supplier: line items (product, quantity, line amount), an invoice total, a date, and a payment status. A line amount is what the supplier charged; it is not written back to the product. | Must |
| FR-35 | Posting a purchase invoice increases stock quantity for each line item. It does not change any product's price. | Must |
| FR-36 | A purchase invoice tracks payment status (unpaid / partially paid / paid) and the payments made against it, feeding outstanding-payables and cash-outflow figures. | Should |

**Deferred:** supplier statements and partial deliveries.

#### 3.3.5 Expenses

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-37 | The tenant user can record an expense with: date, category, amount, payment method, description, and an optional attachment (e.g. rent, utilities, salaries, maintenance). | Must |
| FR-38 | Expense categories are configurable by the tenant user. | Should |
| FR-39 | Purchase-invoice payments can be reflected in cash-outflow reporting alongside expenses, without double-counting. The exact treatment is an open question (§8). | Should |

#### 3.3.6 Payment Methods

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-40 | The tenant user can configure a list of payment methods (e.g. Cash, Card, Bank Transfer, Mobile Wallet). | Must |
| FR-41 | Every money movement — membership renewal, retail sale, purchase-invoice payment, expense — is recorded against a payment method. | Must |
| FR-42 | Reports can break income and outflow down by payment method for a date range. | Should |

#### 3.3.7 Reports

All reports accept a date range.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-43 | **Membership report:** active members, new memberships, renewals collected, due/overdue count, membership revenue. | Must |
| FR-44 | **Sales report:** total sales revenue and items sold, broken down by product and category. No profit figure (cost is not tracked). | Must |
| FR-45 | **Inventory report:** quantity on hand, low-stock list, and stock-movement history. No stock value (no cost basis). | Should |
| FR-46 | **Purchases report:** purchase totals by supplier and outstanding payables. | Should |
| FR-47 | **Expense report:** expenses by category. | Must |
| FR-48 | **Cash / payment-method report:** total in and out per payment method, and the net, for the period. | Should |
| FR-49 | Reports can be exported as CSV, and as PDF where a printed layout is meaningful. | Should |

#### 3.3.8 Data Viewer

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-50 | The Data Viewer provides a read-only, tabular view of raw records (memberships, invoices, products, purchases, expenses, payments) that the tenant user can search and browse. | Should |
| FR-51 | The Data Viewer supports column filtering, sorting, date-range filtering, and CSV export. | Should |

#### 3.3.9 Dashboard home

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-52 | The landing screen shows at-a-glance figures: active members; renewals due this week and overdue; revenue today and this month (membership + retail); expenses this month; low-stock item count. | Should |
| FR-53 | The landing screen offers quick actions: add membership, new retail invoice, record expense, scan barcode. | Could |

#### 3.3.10 Access model within a tenant

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-54 | Each tenant has exactly one user account — the login email and password set by the superadmin at tenant creation (FR-2, FR-4). | Must |
| FR-55 | That account has full access to every module in the tenant's management system. | Must |

**Out of scope for v1:** staff sub-accounts, per-module permissions, and
trainer/class management.

---

## 4. Non-functional requirements

| Area | Requirement |
| --- | --- |
| **Tenant isolation** | Tenant data is strictly isolated. Every tenant-scoped query is constrained to the current tenant by a central data-access layer (see plan.md §3, §8). |
| **Authorization** | Role checks guard every action. Admins reach read paths only; every mutation denies any role below superadmin. |
| **Localization** | Single locale **en-PK**, single currency **PKR (Rs)**, timezone **Asia/Karachi**. All monetary values are stored and displayed in PKR; all dates use the en-PK format. No multi-currency and no internationalization in v1. |
| **Auditing** | Platform-level create/update/delete actions are recorded to an audit log (schema in plan.md §5). |
| **Backups** | Nightly `pg_dump` with an off-box copy. |
| **Performance** | Targets to be defined. Assume a low hundreds of tenants and low thousands of members per tenant. |
| **Availability** | Uptime target and maintenance windows to be defined. |
| **Browser support** | To be defined. |
| **Accessibility** | Target standard to be defined (candidate: WCAG 2.1 AA). |
| **Compliance & retention** | Data-retention and deletion policy to be defined. No card data is stored by the application (payment methods are recorded by name only), so PCI scope is expected to be minimal. |

---

## 5. Data model

Full Prisma schema lives in [plan.md](plan.md) §5. Summary below.

### 5.1 Platform entities

| Entity | Key fields | Notes |
| --- | --- | --- |
| **Tenant** | name, location, status, createdBy, timestamps | `location` is free text in v1. Created together with its one login account. |
| **User** | email, name, passwordHash, role, tenantId (nullable), status | Platform users have no `tenantId`; a tenant user has `tenantId` set and full access to that tenant. |
| **AuditLog** | actor, action, target, meta, tenantId (nullable), timestamp | Platform-level actions have no `tenantId`. |

### 5.2 Tenant entities (Milestone 3)

All are tenant-scoped.

| Entity | Key fields / relationships |
| --- | --- |
| **Package** | name, duration (months), price, active |
| **Member** | name, contact, email?, photo?, joinDate, barcode (unique per tenant), status. 1:1 with Membership. |
| **Membership** | member, package, startDate, nextRenewalDate, status. Renews monthly; `nextRenewalDate` = last renewal date + 1 month. |
| **RenewalPayment** | membership, dateRecorded, amount, paymentMethod |
| **Product** | name, sku/barcode, category, salePrice, quantity, reorderLevel. No cost price. |
| **StockMovement** | product, quantityDelta, type (purchase / sale / adjustment), linked document, date |
| **RetailInvoice** / **RetailInvoiceLine** | lines: product, qty, line total (qty × sale price). Header: subtotal, discount, total, paymentMethod, optional member. No tax. |
| **Supplier** | name, contact, address, notes |
| **PurchaseInvoice** / **PurchaseInvoiceLine** | lines: product, qty, line amount. Header: total, date, paymentStatus. Line amount is not written back to the product. |
| **PurchasePayment** | purchaseInvoice, date, amount, paymentMethod |
| **Expense** | date, category, amount, paymentMethod, description, attachment? |
| **ExpenseCategory** | name |
| **PaymentMethod** | name, active |

No staff or trainer entities in v1.

---

## 6. Integrations & external services

| Service | Purpose | Status |
| --- | --- | --- |
| Payment gateway | Not required in v1 — payments are recorded manually against named payment methods. | Not in scope |
| Email / SMS | Transactional messages (e.g. renewal reminders, receipts). | Not decided |
| File / object storage | Member photos, expense attachments, invoice PDFs. | Not decided — local disk vs object storage (§8) |

---

## 7. Constraints & assumptions

- A single personal VPS hosts both the application and PostgreSQL.
- Tech stack is fixed: Next.js (App Router), Prisma, PostgreSQL — see plan.md §2.
- Multi-tenancy is shared-database / shared-schema — see plan.md §3.
- Single locale and currency: en-PK / PKR, timezone Asia/Karachi.
- One user account per tenant; no staff roles or sub-accounts.
- No cost-price tracking anywhere — sale price only.
- Budget, timeline, and team size are to be defined.

---

## 8. Open questions

### Platform

- Tenant routing: subdomain (`acme.gms.app`) or path (`/t/acme`)?
- Can there be more than one superadmin?
- Admin dashboard: real-time figures or periodic/cached roll-ups? Which metrics per location?
- Does deleting a tenant hard-delete or soft-delete its data? Can a deleted or suspended tenant's login still authenticate?

### Milestone 3

- Barcode symbology (candidate: Code128), and whether it is printed on a membership card.
- How purchase-invoice payments and expenses combine in cash-outflow reporting without double-counting.
- The exact set of records exposed in the Data Viewer.
- Where member photos and attachments are stored (VPS local disk vs object storage).
- Does a retail-invoice discount apply per line or to the invoice total?
- Is there a grace period before an *Overdue* membership becomes *Expired*?

---

## 9. Decision log

| # | Decision |
| --- | --- |
| D-1 | Only the superadmin can create or delete tenants. |
| D-2 | The admin is a read-only supervisor across all tenants; no write access anywhere. |
| D-3 | Tenant creation captures exactly four fields (name, location, login email, login password) and provisions an empty system. |
| D-4 | One user account per tenant. No staff sub-accounts or per-module roles in v1. |
| D-5 | Member ↔ Membership is 1:1. |
| D-6 | The membership barcode is used for renewal lookup only — not check-in or attendance. |
| D-7 | Renewal shifts the schedule: next due date = renewal-recorded date + 1 month. Late renewals push the next due date; no catch-up charges. |
| D-8 | No cost-price tracking. Products carry a sale price only. Purchase invoices record supplier charges but never update product prices. No gross-profit or stock-value reporting. |
| D-9 | No tax / VAT on retail invoices. |
| D-10 | No refunds or returns in v1. |
| D-11 | Single locale/currency: en-PK / PKR, timezone Asia/Karachi. No multi-currency, no i18n. |
| D-12 | No payment-gateway integration in v1; payments are recorded manually. |
