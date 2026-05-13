import { Link } from "react-router-dom";
import { offlineTheme as t } from "./theme";

export default function OfflineHome() {
  const tile = (to: string, title: string, subtitle: string) => (
    <Link to={to} style={{
      display: "block", textDecoration: "none",
      background: "#fff", border: `1px solid ${t.border}`, borderRadius: 12,
      padding: 24, color: t.text,
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: t.primary }}>{title}</div>
      <div style={{ fontSize: 14, color: t.muted, marginTop: 6 }}>{subtitle}</div>
    </Link>
  );
  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: t.fontFamily, padding: 32 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ color: t.primary, marginBottom: 4 }}>yangu offline</h1>
        <p style={{ color: t.muted, marginTop: 0, marginBottom: 24 }}>Sign in to the panel that fits you.</p>
        <div style={{ display: "grid", gap: 12 }}>
          {tile("/offline/agent", "Foot soldier", "Onboard shops, track bounty.")}
          {tile("/offline/shop", "Shop owner", "Read-only view of your catalog and sales.")}
          {tile("/offline/admin", "Admin", "Operator panel.")}
        </div>
      </div>
    </div>
  );
}