export function BlogFooter() {
  return (
    <footer className="px-6 py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4" style={{ maxWidth: 1100 }}>
        <span
          className="text-sm"
          style={{ fontFamily: "'Lufga', sans-serif", }}
        >
          EVERY
        </span>
        <span className="text-xs text-muted-foreground">
          © 2026 Every. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
