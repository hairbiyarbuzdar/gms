import type { LucideIcon } from "lucide-react";

/**
 * Stands in for a module that is routed and authorized but not yet built.
 * States plainly that it is unbuilt rather than implying a loading or empty
 * state that will resolve on its own.
 */
export function ModulePlaceholder({
  icon: Icon,
  requirements,
}: {
  icon: LucideIcon;
  /** The FR range this module implements, e.g. "FR-23 - FR-28". */
  requirements: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
      <Icon className="size-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium">Not built yet</p>
      <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
        Implements {requirements}.
      </p>
    </div>
  );
}
