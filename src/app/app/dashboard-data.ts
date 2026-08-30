import { tenantDb } from "@/lib/tenant-db";
import {
  startOfDaysFromNow,
  startOfMonth,
  startOfNextMonth,
  startOfToday,
  startOfTomorrow,
} from "@/lib/dates";

export type DashboardStats = {
  activeMembers: number;
  renewalsDueThisWeek: number;
  renewalsOverdue: number;
  revenueToday: number;
  revenueThisMonth: number;
  membershipRevenueThisMonth: number;
  retailRevenueThisMonth: number;
  expensesThisMonth: number;
  lowStockCount: number;
};

function sum(value: { toString(): string } | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

/**
 * The dashboard's figures (FR-52).
 *
 * Every query is filtered by tenantId - under the shared-schema model that
 * filter is the isolation boundary, not an optimisation.
 *
 * Day and month boundaries come from Asia/Karachi, so "today" means the
 * tenant's day rather than the server's.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { db, tenantId } = await tenantDb();

  const now = new Date();
  const todayStart = startOfToday(now);
  const tomorrowStart = startOfTomorrow(now);
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const weekAhead = startOfDaysFromNow(7, now);

  const [
    activeMembers,
    renewalsDueThisWeek,
    renewalsOverdue,
    renewalToday,
    retailToday,
    renewalMonth,
    retailMonth,
    expenseMonth,
    lowStock,
  ] = await Promise.all([
    db.membership.count({
      where: { tenantId, status: "ACTIVE" },
    }),

    // Due between today and 7 days out - not yet overdue.
    db.membership.count({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "DUE"] },
        nextRenewalDate: { gte: todayStart, lt: weekAhead },
      },
    }),

    db.membership.count({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "DUE", "EXPIRED"] },
        nextRenewalDate: { lt: todayStart },
      },
    }),

    db.renewalPayment.aggregate({
      where: { tenantId, recordedAt: { gte: todayStart, lt: tomorrowStart } },
      _sum: { amount: true },
    }),

    db.retailInvoice.aggregate({
      where: { tenantId, soldAt: { gte: todayStart, lt: tomorrowStart } },
      _sum: { total: true },
    }),

    db.renewalPayment.aggregate({
      where: { tenantId, recordedAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),

    db.retailInvoice.aggregate({
      where: { tenantId, soldAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { total: true },
    }),

    db.expense.aggregate({
      where: { tenantId, spentAt: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),

    // Prisma cannot compare two columns in a where clause, so this counts
    // at-or-below-reorder-level in SQL.
    db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Product"
      WHERE "tenantId" = ${tenantId}
        AND "isActive" = true
        AND "quantity" <= "reorderLevel"
    `,
  ]);

  const membershipRevenueThisMonth = sum(renewalMonth._sum.amount);
  const retailRevenueThisMonth = sum(retailMonth._sum.total);

  return {
    activeMembers,
    renewalsDueThisWeek,
    renewalsOverdue,
    revenueToday: sum(renewalToday._sum.amount) + sum(retailToday._sum.total),
    revenueThisMonth: membershipRevenueThisMonth + retailRevenueThisMonth,
    membershipRevenueThisMonth,
    retailRevenueThisMonth,
    expensesThisMonth: sum(expenseMonth._sum.amount),
    lowStockCount: Number(lowStock[0]?.count ?? 0),
  };
}
