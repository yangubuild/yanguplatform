const BADGE_ICON = "/yangu-badge-icon.png";

export const YANGU_BADGE_HTML = `<a href="https://yangu.io" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px 6px 8px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:500;color:#111827;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-decoration:none;line-height:1;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'"><img src="${BADGE_ICON}" alt="" style="width:14px;height:14px;border-radius:4px;display:block;" />Made in YANGU</a>`;

export function YanguBadge() {
  return (
    <a
      href="https://yangu.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "6px 10px 6px 8px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: "#111827",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        textDecoration: "none",
        lineHeight: 1,
      }}
    >
      <img src={BADGE_ICON} alt="" style={{ width: 14, height: 14, borderRadius: 4, display: "block" }} />
      Made in YANGU
    </a>
  );
}