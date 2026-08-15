import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  fetchUserProfile,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  type UserProfile,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<string | undefined>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (signingOutRef.current) return;

    const data = await fetchUserProfile(userId);
    if (signingOutRef.current) return;

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    if (currentSession?.user?.id === userId) {
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        setSession(nextSession);

        if (nextSession?.user && event !== "SIGNED_OUT") {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authSignIn(email, password);
    return { error: error?.message };
  }, []);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
    }) => {
      const { data, error } = await authSignUp(params);
      if (error) return { error: error.message };
      if (!data.session) return { needsEmailConfirmation: true };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      const { error } = await authSignOut();
      if (error) {
        return error.message;
      }
      setSession(null);
      setProfile(null);
      return undefined;
    } finally {
      signingOutRef.current = false;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
    }),
    [session, profile, loading, signIn, signUp, signOut, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
