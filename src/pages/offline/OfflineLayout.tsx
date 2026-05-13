import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { offlineTheme as t } from "./theme";

interface NavItem { to: string; label: string; }

export function OfflineLayout({
  title,
  nav,
  children,
  rightSlot,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: t.bg,
      color: t.text,
      fontFamily: t.fontFamily,
    }}>
      <header style={{
        background: t.primary,
        color: "#fff",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>
        <Link to="/offline" style={{ color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 18 }}>
          yangu offline
        </Link>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{title}</div>
        <div>{rightSlot}</div>
      </header>
      <nav style={{
        background: "#fff",
        borderBottom: `1px solid ${t.border}`,
        padding: "0 20px",
        display: "flex",
        gap: 4,
        overflowX: "auto",
      }}>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            style={({ isActive }) => ({
              padding: "12px 14px",
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? t.accent : t.text,
              borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
            })}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
      <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 16,
      ...style,
    }}>{children}</div>
  );
}

export function Button({
  children, onClick, type = "button", variant = "primary", disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const colors = {
    primary: { bg: t.accent, color: "#fff", border: t.accent },
    secondary: { bg: t.primary, color: "#fff", border: t.primary },
    ghost: { bg: "transparent", color: t.text, border: t.border },
    danger: { bg: "#b3261e", color: "#fff", border: "#b3261e" },
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: "10px 16px",
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >{children}</button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        fontSize: 14,
        background: "#fff",
        color: t.text,
        ...props.style,
      }}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: t.muted }}>{label}</div>
      {children}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const map = {
    ok: { bg: "#E5F4EE", color: "#1B6B4F" },
    warn: { bg: "#FBEFD8", color: "#8B5A00" },
    bad: { bg: "#FBE0DD", color: "#9B221A" },
    neutral: { bg: "#EEEAE0", color: t.text },
  }[tone];
  return (
    <span style={{
      background: map.bg, color: map.color,
      padding: "3px 8px", borderRadius: 999,
      fontSize: 12, fontWeight: 600,
    }}>{children}</span>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 12px",
                borderBottom: `1px solid ${t.border}`,
                color: t.muted, fontWeight: 600, fontSize: 12,
                textTransform: "uppercase", letterSpacing: 0.5,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: "12px", borderBottom: `1px solid ${t.border}` }}>{c}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ padding: 24, textAlign: "center", color: t.muted }}>Nothing yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function lastSeenTone(at: string | null): "ok" | "warn" | "bad" {
  if (!at) return "bad";
  const d = Date.now() - new Date(at).getTime();
  if (d < 1000 * 60 * 60 * 24) return "ok";
  if (d < 1000 * 60 * 60 * 24 * 7) return "warn";
  return "bad";
}

export function lastSeenLabel(at: string | null): string {
  if (!at) return "Never";
  const d = Date.now() - new Date(at).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}