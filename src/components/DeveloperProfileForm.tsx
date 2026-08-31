import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureDeveloperProfile } from "@/lib/dev-apps.functions";

/**
 * Formulaire autonome de création du profil développeur.
 * Utilisé partout où l'espace développeur exige un profil actif.
 */
export function NoProfile() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const name = displayName.trim();
      if (name.length < 2) throw new Error("Indiquez un nom public d'au moins 2 caractères.");
      const result = await ensureDeveloperProfile({
        data: { displayName: name, country: country.trim() || null },
      });
      if (!result.ok) throw new Error("La création du profil a échoué. Réessayez.");
      return result;
    },
    onSuccess: () => {
      setError(null);
      toast.success("Profil développeur activé");
      void queryClient.invalidateQueries({ queryKey: ["dev-workspace"] });
      void queryClient.invalidateQueries({ queryKey: ["dev-stats"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      className="surface-card mx-auto w-full max-w-md space-y-4 rounded-2xl p-6"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Créez votre profil développeur</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Un profil développeur est nécessaire pour publier des applications sur E'nvlé Store.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="dev-name">Nom public</Label>
        <Input
          id="dev-name"
          required
          minLength={2}
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nom de votre studio ou de votre marque"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dev-country">Pays (optionnel)</Label>
        <Input
          id="dev-country"
          maxLength={60}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Côte d'Ivoire"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="hero" className="w-full" disabled={create.isPending}>
        {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Activer mon espace
      </Button>
    </form>
  );
}
