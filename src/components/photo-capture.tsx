"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";

/**
 * Takes a headshot with the device webcam.
 *
 * The captured frame is passed back as a data: URL (JPEG). It is only stored
 * on submit - nothing is uploaded here. The stream is stopped as soon as a
 * shot is taken or the component unmounts, so the camera light does not stay
 * on.
 */
export function PhotoCapture({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setError("Could not open the camera. Check the browser has permission.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    // Square crop from the centre of the frame.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      side,
      side
    );

    onChange(canvas.toDataURL("image/jpeg", 0.85));
    stop();
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-caps text-muted-foreground">
        Photo <span className="font-normal normal-case tracking-normal">(optional)</span>
      </span>

      <div className="flex items-start gap-3">
        <div className="relative size-32 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Captured headshot" className="size-full object-cover" />
          ) : live ? (
            <video ref={videoRef} playsInline muted className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Camera className="size-8 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {value ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  start();
                }}
                className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Retake
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : live ? (
            <>
              <button
                type="button"
                onClick={capture}
                className="rounded bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-[#570000]"
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={stop}
                className="rounded border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Camera className="size-3.5" aria-hidden="true" />
              Open camera
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  );
}
