export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        {eyebrow && <p className="label-caps text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
