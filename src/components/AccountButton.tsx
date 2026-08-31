import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

type Space = "public" | "dev";

/**
 * Bouton de compte du menu : « Connexion » lorsque la session est absente,
 * « Déconnexion » sinon. L'espace ciblé (`public` ou `dev`) détermine le type
 * de profil créé, les deux espaces ayant des tables de profil distinctes.
 */
export function AccountButton({
  tone = "light",
  space = "public",
}: {
  tone?: "light" | "dark";
  space?: Space;
}) {
  const isAuthenticated = useSupabaseSession();
  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors " +
    (tone === "dark"
      ? "text-background/80 hover:bg-background/10 hover:text-background"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground");

  if (isAuthenticated === null) {
    return (
      <span className={base} aria-hidden="true">
        <UserRound className="h-[18px] w-[18px]" />
      </span>
    );
  }

  if (isAuthenticated) {
    return (
      <button
        type="button"
        className={base}
        onClick={async () => {
          await supabase.auth.signOut();
          toast.success("Déconnecté");
        }}
      >
        <LogOut className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
    );
  }

  return (
    <Link to="/auth" search={{ space }} className={base}>
      <LogIn className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">Connexion</span>
    </Link>
  );
}

/** Lien de connexion compact utilisé dans les panneaux nécessitant une session. */
export function SignInIconLink({ label = "Se connecter" }: { label?: string }) {
  return (
    <Link
      to="/auth"
      search={{ space: "dev" as Space }}
      aria-label={label}
      title={label}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <LogIn className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}
