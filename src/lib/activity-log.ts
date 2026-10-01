import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { formatMoneyPrecise } from "./format";

export const ACTIVITY_PAGE_SIZE = 25;
export const ACTIVITY_LABELS: Record<string, string> = {
  "tenant.create": "Gym created",
  RETAIL_INVOICE_EDIT: "Invoice edited",
  RETAIL_INVOICE_DELETE: "Invoice deleted",
  RETAIL_INVOICE_CREATE: "Invoice created",
  MEMBERSHIP_CREATE: "Membership created",
  MEMBERSHIP_EDIT: "Membership edited",
  MEMBERSHIP_RENEW: "Membership renewed",
  MEMBERSHIP_EXTRAS: "Membership extras changed",
  EXPENSE_CREATE: "Expense recorded",
  EXPENSE_DELETE: "Expense deleted",
  EXPENSE_CATEGORY_CREATE: "Expense category created",
  PRODUCT_CREATE: "Product created",
  PRODUCT_EDIT: "Product edited",
  PRODUCT_STATUS: "Product status changed",
  STOCK_ADJUST: "Stock adjusted",
  SUPPLIER_CREATE: "Supplier created",
  SUPPLIER_EDIT: "Supplier edited",
  PURCHASE_CREATE: "Purchase invoice created",
  PURCHASE_PAYMENT: "Supplier payment recorded",
  TRANSFER_CREATE: "Transfer recorded",
  TRANSFER_DELETE: "Transfer deleted",
  PAYMENT_METHOD_CREATE: "Payment method created",
  PAYMENT_METHOD_EDIT: "Payment method edited",
  PAYMENT_METHOD_STATUS: "Payment method status changed",
  PACKAGE_CREATE: "Package created",
  PACKAGE_EDIT: "Package edited",
  PACKAGE_STATUS: "Package status changed",
  EXTRA_CREATE: "Extra created",
  EXTRA_EDIT: "Extra edited",
  EXTRA_STATUS: "Extra status changed",
};

export function activityLabel(action: string): string {
  return Object.hasOwn(ACTIVITY_LABELS, action)
    ? ACTIVITY_LABELS[action]
    : action.replace(/[_.]/g, " ").toLowerCase();
}

export function parseActivityFilters(params: Record<string, string | string[] | undefined>) {
  const first = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const page = Number(first("page"));
  return {
    q: first("q").trim().slice(0, 120),
    action: first("action").trim().slice(0, 100),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

function metadataText(meta: Prisma.JsonValue, key: string): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const value = meta[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

/** Show only fields intentionally recorded for display, never arbitrary JSON. */
export function activitySummary(action: string, target: string, meta: Prisma.JsonValue) {
  const number = metadataText(meta, "number");
  const money = (key: string) => {
    const value = metadataText(meta, key);
    return value !== null && value.trim() !== "" && Number.isFinite(Number(value))
      ? formatMoneyPrecise(value)
      : null;
  };
  if (action === "RETAIL_INVOICE_EDIT") {
    const before = money("previousTotal");
    const after = money("total");
    return {
      record: number ?? target,
      detail: before && after ? `Total: ${before} → ${after}` : "Invoice details updated.",
    };
  }
  if (action === "RETAIL_INVOICE_DELETE") {
    const before = money("previousTotal");
    return {
      record: number ?? target,
      detail: before ? `Removed invoice total: ${before}` : "Invoice removed.",
    };
  }
  if (action === "tenant.create") {
    return {
      record: metadataText(meta, "name") ?? target,
      detail: "Gym location and login account created.",
    };
  }
  const name = metadataText(meta, "name") ?? metadataText(meta, "customer");
  const amount = money("amount") ?? money("total") ?? money("price") ?? money("fee");
  const active =
    meta && typeof meta === "object" && !Array.isArray(meta) ? meta.isActive : undefined;
  const delta = metadataText(meta, "delta");
  return {
    record: [name, number].filter(Boolean).join(" · ") || target,
    detail: amount
      ? `${activityLabel(action)} · ${amount}`
      : delta !== null
        ? `Stock change: ${delta}`
        : typeof active === "boolean"
          ? active
            ? "Active"
            : "Archived"
          : activityLabel(action),
  };
}

export async function getActivityLog(
  db: Pick<PrismaClient, "auditLog" | "user">,
  tenantId: string,
  filters: ReturnType<typeof parseActivityFilters>
) {
  return queryActivityLog(db, { tenantId }, filters);
}

/** Server data query. The admin entry point must requireRole("ADMIN") first. */
export async function queryActivityLog(
  db: Pick<PrismaClient, "auditLog" | "user">,
  scope: { tenantId: string } | { admin: true; tenantId?: string },
  filters: ReturnType<typeof parseActivityFilters>
) {
  const tenantId = scope.tenantId;
  const admin = "admin" in scope && scope.admin;
  if (!admin && !tenantId) throw new Error("Tenant scope required.");
  // AuditLog keeps actorId without a User relation. Resolve excluded actors
  // first, then apply the same scope to rows, totals, and filter options.
  const superadmins = admin
    ? await db.user.findMany({ where: { role: "SUPERADMIN" }, select: { id: true } })
    : [];
  const locationScope: Prisma.AuditLogWhereInput = {
    ...(tenantId ? { tenantId } : { tenantId: { not: null } }),
    ...(superadmins.length ? { actorId: { notIn: superadmins.map((user) => user.id) } } : {}),
  };
  const where: Prisma.AuditLogWhereInput = {
    ...locationScope,
    ...(filters.action ? { action: filters.action } : {}),
  };
  if (filters.q) {
    const search = { contains: filters.q, mode: "insensitive" as const };
    where.OR = [
      { action: search },
      { target: search },
      { actorId: search },
      {
        action: {
          in: Object.entries(ACTIVITY_LABELS)
            .filter(([, label]) => label.toLowerCase().includes(filters.q.toLowerCase()))
            .map(([action]) => action),
        },
      },
      { meta: { path: ["number"], string_contains: filters.q, mode: "insensitive" } },
      { meta: { path: ["name"], string_contains: filters.q, mode: "insensitive" } },
      { meta: { path: ["customer"], string_contains: filters.q, mode: "insensitive" } },
    ];
  }
  const [total, actions] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where: locationScope,
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const entries = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ACTIVITY_PAGE_SIZE,
    take: ACTIVITY_PAGE_SIZE,
    select: {
      id: true,
      tenantId: true,
      actorId: true,
      action: true,
      target: true,
      meta: true,
      createdAt: true,
    },
  });
  const actors = entries.length
    ? await db.user.findMany({
        where: {
          id: { in: [...new Set(entries.map((entry) => entry.actorId))] },
          ...(!admin
            ? { OR: [{ tenantId }, { role: "SUPERADMIN" as const, tenantId: null }] }
            : {}),
        },
        select: { id: true, name: true, role: true },
      })
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));
  return {
    total,
    page,
    pageCount,
    actions: actions.map((row) => row.action),
    rows: entries.map((entry) => {
      const actor = actorById.get(entry.actorId);
      return {
        id: entry.id,
        tenantId: entry.tenantId,
        createdAt: entry.createdAt,
        action: entry.action,
        actorId: entry.actorId,
        actor:
          actor?.name ||
          (actor?.role === "SUPERADMIN" ? "Platform administrator" : "Unavailable user"),
        ...activitySummary(entry.action, entry.target, entry.meta),
      };
    }),
  };
}
