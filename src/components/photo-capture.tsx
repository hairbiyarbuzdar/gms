"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

/** Uploads and webcam frames use the same JPEG field, saved with the member. */
export function PhotoCapture({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    requestRef.current++;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(
    () => () => {
      requestRef.current++;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  function processing(next: boolean) {
    setBusy(next);
    onBusyChange?.(next);
  }

  async function start() {
    if (busy) return;
    stop();
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is unavailable. Use HTTPS or localhost, or upload a photo instead.");
      return;
    }
    const request = requestRef.current;
    processing(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      if (request !== requestRef.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = media;
      setStream(media);
    } catch (err) {
      if (request !== requestRef.current) return;
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow access or upload a photo instead."
          : name === "NotFoundError"
            ? "No camera found. Upload a photo instead."
            : "Could not open the camera. Try again or upload a photo."
      );
    } finally {
      if (request === requestRef.current) processing(false);
    }
  }

  function headshot(source: CanvasImageSource, width: number, height: number) {
    const side = Math.min(width, height);
    if (!side) throw new Error("Image is not ready.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(side, 640);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the photo.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      source,
      (width - side) / 2,
      (height - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height
    );
    for (const quality of [0.85, 0.7, 0.5]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length < 700_000) return data;
    }
    throw new Error("Photo is too large. Try a smaller image.");
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose an image smaller than 20 MB.");
      return;
    }
    stop();
    const request = requestRef.current;
    processing(true);
    try {
      const image = await createImageBitmap(file);
      try {
        if (request === requestRef.current) onChange(headshot(image, image.width, image.height));
      } finally {
        image.close();
      }
    } catch {
      if (request === requestRef.current)
        setError("Could not read that photo. Try another JPG, PNG, or WebP image.");
    } finally {
      if (request === requestRef.current) processing(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) {
      setError("Camera is still starting. Try again in a moment.");
      return;
    }
    try {
      onChange(headshot(video, video.videoWidth, video.videoHeight));
      setError(null);
      stop();
    } catch {
      setError("Could not capture the photo. Try again.");
    }
  }

  const button =
    "flex items-center gap-2 rounded border border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2">
      <span className="label-caps text-muted-foreground">Photo (optional)</span>
      <div className="flex flex-wrap items-start gap-3">
        <div className="border-border bg-secondary relative size-32 shrink-0 overflow-hidden rounded border">
          {stream ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Webcam preview"
              className="size-full object-cover"
            />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Member photo preview" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Camera className="text-muted-foreground size-8" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={upload}
            className="hidden"
            aria-label="Upload member photo"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={button}
          >
            <ImagePlus className="size-4" aria-hidden="true" />{" "}
            {value ? "Replace photo" : "Upload photo"}
          </button>
          {stream ? (
            <>
              <button
                type="button"
                onClick={capture}
                className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary rounded px-3 py-2 text-[13px] focus-visible:outline-2"
              >
                Take photo
              </button>
              <button type="button" onClick={stop} className={button}>
                Cancel camera
              </button>
            </>
          ) : (
            <button type="button" disabled={busy} onClick={start} className={button}>
              <Camera className="size-4" aria-hidden="true" /> Use webcam
            </button>
          )}
          {value && !stream && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onChange(null);
                setError(null);
              }}
              className={button}
            >
              <X className="size-4" aria-hidden="true" /> Remove photo
            </button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-[12px]">
        JPG, PNG, or WebP, up to 20 MB. Photos are cropped to a square.
      </p>
      {busy && (
        <p role="status" className="text-muted-foreground text-[13px]">
          Preparing photo…
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
}
