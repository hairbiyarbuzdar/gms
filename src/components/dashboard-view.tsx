import Link from "@/components/workspace-link";
import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  Plus,
  Receipt,
  ScanLine,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import type { DashboardStats } from "@/app/app/dashboard-data";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

const QUICK_ACTIONS = [
  { href: "/app/memberships", label: "Add membership", icon: Plus },
  { href: "/app/invoices", label: "New sale", icon: Receipt },
  { href: "/app/expenses", label: "Record expense", icon: BadgeDollarSign },
  { href: "/app/memberships", label: "Scan barcode", icon: ScanLine },
];

export function DashboardView({
  tenantName,
  tenantLocation,
  stats,
  quickActions,
  children,
  admin = false,
}: {
  tenantName: string;
  tenantLocation: string;
  stats: DashboardStats;
  quickActions?: React.ReactNode;
  children?: React.ReactNode;
  admin?: boolean;
}) {
  const net = stats.revenueThisMonth - stats.expensesThisMonth;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader eyebrow={tenantLocation} title={tenantName} />

      {/* Quick actions (FR-53) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {quickActions ??
          QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded border px-3 py-2 text-[13px] font-medium transition-colors"
              >
                <Icon className="size-4" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
      </div>

      {/* KPIs (FR-52) */}
      <section className="mt-6" aria-labelledby="kpis">
        <h2 id="kpis" className="sr-only">
          Key figures
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Active members"
            value={stats.activeMembers.toLocaleString("en-PK")}
            icon={Users}
            href="/app/memberships"
          />
          <StatCard
            label="Renewals due this week"
            value={stats.renewalsDueThisWeek.toLocaleString("en-PK")}
            icon={CalendarClock}
            href="/app/memberships"
          />
          <StatCard
            label="Overdue renewals"
            value={stats.renewalsOverdue.toLocaleString("en-PK")}
            icon={AlertTriangle}
            href="/app/memberships"
            emphasis={stats.renewalsOverdue > 0}
          />
          <StatCard
            label="Revenue today"
            value={formatMoney(stats.revenueToday)}
            hint="Memberships and retail"
            icon={Wallet}
          />
          <StatCard
            label="Revenue this month"
            value={formatMoney(stats.revenueThisMonth)}
            hint="Memberships and retail"
            icon={TrendingUp}
            href={admin ? "/admin/data?dataset=invoices" : "/app/reports"}
          />
          <StatCard
            label="Low stock items"
            value={stats.lowStockCount.toLocaleString("en-PK")}
            hint="At or below reorder level"
            icon={Boxes}
            href="/app/inventory"
            emphasis={stats.lowStockCount > 0}
          />
        </div>
      </section>

      {/* This month's money */}
      <section className="mt-6" aria-labelledby="month">
        <h2 id="month" className="label-caps text-muted-foreground">
          This month
        </h2>
        <div className="border-border bg-card mt-3 overflow-hidden rounded-lg border">
          <dl className="divide-border divide-y">
            <Row
              label="Membership renewals"
              value={formatMoney(stats.membershipRevenueThisMonth)}
            />
            <Row label="Retail sales" value={formatMoney(stats.retailRevenueThisMonth)} />
            <Row label="Expenses" value={`− ${formatMoney(stats.expensesThisMonth)}`} />
            <div className="bg-secondary flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-sm font-semibold">Net</dt>
              <dd
                className={`data-mono text-sm font-semibold ${
                  net < 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatMoney(net)}
              </dd>
            </div>
          </dl>
        </div>
        <p className="text-muted-foreground mt-2 text-[13px] leading-[18px]">
          Net is revenue less recorded expenses. It is not profit — cost of goods is not tracked.
        </p>
      </section>
      {children}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="data-mono text-sm">{value}</dd>
    </div>
  );
}
