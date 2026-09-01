"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/** Longest edge after downscaling. Keeps a 1 MB cap comfortably reachable. */
const MAX_EDGE = 900;
const TARGET_BYTES = 950 * 1024;

/**
 * Reads a picked image, downscales it in the browser, and emits a JPEG
 * data: URL under ~1 MB. The server re-checks the size.
 */
async function toDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // Step quality down until it fits.
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length * 0.75 <= TARGET_BYTES) return url;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

export function ProductPhotoField({
  name,
  editing = false,
  initialUrl = null,
  error,
}: {
  /** Hidden field name the form submits. */
  name: string;
  /** True in the edit dialog: enables the keep / replace / remove switch. */
  editing?: boolean;
  initialUrl?: string | null;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const touched = preview !== (initialUrl ?? null);

  // Create: raw data URL or "". Edit: "" keeps, data URL replaces, "__remove__" clears.
  const fieldValue = !editing
    ? preview ?? ""
    : !touched
      ? ""
      : preview?.startsWith("data:image/")
        ? preview
        : "__remove__";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError(null);
    setBusy(true);
    try {
      setPreview(await toDataUrl(file));
    } catch {
      setLocalError("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <span className="label-caps mb-1 text-muted-foreground">Photo (optional)</span>
      <input type="hidden" name={name} value={fieldValue} />

      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-secondary">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground/50" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-fit rounded border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {busy ? "Processing…" : preview ? "Replace" : "Upload photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex w-fit items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-3" aria-hidden="true" />
              Remove
            </button>
          )}
          <p className="text-[11px] text-muted-foreground">JPEG or PNG, up to 1 MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />

      {(localError || error) && (
        <p className="mt-1 text-[13px] text-destructive">{localError ?? error}</p>
      )}
    </div>
  );
}
