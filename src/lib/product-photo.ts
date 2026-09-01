import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_ROOT } from "@/lib/member-photo";

/**
 * Product photos live alongside member headshots, under /uploads/products,
 * and are served back through the /uploads route.
 */
const PRODUCTS_DIR = path.join(UPLOAD_ROOT, "products");

/** Cap: 1 MB. The client downscales before upload, so this is a safety net. */
const MAX_BYTES = 1 * 1024 * 1024;

/**
 * Decodes a `data:image/(jpeg|png|webp);base64,...` string, writes it under
 * uploads/products, and returns the public path to store on the product.
 */
export async function saveProductPhoto(dataUrl: string): Promise<string> {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl.trim()
  );
  if (!match) {
    throw new Error("Photo must be a JPEG, PNG, or WebP image.");
  }

  const [, ext, b64] = match;
  const buffer = Buffer.from(b64, "base64");

  if (buffer.byteLength === 0) throw new Error("Photo is empty.");
  if (buffer.byteLength > MAX_BYTES) throw new Error("Photo must be 1 MB or smaller.");

  await mkdir(PRODUCTS_DIR, { recursive: true });

  const safeExt = ext === "jpg" ? "jpeg" : ext;
  const filename = `${randomUUID()}.${safeExt}`;
  await writeFile(path.join(PRODUCTS_DIR, filename), buffer);

  return `/uploads/products/${filename}`;
}

/** Removes a product photo file when it is replaced or the product is gone. */
export async function deleteProductPhoto(
  photoUrl: string | null | undefined
): Promise<void> {
  if (!photoUrl) return;

  const name = photoUrl.split("/").pop();
  if (!name || name.includes("..") || name.includes("/")) return;

  try {
    await unlink(path.join(PRODUCTS_DIR, name));
  } catch {
    // Already gone - nothing to do.
  }
}
