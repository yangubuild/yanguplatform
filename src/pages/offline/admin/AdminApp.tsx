import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PhoneOtpLogin } from "../PhoneOtpLogin";
import { OfflineLayout, Card } from "../OfflineLayout";
import { AdminOverview } from "./AdminOverview";
import { AdminShops } from "./AdminShops";
import { AdminFootSoldiers } from "./AdminFootSoldiers";
import { AdminBountyConfig } from "./AdminBountyConfig";
import { AdminSyncActivity } from "./AdminSyncActivity";

export default function AdminApp() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async (uid: string | null) => {
      setUserId(uid);
      if (!uid) { setIsAdmin(null); return; }
      const { data } = await supabase.from("offline_app_admins").select("user_id").eq("user_id", uid).maybeSingle();
      setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (userId === undefined) return null;
  if (!userId) return <PhoneOtpLogin title="Admin login" subtitle="Yangu Offline operator panel." onSuccess={() => {}} />;
  if (isAdmin === null) return null;
  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#F3F1EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card><h2 style={{ marginTop: 0 }}>Not authorised</h2><p>This account is not in the admin allow-list.</p>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </Card>
      </div>
    );
  }

  return (
    <OfflineLayout
      title="Admin"
      nav={[
        { to: "/offline/admin", label: "Overview" },
        { to: "/offline/admin/shops", label: "Shops" },
        { to: "/offline/admin/agents", label: "Foot soldiers" },
        { to: "/offline/admin/bounty", label: "Bounty config" },
        { to: "/offline/admin/activity", label: "Sync activity" },
      ]}
      rightSlot={
        <button onClick={() => supabase.auth.signOut()} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>Sign out</button>
      }
    >
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="agents" element={<AdminFootSoldiers />} />
        <Route path="bounty" element={<AdminBountyConfig />} />
        <Route path="activity" element={<AdminSyncActivity />} />
        <Route path="*" element={<Navigate to="/offline/admin" replace />} />
      </Routes>
    </OfflineLayout>
  );
}