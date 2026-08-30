import type { Prisma } from "@/generated/prisma/client";
import { tenantDb } from "@/lib/tenant-db";
import { startOfDaysFromNow, startOfToday } from "@/lib/dates";

export const MEMBERSHIP_TABS = ["active", "renewals", "expired"] as const;
export type MembershipTab = (typeof MEMBERSHIP_TABS)[number];

export function parseTab(value: string | undefined): MembershipTab {
  return MEMBERSHIP_TABS.includes(value as MembershipTab) ? (value as MembershipTab) : "active";
}

export const PAGE_SIZE = 10;

/** How many days ahead counts as "expiring soon". */
const RENEWAL_WINDOW_DAYS = 7;

/**
 * The where-clause for each tab. Every one is anchored to tenantId - under the
 * shared-schema model that filter is the isolation boundary.
 *
 * Tabs are defined by the renewal date rather than the stored status, so a
 * membership becomes overdue on the day it falls due without needing a
 * scheduled job to rewrite rows.
 */
function tabFilter(tab: MembershipTab, tenantId: string, now: Date): Prisma.MembershipWhereInput {
  const today = startOfToday(now);
  const windowEnd = startOfDaysFromNow(RENEWAL_WINDOW_DAYS, now);

  const base: Prisma.MembershipWhereInput = { tenantId };

  switch (tab) {
    case "renewals":
      // Due within the next week, or already past due but not cancelled.
      return {
        ...base,
        status: { not: "CANCELLED" },
        nextRenewalDate: { lt: windowEnd },
      };
    case "expired":
      return { ...base, status: { in: ["EXPIRED", "CANCELLED"] } };
    case "active":
    default:
      return {
        ...base,
        status: { in: ["ACTIVE", "DUE"] },
        nextRenewalDate: { gte: today },
      };
  }
}

function searchFilter(query: string): Prisma.MembershipWhereInput {
  const q = query.trim();
  if (!q) return {};

  return {
    member: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ],
    },
  };
}

export type MembershipRow = {
  id: string;
  memberName: string;
  memberBarcode: string;
  memberPhone: string;
  packageName: string;
  packagePrice: string;
  joinDate: Date;
  nextRenewalDate: Date;
  status: "ACTIVE" | "DUE" | "EXPIRED" | "CANCELLED";
  /** Negative when overdue, 0 today, positive when upcoming. */
  daysUntilDue: number;
};

export type MembershipListResult = {
  rows: MembershipRow[];
  total: number;
  page: number;
  pageCount: number;
  counts: { active: number; renewals: number; expired: number };
};

/** Whole days between today and a due date, in the tenant's timezone. */
function daysUntil(due: Date, now: Date): number {
  const today = startOfToday(now).getTime();
  const dueDay = startOfToday(due).getTime();
  return Math.round((dueDay - today) / 86_400_000);
}

export async function getMemberships({
  tab,
  query,
  page,
}: {
  tab: MembershipTab;
  query: string;
  page: number;
}): Promise<MembershipListResult> {
  const { db, tenantId } = await tenantDb();
  const now = new Date();

  const where: Prisma.MembershipWhereInput = {
    ...tabFilter(tab, tenantId, now),
    ...searchFilter(query),
  };

  const [total, records, activeCount, renewalsCount, expiredCount] = await Promise.all([
    db.membership.count({ where }),
    db.membership.findMany({
      where,
      // Renewals surface the most urgent first; other tabs read alphabetically.
      orderBy:
        tab === "renewals"
          ? { nextRenewalDate: "asc" }
          : { member: { name: "asc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        nextRenewalDate: true,
        status: true,
        member: { select: { name: true, barcode: true, phone: true, joinDate: true } },
        package: { select: { name: true, price: true } },
      },
    }),
    db.membership.count({ where: tabFilter("active", tenantId, now) }),
    db.membership.count({ where: tabFilter("renewals", tenantId, now) }),
    db.membership.count({ where: tabFilter("expired", tenantId, now) }),
  ]);

  return {
    rows: records.map((r) => ({
      id: r.id,
      memberName: r.member.name,
      memberBarcode: r.member.barcode,
      memberPhone: r.member.phone,
      packageName: r.package.name,
      packagePrice: r.package.price.toString(),
      joinDate: r.member.joinDate,
      nextRenewalDate: r.nextRenewalDate,
      status: r.status,
      daysUntilDue: daysUntil(r.nextRenewalDate, now),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    counts: { active: activeCount, renewals: renewalsCount, expired: expiredCount },
  };
}

export type PackageOption = {
  id: string;
  name: string;
  /** Serialized: Prisma Decimal cannot cross into a Client Component. */
  price: string;
  durationMonths: number;
};

/** Active packages, for the "add member" form. */
export async function getActivePackages(): Promise<PackageOption[]> {
  const { db, tenantId } = await tenantDb();
  const packages = await db.package.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, durationMonths: true },
  });

  return packages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price.toString(),
    durationMonths: p.durationMonths,
  }));
}

export type PackageRow = PackageOption & {
  isActive: boolean;
  /** How many memberships currently use this package. */
  memberCount: number;
};

/** Every package, active or retired, with its member count. */
export async function getAllPackages(): Promise<PackageRow[]> {
  const { db, tenantId } = await tenantDb();

  const packages = await db.package.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      price: true,
      durationMonths: true,
      isActive: true,
      _count: { select: { memberships: true } },
    },
  });

  return packages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price.toString(),
    durationMonths: p.durationMonths,
    isActive: p.isActive,
    memberCount: p._count.memberships,
  }));
}
