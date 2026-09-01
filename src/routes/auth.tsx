import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StoreShell } from "@/components/StoreShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Space = "public" | "dev";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { space: Space } => ({
    space: search['space'] === "dev" ? "dev" : "public",
  }),
  head: () => ({
    meta: [
      { title: "Connexion développeur — E'nvlé Store" },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace développeur E'nvlé pour publier vos applications et gérer vos revenus.",
      },
      { property: "og:title", content: "Connexion développeur — E'nvlé Store" },
      {
        property: "og:description",
        content: "Accédez à votre tableau de bord financier et à vos builds Android.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { space } = Route.useSearch();
  const target = space === "dev" ? "/dev" : "/";
  const isDev = space === "dev";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: target });
    });
  }, [navigate, target]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Connexion impossible — vérifiez vos identifiants.");
      return;
    }
    toast.success("Connexion réussie");
    void navigate({ to: target });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${target}`,
        data: { display_name: name || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Inscription impossible — cet e-mail est peut-être déjà utilisé.");
      return;
    }
    toast.success("Compte créé — vérifiez votre boîte mail si la confirmation est requise.");
  };

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <h1 className="font-display text-2xl font-semibold">
          {isDev ? "Espace développeur" : "Mon compte"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDev
            ? "Connectez-vous pour accéder à vos soldes, retraits et builds Android."
            : "Connectez-vous pour retrouver vos applications installées, vos favoris et vos avis."}
        </p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Connexion
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Créer un compte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form className="surface-card mt-4 space-y-4 rounded-2xl p-5" onSubmit={signIn}>
              <div className="space-y-1.5">
                <Label htmlFor="in-email">E-mail</Label>
                <Input
                  id="in-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-pass">Mot de passe</Label>
                <Input
                  id="in-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Se connecter
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form className="surface-card mt-4 space-y-4 rounded-2xl p-5" onSubmit={signUp}>
              <div className="space-y-1.5">
                <Label htmlFor="up-name">Nom affiché</Label>
                <Input id="up-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-email">E-mail</Label>
                <Input
                  id="up-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-pass">Mot de passe</Label>
                <Input
                  id="up-pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer mon compte
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </StoreShell>
  );
}
