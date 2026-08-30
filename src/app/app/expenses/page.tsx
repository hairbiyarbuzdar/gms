import { BadgeDollarSign } from "lucide-react";
import { tenantDb } from "@/lib/tenant-db";
import { formatDate, formatMoney } from "@/lib/format";
import { startOfMonth, startOfNextMonth } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import {
  AddExpenseDialog,
  CategoriesDialog,
  DeleteExpenseButton,
} from "./expense-dialogs";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const { db, tenantId } = await tenantDb();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonth = startOfNextMonth(now);

  const [expenses, categories, methods, monthTotal] = await Promise.all([
    db.expense.findMany({
      where: { tenantId },
      orderBy: { spentAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        description: true,
        spentAt: true,
        category: { select: { name: true } },
        paymentMethod: { select: { name: true } },
      },
    }),
    db.expenseCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.paymentMethod.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.expense.aggregate({
      where: { tenantId, spentAt: { gte: monthStart, lt: nextMonth } },
      _sum: { amount: true },
    }),
  ]);

  const thisMonth = monthTotal._sum.amount ? Number(monthTotal._sum.amount.toString()) : 0;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="Operating costs. Each one is deducted from the payment method it was paid from."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CategoriesDialog categories={categories} />
            <AddExpenseDialog categories={categories} methods={methods} />
          </div>
        }
      />

      <div className="mt-6 flex flex-wrap items-baseline gap-3 rounded-lg border border-border bg-card px-5 py-4">
        <p className="label-caps text-muted-foreground">This month</p>
        <p className="data-mono text-2xl font-bold text-destructive">{formatMoney(thisMonth)}</p>
      </div>

      {expenses.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
          <BadgeDollarSign className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No expenses yet</p>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Record one to start tracking operating costs.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="label-caps px-4 py-3 text-muted-foreground">Date</th>
                <th className="label-caps px-4 py-3 text-muted-foreground">Category</th>
                <th className="label-caps px-4 py-3 text-muted-foreground">Description</th>
                <th className="label-caps px-4 py-3 text-muted-foreground">Paid from</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">Amount</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-border last:border-0">
                  <td className="data-mono px-4 py-3 text-muted-foreground">
                    {formatDate(expense.spentAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{expense.category.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {expense.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {expense.paymentMethod.name}
                  </td>
                  <td className="data-mono px-4 py-3 text-right font-medium">
                    {formatMoney(expense.amount.toString())}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DeleteExpenseButton id={expense.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
