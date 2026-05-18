import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { AdminAuthContext } from "./useAdminAuth";

async function fetchAdminProfile(supabase, userId) {
  if (!supabase || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function AdminAuthProvider({ children }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isActive = true;

    async function loadSession() {
      setLoading(true);
      setError("");

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isActive) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      setSession(currentSession);

      if (!currentSession?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const adminProfile = await fetchAdminProfile(supabase, currentSession.user.id);

        if (!isActive) {
          return;
        }

        setProfile(adminProfile);
      } catch (profileError) {
        if (!isActive) {
          return;
        }

        setProfile(null);
        setError(profileError.message || "Failed to load admin profile.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isActive) {
        return;
      }

      setSession(nextSession);
      setError("");

      if (!nextSession?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const adminProfile = await fetchAdminProfile(supabase, nextSession.user.id);

        if (!isActive) {
          return;
        }

        setProfile(adminProfile);
      } catch (profileError) {
        if (!isActive) {
          return;
        }

        setProfile(null);
        setError(profileError.message || "Failed to load admin profile.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user: session?.user || null,
      profile,
      isAdmin: Boolean(profile?.is_admin),
      loading,
      error,
      async signIn(email, password) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });

        const timeoutPromise = new Promise((resolve) => {
          window.setTimeout(() => {
            resolve({ timedOut: true });
          }, 30000);
        });

        const result = await Promise.race([signInPromise, timeoutPromise]);

        if (result?.timedOut) {
          const {
            data: { session: fallbackSession },
            error: fallbackError,
          } = await supabase.auth.getSession();

          if (fallbackError) {
            throw fallbackError;
          }

          if (fallbackSession?.user?.id) {
            return { session: fallbackSession, timedOut: true };
          }

          throw new Error(
            "Login request took too long and no authenticated session was found."
          );
        }

        const { data, error: signInError } = result;

        if (signInError) {
          throw signInError;
        }

        return data;
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          throw signOutError;
        }
      },
    }),
    [error, loading, profile, session, supabase]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
