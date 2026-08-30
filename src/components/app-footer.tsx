/**
 * Sticks to the bottom of the viewport, so it stays visible while the page
 * content scrolls between it and the navbar.
 */
export function AppFooter() {
  return (
    <footer className="sticky bottom-0 z-40 border-t border-border bg-card">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-3 text-center md:px-8">
        <p className="text-[13px] text-muted-foreground">
          Developed by{" "}
          <a
            href="https://addsmint.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary transition-colors hover:underline"
          >
            AddsMint
          </a>
        </p>
      </div>
    </footer>
  );
}
