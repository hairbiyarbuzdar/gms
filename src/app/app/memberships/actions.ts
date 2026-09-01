"use server";

import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import { tenantDb } from "@/lib/tenant-db";
import { createMembershipSchema, renewMembershipSchema } from "@/lib/validators/membership";
import { saveMemberPhoto } from "@/lib/member-photo";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set after a successful create, so the caller can offer the barcode. */
  created?: { memberName: string; barcode: string; packageName: string };
};

/** IR + 6 digits, unique within the tenant. */
async function generateBarcode(
  db: Awaited<ReturnType<typeof tenantDb>>["db"],
  tenantId: string
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `IR${Math.floor(100000 + Math.random() * 900000)}`;
    const clash = await db.member.findFirst({
      where: { tenantId, barcode: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new Error("Could not generate a unique barcode.");
}

/**
 * Creates a member and their single membership together (FR-13, FR-15).
 * The two are one unit - a member with no membership is not a thing this
 * product models.
 */
export async function createMembership(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { db, tenantId } = await tenantDb();

  const parsed = createMembershipSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    cnic: formData.get("cnic"),
    joinDate: formData.get("joinDate"),
    packageId: formData.get("packageId"),
    photo: formData.get("photo"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0] ?? "",
        phone: f.phone?.[0] ?? "",
        email: f.email?.[0] ?? "",
        cnic: f.cnic?.[0] ?? "",
        packageId: f.packageId?.[0] ?? "",
      },
    };
  }

  const { name, phone, email, cnic, joinDate, packageId, photo } = parsed.data;

  // Re-check the package belongs to this tenant: the id came from the client.
  const pkg = await db.package.findFirst({
    where: { id: packageId, tenantId, isActive: true },
    select: { id: true, name: true },
  });

  if (!pkg) {
    return { fieldErrors: { packageId: "That package is not available." } };
  }

  // Store the webcam capture before opening the transaction - a slow disk
  // write should not hold a DB transaction open.
  let photoUrl: string | null = null;
  if (photo && photo.startsWith("data:image/")) {
    try {
      photoUrl = await saveMemberPhoto(photo);
    } catch (error) {
      return {
        fieldErrors: { name: error instanceof Error ? error.message : "Photo could not be saved." },
      };
    }
  }

  const barcode = await generateBarcode(db, tenantId);
  const now = new Date();
  const joined = joinDate ? new Date(joinDate) : now;

  await db.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        tenantId,
        name,
        phone,
        email: email || null,
        cnic: cnic || null,
        photoUrl,
        barcode,
        joinDate: joined,
      },
    });

    await tx.membership.create({
      data: {
        tenantId,
        memberId: member.id,
        packageId,
        startDate: joined,
        // First renewal falls due one month after joining (FR-16).
        nextRenewalDate: addMonths(joined, 1),
        status: "ACTIVE",
      },
    });
  });

  revalidatePath("/app/memberships");
  revalidatePath("/app");
  return {
    ok: true,
    created: { memberName: name, barcode, packageName: pkg.name },
  };
}

/**
 * Records a renewal payment and advances the schedule (FR-18, FR-19).
 *
 * The next due date is one month from the date the renewal was RECORDED, not
 * from the old due date - so a late payment pushes the schedule forward and no
 * catch-up charge accrues (decision D-7).
 */
export async function renewMembership(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { db, tenantId } = await tenantDb();

  const parsed = renewMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    paymentMethodId: formData.get("paymentMethodId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        paymentMethodId: f.paymentMethodId?.[0] ?? "",
        amount: f.amount?.[0] ?? "",
      },
    };
  }

  const { membershipId, paymentMethodId, amount } = parsed.data;

  // Both ids arrived from the client, so both are re-checked against this
  // tenant before anything is written.
  const [membership, method] = await Promise.all([
    db.membership.findFirst({
      where: { id: membershipId, tenantId },
      select: { id: true, nextRenewalDate: true },
    }),
    db.paymentMethod.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  if (!membership) return { error: "Membership not found." };
  if (!method) return { fieldErrors: { paymentMethodId: "That payment method is not available." } };

  const recordedAt = new Date();
  const nextRenewalDate = addMonths(recordedAt, 1);

  await db.$transaction(async (tx) => {
    await tx.renewalPayment.create({
      data: {
        tenantId,
        membershipId: membership.id,
        amount,
        paymentMethodId,
        recordedAt,
        periodStart: membership.nextRenewalDate,
        periodEnd: nextRenewalDate,
      },
    });

    await tx.membership.update({
      where: { id: membership.id },
      data: { nextRenewalDate, status: "ACTIVE" },
    });
  });

  revalidatePath("/app/memberships");
  revalidatePath("/app");
  return { ok: true };
}
