import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

/**
 * Accès au compte sous forme d'icône uniquement (aucun bouton texte
 * « Se connecter » sur le store public ni sur l'espace développeur).
 */
export function AccountButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const isAuthenticated = useSupabaseSession();
  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors " +
    (tone === "dark"
      ? "text-background/70 hover:bg-background/10 hover:text-background"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground");

  if (isAuthenticated) {
    return (
      <button
        type="button"
        aria-label="Se déconnecter"
        title="Se déconnecter"
        className={base}
        onClick={async () => {
          await supabase.auth.signOut();
          toast.success("Déconnecté");
        }}
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <Link to="/auth" aria-label="Mon compte" title="Mon compte" className={base}>
      {isAuthenticated === null ? (
        <UserRound className="h-[18px] w-[18px]" />
      ) : (
        <LogIn className="h-[18px] w-[18px]" />
      )}
    </Link>
  );
}

/** Variante compacte utilisée dans les panneaux nécessitant une session. */
export function SignInIconLink({ label = "Se connecter" }: { label?: string }) {
  return (
    <Link
      to="/auth"
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <LogIn className="h-[18px] w-[18px]" />
    </Link>
  );
}
