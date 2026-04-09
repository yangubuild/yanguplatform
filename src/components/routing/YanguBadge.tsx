import { useEffect } from "react";

const BADGE_ICON = "/yangu-badge-mark.png";
const BADGE_URL = "https://yangu.io";
const BADGE_FONT_ID = "yangu-badge-font";
const BADGE_FONT_HREF = "https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap";

const BADGE_CONTAINER_STYLE = {
  position: "fixed",
  bottom: 16,
  right: 16,
  zIndex: 9999,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "hsl(0 0% 0%)",
  border: "1px solid hsl(0 0% 100% / 0.08)",
  borderRadius: 10,
  padding: "8px 14px 8px 10px",
  color: "hsl(0 0% 100%)",
  textDecoration: "none",
  lineHeight: 1,
  boxShadow: "0 10px 24px hsl(0 0% 0% / 0.18)",
} as const;

const BADGE_TEXT_STACK_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "'Lufga', system-ui, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0,
} as const;

const BADGE_WORDMARK_STYLE = {
  fontFamily: "'Lufga', system-ui, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "lowercase" as const,
} as const;

function ensureBadgeFont() {
  if (typeof document === "undefined") return;
  if (document.getElementById(BADGE_FONT_ID)) return;

  const link = document.createElement("link");
  link.id = BADGE_FONT_ID;
  link.rel = "stylesheet";
  link.href = BADGE_FONT_HREF;
  document.head.appendChild(link);
}

// Black badge, lowercase bold Lufga wordmark, exact YANGU icon
export const YANGU_BADGE_HTML = `<a data-yangu-badge="true" href="${BADGE_URL}" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:8px;background:hsl(0 0% 0%);border:1px solid hsl(0 0% 100% / 0.08);border-radius:10px;padding:8px 14px 8px 10px;color:hsl(0 0% 100%);text-decoration:none;line-height:1;box-shadow:0 10px 24px hsl(0 0% 0% / 0.18);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'"><img src="${BADGE_ICON}" alt="" aria-hidden="true" style="width:18px;height:18px;display:block;flex:none;" /><span style="display:inline-flex;align-items:center;gap:4px;font-family:'Lufga',system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:0;"><span style="opacity:0.92;">Made in</span><span style="font-family:'Lufga',system-ui,sans-serif;font-size:12px;font-weight:700;text-transform:lowercase;">yangu</span></span></a>`;

export function YanguBadge() {
  useEffect(() => {
    ensureBadgeFont();
  }, []);

  return (
    <a href={BADGE_URL} target="_blank" rel="noopener noreferrer" data-yangu-badge="true" style={BADGE_CONTAINER_STYLE}>
      <img src={BADGE_ICON} alt="" aria-hidden="true" style={{ width: 18, height: 18, display: "block", flex: "none" }} />
      <span style={BADGE_TEXT_STACK_STYLE}>
        <span style={{ opacity: 0.92 }}>Made in</span>
        <span style={BADGE_WORDMARK_STYLE}>yangu</span>
      </span>
    </a>
  );
}
