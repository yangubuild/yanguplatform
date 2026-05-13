import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PhoneOtpLogin } from "../PhoneOtpLogin";
import { OfflineLayout } from "../OfflineLayout";
import { AgentShops } from "./AgentShops";
import { AgentShopDetail } from "./AgentShopDetail";
import { AgentBounty } from "./AgentBounty";
import { AgentAddShop } from "./AgentAddShop";

export default function AgentApp() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (userId === undefined) return null;
  if (!userId) {
    return (
      <PhoneOtpLogin
        title="Foot soldier login"
        subtitle="Sign in with the phone number registered with Yangu Offline."
        onSuccess={() => { /* state listener catches it */ }}
      />
    );
  }

  return (
    <OfflineLayout
      title="Foot soldier"
      nav={[
        { to: "/offline/agent", label: "Shops" },
        { to: "/offline/agent/bounty", label: "Bounty" },
        { to: "/offline/agent/add", label: "Add shop" },
      ]}
      rightSlot={
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
        >Sign out</button>
      }
    >
      <Routes>
        <Route index element={<AgentShops userId={userId} />} />
        <Route path="shop/:id" element={<AgentShopDetail />} />
        <Route path="bounty" element={<AgentBounty userId={userId} />} />
        <Route path="add" element={<AgentAddShop userId={userId} />} />
        <Route path="*" element={<Navigate to="/offline/agent" replace />} />
      </Routes>
    </OfflineLayout>
  );
}