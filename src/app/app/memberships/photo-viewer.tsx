"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Shows a member's headshot full size when the avatar is clicked. */
export function PhotoViewer({
  photo,
  onClose,
}: {
  photo: { url: string; name: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={photo !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{photo?.name}</DialogTitle>
        </DialogHeader>
        {photo && (
          <div className="overflow-hidden rounded-lg border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.name} className="w-full object-cover" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
