import { Globe } from "lucide-react";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger
        aria-label={t("nav.language")}
        className="h-9 w-[112px] gap-1.5 rounded-lg text-xs"
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-xs">
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
