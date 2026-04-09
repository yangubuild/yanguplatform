const BADGE_ICON = "/yangu-badge-icon.png";

// Black badge, Lufga bold, lowercase "yangu" — injected as raw HTML into published emenu pages
export const YANGU_BADGE_HTML = `<a href="https://yangu.io" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:7px;background:#000;border-radius:10px;padding:7px 14px 7px 10px;font-family:'Lufga',system-ui,sans-serif;font-size:12px;font-weight:700;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.25);text-decoration:none;line-height:1;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'"><img src="${BADGE_ICON}" alt="" style="width:18px;height:18px;border-radius:4px;display:block;" />Made in yangu</a>`;

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
        gap: 7,
        background: "#000",
        borderRadius: 10,
        padding: "7px 14px 7px 10px",
        fontFamily: "'Lufga', system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        textDecoration: "none",
        lineHeight: 1,
      }}
    >
      <img src={BADGE_ICON} alt="" style={{ width: 18, height: 18, borderRadius: 4, display: "block" }} />
      Made in yangu
    </a>
  );
}
