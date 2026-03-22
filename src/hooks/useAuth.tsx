import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CreatorType = "seller" | "builder" | "organization" | "learner";

export type AccountStatus = 'registered' | 'verified_pending_onboarding' | 'onboarding_in_progress' | 'active' | 'suspended';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  avatar_mode: string | null;
  avatar_emoji_key: string | null;
  creator_type: CreatorType | null;
  country: string | null;
  business_name: string | null;
  onboarding_completed: boolean;
  account_status: AccountStatus;
  email_verified_at: string | null;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  onboarding_step: string | null;
  welcome_email_sent_at: string | null;
  last_onboarding_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inviteCheckedRef = useRef(false);
  // Track whether initial session has been handled to prevent double fetch
  const initialSessionHandledRef = useRef(false);
  // Track in-flight profile fetch to deduplicate
  const profileFetchRef = useRef<Promise<Profile | null> | null>(null);

  const tryAcceptInvite = useCallback((userId: string) => {
    if (inviteCheckedRef.current) return;
    inviteCheckedRef.current = true;
    (supabase.rpc as any)('accept_pending_invite').then?.(() => {}).catch?.((err: any) =>
      console.error("accept_pending_invite failed:", err)
    );
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    // Deduplicate: if a fetch for this user is already in-flight, reuse it
    if (profileFetchRef.current) {
      return profileFetchRef.current;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return null;
        }

        // Sync email_verified_at from auth session if not yet set
        const profile = data as Profile;
        if (!profile.email_verified_at) {
          const { data: { session } } = await supabase.auth.getSession();
          const confirmedAt = session?.user?.email_confirmed_at;
          if (confirmedAt) {
            const newStatus = !profile.onboarding_completed 
              ? (profile.onboarding_started_at ? 'onboarding_in_progress' : 'verified_pending_onboarding')
              : profile.account_status;
            await supabase.from("profiles").update({
              email_verified_at: confirmedAt,
              account_status: newStatus,
            } as any).eq("id", userId);
            profile.email_verified_at = confirmedAt;
            if (newStatus !== profile.account_status) {
              profile.account_status = newStatus as AccountStatus;
            }
          }
        }

        return profile;
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        return null;
      } finally {
        profileFetchRef.current = null;
      }
    })();

    profileFetchRef.current = promise;
    return promise;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileFetchRef.current = null; // Force fresh fetch on explicit refresh
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // If the initial getSession already handled this exact session, skip
        if (initialSessionHandledRef.current && (event === "INITIAL_SESSION")) {
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid blocking the auth state change callback
          setTimeout(async () => {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
            tryAcceptInvite(currentSession.user.id);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Check initial session — this is the SINGLE SOURCE OF TRUTH for boot
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      initialSessionHandledRef.current = true;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).then((profileData) => {
          setProfile(profileData);
          tryAcceptInvite(initialSession.user.id);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    // Clear routing context on logout
    try { sessionStorage.removeItem("yangu_active_context"); } catch {}
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const isAuthenticated = !!user && !!session;
  const needsOnboarding = isAuthenticated && profile && !profile.onboarding_completed;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated,
        needsOnboarding: !!needsOnboarding,
        signOut,
        refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
