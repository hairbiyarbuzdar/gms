/**
 * Fills one tenant with sample data so the dashboard has something to show.
 * Development only. Run: npx tsx prisma/seed-sample-data.ts <tenant-slug>
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const slug = process.argv[2];
if (!slug) throw new Error("Usage: tsx prisma/seed-sample-data.ts <tenant-slug>");

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`No tenant with slug "${slug}".`);
  const tenantId = tenant.id;

  if (await db.member.findFirst({ where: { tenantId } })) {
    console.log("Sample data already present.");
    return;
  }

  const [cash, card] = await Promise.all([
    db.paymentMethod.create({ data: { tenantId, name: "Cash" } }),
    db.paymentMethod.create({ data: { tenantId, name: "Card" } }),
  ]);

  const monthly = await db.package.create({
    data: { tenantId, name: "Monthly", durationMonths: 1, price: 4000 },
  });
  const quarterly = await db.package.create({
    data: { tenantId, name: "Quarterly", durationMonths: 3, price: 10500 },
  });

  // Members: some active and current, some due soon, some overdue.
  const plan = [
    { name: "Ahsan Raza", due: 12 },
    { name: "Bilal Khan", due: 20 },
    { name: "Sana Malik", due: 3 },
    { name: "Hira Shah", due: 5 },
    { name: "Usman Tariq", due: 6 },
    { name: "Zainab Ali", due: -2 },
    { name: "Fahad Iqbal", due: -9 },
  ];

  for (const [i, p] of plan.entries()) {
    const member = await db.member.create({
      data: {
        tenantId,
        name: p.name,
        phone: `0300${String(1000000 + i).slice(0, 7)}`,
        barcode: `IR${String(100000 + i)}`,
      },
    });

    await db.membership.create({
      data: {
        tenantId,
        memberId: member.id,
        packageId: i % 3 === 0 ? quarterly.id : monthly.id,
        nextRenewalDate: daysFromNow(p.due),
        status: p.due < 0 ? "DUE" : "ACTIVE",
      },
    });
  }

  // Renewal payments taken this month, two of them today.
  const memberships = await db.membership.findMany({ where: { tenantId }, take: 4 });
  for (const [i, m] of memberships.entries()) {
    await db.renewalPayment.create({
      data: {
        tenantId,
        membershipId: m.id,
        amount: 4000,
        paymentMethodId: i % 2 === 0 ? cash.id : card.id,
        recordedAt: i < 2 ? new Date() : daysFromNow(-4),
        periodStart: daysFromNow(-30),
        periodEnd: new Date(),
      },
    });
  }

  // Products, one deliberately below its reorder level.
  const products = await Promise.all([
    db.product.create({
      data: {
        tenantId,
        serial: 1,
        name: "Whey Protein 1kg",
        sku: "WP-1KG",
        category: "Supplements",
        salePrice: 9500,
        quantity: 14,
        reorderLevel: 5,
      },
    }),
    db.product.create({
      data: {
        tenantId,
        serial: 2,
        name: "Protein Bar",
        sku: "PB-01",
        category: "Snacks",
        salePrice: 350,
        quantity: 3,
        reorderLevel: 10,
      },
    }),
    db.product.create({
      data: {
        tenantId,
        serial: 3,
        name: "Shaker Bottle",
        sku: "SB-01",
        category: "Accessories",
        salePrice: 800,
        quantity: 2,
        reorderLevel: 6,
      },
    }),
  ]);

  // A couple of retail sales, one today.
  for (const [i, product] of products.slice(0, 2).entries()) {
    const qty = 2;
    const unit = Number(product.salePrice.toString());
    const total = unit * qty;

    await db.retailInvoice.create({
      data: {
        tenantId,
        number: `INV-${1001 + i}`,
        subtotal: total,
        discount: 0,
        total,
        paymentMethodId: cash.id,
        soldAt: i === 0 ? new Date() : daysFromNow(-3),
        lines: {
          create: [
            { tenantId, productId: product.id, unitPrice: unit, quantity: qty, lineTotal: total },
          ],
        },
      },
    });
  }

  // Expenses this month.
  const rent = await db.expenseCategory.create({ data: { tenantId, name: "Rent" } });
  const utilities = await db.expenseCategory.create({ data: { tenantId, name: "Utilities" } });

  await db.expense.createMany({
    data: [
      {
        tenantId,
        categoryId: rent.id,
        amount: 45000,
        description: "Monthly rent",
        paymentMethodId: cash.id,
        spentAt: daysFromNow(-6),
      },
      {
        tenantId,
        categoryId: utilities.id,
        amount: 12000,
        description: "Electricity",
        paymentMethodId: card.id,
        spentAt: daysFromNow(-2),
      },
    ],
  });

  console.log(`Seeded sample data into "${tenant.name}".`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
