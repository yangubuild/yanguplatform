import { useEffect } from "react";

const BADGE_ICON = "/yangu-badge-mark.png";
const BADGE_URL = "https://yangu.io";
const BADGE_FONT_ID = "yangu-badge-font";
const BADGE_FONT_HREF = "https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap";

function ensureBadgeFont() {
  if (typeof document === "undefined") return;
  if (document.getElementById(BADGE_FONT_ID)) return;
  const link = document.createElement("link");
  link.id = BADGE_FONT_ID;
  link.rel = "stylesheet";
  link.href = BADGE_FONT_HREF;
  document.head.appendChild(link);
}

// Raw HTML version for document.write injection
export const YANGU_BADGE_HTML = `<a data-yangu-badge="true" href="${BADGE_URL}" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:8px;background:#000;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 14px 8px 10px;color:#fff;text-decoration:none;line-height:1;box-shadow:0 10px 24px rgba(0,0,0,0.18);font-family:'Lufga',system-ui,sans-serif;" onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'"><img src="${BADGE_ICON}" alt="" aria-hidden="true" style="width:18px;height:18px;display:block;flex-shrink:0;border-radius:4px;" /><span style="display:inline-flex;align-items:center;gap:4px;font-family:'Lufga',system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:0;"><span style="opacity:0.92;">Made in</span><span style="font-family:'Lufga',system-ui,sans-serif;font-size:12px;font-weight:700;text-transform:lowercase;">yangu</span></span></a>`;

export function YanguBadge() {
  useEffect(() => {
    ensureBadgeFont();
  }, []);

  return (
    <a
      href={BADGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-yangu-badge="true"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#000",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "8px 14px 8px 10px",
        color: "#fff",
        textDecoration: "none",
        lineHeight: 1,
        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
      }}
    >
      <img src={BADGE_ICON} alt="" aria-hidden="true" style={{ width: 18, height: 18, display: "block", flex: "none", borderRadius: 4 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Lufga', system-ui, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 0 }}>
        <span style={{ opacity: 0.92 }}>Made in</span>
        <span style={{ fontFamily: "'Lufga', system-ui, sans-serif", fontSize: 12, fontWeight: 700, textTransform: "lowercase" as const }}>yangu</span>
      </span>
    </a>
  );
}
