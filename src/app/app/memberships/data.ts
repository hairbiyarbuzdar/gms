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
  memberCnic: string | null;
  memberEmail: string | null;
  memberPhotoUrl: string | null;
  packageId: string;
  packageName: string;
  packagePrice: string;
  /** Extras this membership carries, with the fee it pays for each. */
  extras: { id: string; name: string; fee: string }[];
  /** Sum of the extra fees. */
  extrasTotal: string;
  /** For seeding the edit form's extras picker. */
  extraIds: string[];
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
        member: {
          select: {
            name: true,
            barcode: true,
            phone: true,
            cnic: true,
            email: true,
            photoUrl: true,
            joinDate: true,
          },
        },
        package: { select: { id: true, name: true, price: true } },
        extras: {
          select: {
            id: true,
            fee: true,
            extraId: true,
            extra: { select: { name: true } },
          },
        },
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
      memberCnic: r.member.cnic,
      memberEmail: r.member.email,
      memberPhotoUrl: r.member.photoUrl,
      packageId: r.package.id,
      packageName: r.package.name,
      packagePrice: r.package.price.toString(),
      extras: r.extras.map((x) => ({
        id: x.id,
        name: x.extra.name,
        fee: x.fee.toString(),
      })),
      extrasTotal: r.extras
        .reduce((sum, x) => sum + Number(x.fee.toString()), 0)
        .toString(),
      extraIds: r.extras.map((x) => x.extraId),
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
  /** What the membership includes - shown in the Packages dialog only. */
  whatsIncluded: string | null;
  /** How many memberships currently use this package. */
  memberCount: number;
};

export type ExtraRow = {
  id: string;
  name: string;
  fee: string;
  isActive: boolean;
  /** How many memberships currently carry this extra. */
  memberCount: number;
};

/** Every extra, active or retired, with its member count. */
export async function getAllExtras(): Promise<ExtraRow[]> {
  const { db, tenantId } = await tenantDb();

  const extras = await db.extra.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      fee: true,
      isActive: true,
      _count: { select: { membershipExtras: true } },
    },
  });

  return extras.map((e) => ({
    id: e.id,
    name: e.name,
    fee: e.fee.toString(),
    isActive: e.isActive,
    memberCount: e._count.membershipExtras,
  }));
}

/** Active extras, for assigning to a member. */
export async function getActiveExtras() {
  const { db, tenantId } = await tenantDb();
  const extras = await db.extra.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, fee: true },
  });
  return extras.map((e) => ({ id: e.id, name: e.name, fee: e.fee.toString() }));
}

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
      whatsIncluded: true,
      isActive: true,
      _count: { select: { memberships: true } },
    },
  });

  return packages.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price.toString(),
    durationMonths: p.durationMonths,
    whatsIncluded: p.whatsIncluded,
    isActive: p.isActive,
    memberCount: p._count.memberships,
  }));
}
