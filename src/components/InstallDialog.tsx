import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { AppIcon } from "@/components/AppTile";
import { formatFcfa, type AppItem } from "@/lib/mock-data";

type Phase = "payment" | "downloading" | "installing" | "done";

export function InstallDialog({
  app,
  open,
  onOpenChange,
}: {
  app: AppItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>(app.priceFcfa > 0 ? "payment" : "downloading");
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!open) return;
    setProgress(0);
    setPhase(app.priceFcfa > 0 ? "payment" : "downloading");
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [open, app.priceFcfa]);

  useEffect(() => {
    if (!open || phase !== "downloading") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(100, p + Math.random() * 11 + 4);
      });
    }, 220);
    return () => clearInterval(interval);
  }, [open, phase]);

  useEffect(() => {
    if (phase !== "downloading" || progress < 100) return;
    const t1 = setTimeout(() => setPhase("installing"), 500);
    const t2 = setTimeout(() => setPhase("done"), 2600);
    timers.current.push(t1, t2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, progress]);

  const downloadedMb = ((progress / 100) * app.sizeMb).toFixed(1);
  const etaSeconds = Math.max(1, Math.round(((100 - progress) / 100) * 12));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {phase === "payment" && "Confirmer le paiement"}
            {phase === "downloading" && "Téléchargement en cours"}
            {phase === "installing" && "Installation en cours…"}
            {phase === "done" && "C'est installé !"}
          </DialogTitle>
          <DialogDescription>
            {phase === "payment" && `${app.name} — ${formatFcfa(app.priceFcfa)}`}
            {phase === "downloading" && "Ne fermez pas cette page."}
            {phase === "installing" && "Ne fermez pas cette page."}
            {phase === "done" && `${app.name} est prêt sur votre écran d'accueil.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <AppIcon app={app} size="lg" />

          {phase === "payment" && (
            <div className="w-full space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Choisissez votre moyen de paiement mobile money.
              </p>
              <div className="grid gap-2">
                {["MTN Mobile Money", "Orange Money", "Wave", "Moov Money"].map((m) => (
                  <Button
                    key={m}
                    variant="outline"
                    className="justify-start"
                    onClick={() => setPhase("downloading")}
                  >
                    <Smartphone className="mr-2 h-4 w-4" /> {m}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {phase === "downloading" && (
            <div className="w-full space-y-2">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {downloadedMb} / {app.sizeMb} Mo
                </span>
                <span>{progress >= 100 ? "Terminé" : `~${etaSeconds} s restantes`}</span>
              </div>
            </div>
          )}

          {phase === "installing" && (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p>Vérification de la signature, puis installation automatique.</p>
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Un raccourci a été ajouté à votre écran d'accueil.
              </p>
              <div className="flex gap-2">
                <Button variant="hero" onClick={() => onOpenChange(false)}>
                  Ouvrir l'app
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Retour au catalogue
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
