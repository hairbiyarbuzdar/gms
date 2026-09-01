import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Member headshots live on the VPS filesystem under /uploads/members and are
 * served back through the /uploads route.
 *
 * The env var lets the VPS point this at a directory outside the repo (so a
 * redeploy doesn't wipe photos); it defaults to ./uploads for local dev.
 */
const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

const MEMBERS_DIR = path.join(UPLOAD_ROOT, "members");

/** Cap: a webcam JPEG at reasonable quality is well under this. */
const MAX_BYTES = 3 * 1024 * 1024;

export { UPLOAD_ROOT };

/**
 * Decodes a `data:image/jpeg;base64,...` string from the webcam capture,
 * writes it under uploads/members, and returns the public path to store on
 * the member. Rejects anything that is not a small JPEG or PNG.
 */
export async function saveMemberPhoto(dataUrl: string): Promise<string> {
  const match = /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) {
    throw new Error("Photo must be a JPEG or PNG capture.");
  }

  const [, ext, b64] = match;
  const buffer = Buffer.from(b64, "base64");

  if (buffer.byteLength === 0) throw new Error("Photo is empty.");
  if (buffer.byteLength > MAX_BYTES) throw new Error("Photo is too large.");

  await mkdir(MEMBERS_DIR, { recursive: true });

  const filename = `${randomUUID()}.${ext === "jpg" ? "jpeg" : ext}`;
  await writeFile(path.join(MEMBERS_DIR, filename), buffer);

  return `/uploads/members/${filename}`;
}
