import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";
import {
  consumePasswordRecoveryUrl,
  fetchUserProfile,
  isPasswordRecoveryUrl,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  type UserProfile,
} from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { unregisterPushToken } from "@/lib/pushNotifications";

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  passwordRecovery: {
    status: "idle" | "processing" | "ready" | "error";
    error?: string;
  };
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
  const [passwordRecovery, setPasswordRecovery] = useState<
    AuthContextValue["passwordRecovery"]
  >({ status: "idle" });
  const signingOutRef = useRef(false);
  const processedRecoveryUrls = useRef(new Set<string>());

  const handleRecoveryUrl = useCallback(async (url: string | null) => {
    if (
      !url ||
      processedRecoveryUrls.current.has(url) ||
      !isPasswordRecoveryUrl(url)
    ) {
      return;
    }

    processedRecoveryUrls.current.add(url);
    setPasswordRecovery({ status: "processing" });
    try {
      const result = await consumePasswordRecoveryUrl(url);
      setPasswordRecovery(
        result.error
          ? { status: "error", error: result.error }
          : { status: "ready" }
      );
    } catch (error) {
      setPasswordRecovery({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Could not verify the password reset link.",
      });
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    if (signingOutRef.current) return;

    const data = await fetchUserProfile(userId).catch(() => null);
    if (signingOutRef.current) return;

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    if (currentSession?.user?.id === userId) {
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    async function initSession() {
      try {
        if (!isSupabaseConfigured) {
          setSession(null);
          setProfile(null);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        } else {
          setProfile(null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initSession();

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

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    const processUrl = (url: string | null) => {
      if (active) void handleRecoveryUrl(url);
    };

    void Linking.getInitialURL()
      .then(processUrl)
      .catch((error: unknown) => {
        console.warn(
          "Could not read the initial app link:",
          error instanceof Error ? error.message : error
        );
      });
    const subscription = Linking.addEventListener("url", ({ url }) => {
      processUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [handleRecoveryUrl]);

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
      if (session?.user) {
        try {
          await unregisterPushToken(session.user.id);
        } catch (error) {
          console.warn(
            "Could not unregister push notifications:",
            error instanceof Error ? error.message : error
          );
        }
      }
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
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      passwordRecovery,
      signIn,
      signUp,
      signOut,
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
    }),
    [
      session,
      profile,
      loading,
      passwordRecovery,
      signIn,
      signUp,
      signOut,
      loadProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
