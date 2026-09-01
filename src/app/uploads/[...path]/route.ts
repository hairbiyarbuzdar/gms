import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { UPLOAD_ROOT } from "@/lib/member-photo";

/**
 * Serves files from the uploads directory.
 *
 * Behind auth: member photos are not public. The path is normalized and
 * checked to stay inside UPLOAD_ROOT, so "../" cannot escape it.
 */

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path: segments } = await params;
  const rel = segments.join("/");
  const resolved = path.resolve(UPLOAD_ROOT, rel);

  // Stay inside the uploads directory.
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(resolved);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
