import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side auth state. `null` while unknown (SSR / first paint),
 * then `true`/`false` once Supabase resolves the session.
 */
export function useSupabaseSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsAuthenticated(Boolean(session));
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setIsAuthenticated(Boolean(data.session));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return isAuthenticated;
}
