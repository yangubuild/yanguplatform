import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function EmailPreviewPage() {
  const navigate = useNavigate();
  const displayName = "John";

  return (
    <div className="min-h-screen text-foreground bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Welcome Email Preview</h1>
      </div>

      {/* Email render */}
      <div className="flex justify-center py-10 px-4">
        <div
          style={{
            maxWidth: 600,
            width: "100%",
            background: "#ffffff",
            fontFamily: "'Lufga', Arial, sans-serif",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
          {/* Hero */}
          <img
            src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-header-welcome.png"
            alt="Welcome to yangu"
            style={{ display: "block", width: "100%", height: "auto" }}
          />

          {/* Badge */}
          <div style={{ textAlign: "right" as const, padding: "16px 32px 0" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 13,
                color: "#333333",
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                padding: "4px 12px" }}>
              Welcome 🎉
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#08120D",
              textAlign: "center",
              margin: "24px 0 16px" }}>
            Welcome, {displayName}!
          </h2>

          {/* Body */}
          <p
            style={{
              fontSize: 16,
              color: "#55575d",
              lineHeight: 1.6,
              textAlign: "center",
              padding: "0 32px",
              margin: "0 0 32px" }}>
            Your account is all set up and ready to go. Start building your
            internet business with yangu — your hub for creating, connecting,
            and growing.
          </p>

          {/* CTA */}
          <div style={{ textAlign: "center" as const, padding: "0 32px 32px" }}>
            <img
              src="https://xcipuyvcwfytlsjryhvs.supabase.co/storage/v1/object/public/email-assets/email-button-go-to-dashboard.png"
              width={230}
              alt="GO TO DASHBOARD"
              style={{ display: "block", margin: "0 auto", height: "auto", border: "none" }}
            />
          </div>

          {/* Sign-off */}
          <p
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#08120D",
              textAlign: "center",
              margin: "0 0 24px",
              padding: "0 32px" }}>
            Build, connect, and grow wealth with yangu!
          </p>
          <p style={{ fontSize: 15, color: "#55575d", textAlign: "center", margin: "0 0 8px" }}>
            Your internet business hub,
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#08120D",
              textAlign: "center",
              margin: "0 0 40px" }}>
            Lets go 🚀
          </p>

          {/* Divider */}
          <hr
            style={{
              borderColor: "#e5e5e5",
              borderStyle: "dashed",
              margin: "0 32px 24px" }}
          />

          {/* Footer */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ padding: "0 32px 32px" }}>
            <tbody>
              <tr>
                <td style={{ fontSize: 13, color: "#888888" }}>
                  <span style={{ color: "#D4731A", fontSize: 14 }}>✉️</span>
                  &nbsp;&nbsp;
                  <a href="mailto:info@yangu.io" style={{ color: "#888888", textDecoration: "none" }}>
                    info@yangu.io
                  </a>
                </td>
                <td align="right" style={{ fontSize: 13, color: "#888888" }}>
                  <span style={{ color: "#D4731A", fontSize: 14 }}>🌐</span>
                  &nbsp;&nbsp;
                  <a href="https://www.yangu.io" style={{ color: "#888888", textDecoration: "none" }}>
                    www.yangu.io
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
