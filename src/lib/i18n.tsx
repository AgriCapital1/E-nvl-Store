import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "en" | "bci" | "dyu" | "goa" | "bet";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
  { code: "bci", label: "Baoulé", short: "BCI" },
  { code: "dyu", label: "Dioula", short: "DYU" },
  { code: "goa", label: "Gouro", short: "GOA" },
  { code: "bet", label: "Bété", short: "BET" },
];

type Dict = Record<string, string>;

/* ---------------- FR (référence) ---------------- */

const fr: Dict = {
  /* --- Public store --- */
  "nav.home": "Accueil",
  "nav.categories": "Catégories",
  "nav.language": "Langue",
  "nav.searchOpen": "Rechercher",

  "home.title1": "Découvrez vos",
  "home.title2": "prochaines applications.",
  "home.subtitle":
    "Tout ce qu'il vous faut, en un seul endroit. Cherchez, découvrez et installez simplement.",
  "home.search": "Rechercher une application…",
  "home.cta": "Explorer les applications",

  "home.trending": "Tendances",
  "home.popular": "Populaires en ce moment",
  "home.new": "Nouveautés",
  "home.editorial": "Sélection du moment",
  "home.editorialText": "Des applications choisies pour leur simplicité et leur utilité au quotidien.",
  "home.recommended": "Recommandées pour vous",
  "home.categories": "Parcourir par catégorie",
  "home.all": "Toutes",
  "home.allPrices": "Tous les prix",
  "home.free": "Gratuit",
  "home.paid": "Payant",
  "home.results": "Résultats",
  "home.empty": "Aucune application ne correspond à cette recherche.",
  "home.seeAll": "Tout voir",

  "cat.title": "Catégories",
  "cat.subtitle": "Trouvez l'application qu'il vous faut, par univers.",
  "cat.apps": "applications",

  "app.back": "Retour",
  "app.install": "Installer",
  "app.open": "Ouvrir",
  "app.description": "À propos de cette application",
  "app.screenshots": "Aperçu",
  "app.permissions": "Accès demandés",
  "app.whatsnew": "Nouveautés de cette version",
  "app.reviews": "Notes et avis",
  "app.verified": "Application vérifiée",
  "app.pending": "En cours de vérification",
  "app.autoInstall": "Téléchargement et installation automatiques.",
  "app.updatedOn": "Mise à jour le",
  "app.version": "Version",
  "app.size": "Taille",
  "app.category": "Catégorie",
  "app.editor": "Éditeur",
  "app.downloads": "installations",
  "app.notFound": "Cette application n'est plus disponible",
  "app.notFoundText": "Elle a peut-être été retirée du store.",
  "app.backHome": "Retour à l'accueil",

  "reviews.average": "Note moyenne",
  "reviews.count": "avis",
  "reviews.write": "Donner mon avis",
  "reviews.name": "Votre nom",
  "reviews.rating": "Votre note",
  "reviews.comment": "Votre commentaire",
  "reviews.submit": "Publier l'avis",
  "reviews.pending": "En attente de modération",
  "reviews.thanks": "Merci ! Votre avis sera visible après vérification.",
  "reviews.needName": "Indiquez votre nom et un commentaire.",
  "reviews.spam": "Cet avis ressemble à du spam. Reformulez-le.",
  "reviews.duplicate": "Vous avez déjà publié un avis très similaire.",
  "reviews.moderation": "Modération",
  "reviews.approve": "Approuver",
  "reviews.reject": "Rejeter",
  "reviews.approved": "Avis approuvé",
  "reviews.rejected": "Avis rejeté",
  "reviews.none": "Aucun avis pour le moment. Soyez le premier.",
  "reviews.sort": "Trier",
  "reviews.sort.recent": "Plus récents",
  "reviews.sort.best": "Meilleures notes",
  "reviews.sort.worst": "Notes les plus basses",
  "reviews.filter.all": "Toutes les notes",
  "reviews.more": "Voir plus d'avis",

  "footer.tagline": "Des applications à découvrir et à installer simplement.",
  "footer.legal": "Confidentialité",
  "footer.rights": "Tous droits réservés.",

  "install.title": "Installation",
  "install.pay": "Paiement mobile money",
  "install.downloading": "Téléchargement",
  "install.installing": "Installation",
  "install.done": "Installée",

  /* --- Espace développeur --- */
  "dev.brand": "E'nvlé Developers",
  "dev.headline": "Publier n'a jamais été aussi simple.",
  "dev.sub":
    "Transformez votre site ou votre PWA en application Android, publiez-la et distribuez-la depuis un seul espace.",
  "dev.nav.overview": "Tableau de bord",
  "dev.nav.docs": "Documentation",
  "dev.tab.pwa": "PWA → APK",
  "dev.tab.upload": "Envoyer un APK",
  "dev.tab.apps": "Mes applications",
  "dev.tab.analytics": "Statistiques",
  "dev.tab.payouts": "Revenus",

  "pwa.title": "Convertir un site ou une PWA en APK",
  "pwa.subtitle":
    "Collez l'URL de votre application web. Le système détecte le manifest, l'icône et les couleurs, génère les captures, puis compile et signe l'APK.",
  "pwa.url": "URL de l'application",
  "pwa.start": "Lancer la conversion",
  "pwa.invalid": "Entrez une URL valide (ex : app.agricapital.ci)",
  "pwa.running": "Conversion en cours…",
  "pwa.done": "APK généré avec succès",
  "pwa.failed": "La conversion a échoué",
  "pwa.retry": "Reprendre la conversion",
  "pwa.queue": "File d'attente",
  "pwa.queued": "En attente",
  "pwa.history": "Historique des conversions",
  "pwa.noHistory": "Aucune conversion pour le moment.",
  "pwa.step.detect": "Détection du site et du manifest",
  "pwa.step.manifest": "Lecture du manifest.json et du service worker",
  "pwa.step.icons": "Extraction et génération des icônes (48 → 512 px)",
  "pwa.step.shots": "Captures d'écran automatiques (mobile)",
  "pwa.step.wrap": "Génération du projet TWA / WebView",
  "pwa.step.build": "Compilation Gradle de l'APK",
  "pwa.step.sign": "Signature et analyse de sécurité",
  "pwa.editTitle": "Fiche générée — modifiable",
  "pwa.appName": "Nom de l'application",
  "pwa.tagline": "Accroche",
  "pwa.desc": "Description",
  "pwa.category": "Catégorie",
  "pwa.price": "Prix (FCFA)",
  "pwa.icons": "Icône détectée",
  "pwa.shots": "Captures générées",
  "pwa.replaceIcon": "Remplacer l'icône",
  "pwa.replaceShots": "Remplacer les captures",
  "pwa.publish": "Publier sur le store",
  "pwa.published": "Application envoyée au store",
  "pwa.download": "Télécharger l'APK",
  "pwa.restart": "Nouvelle conversion",
  "pwa.detected": "Détecté automatiquement",
};

/* ---------------- EN ---------------- */

const en: Dict = {
  "nav.home": "Home",
  "nav.categories": "Categories",
  "nav.language": "Language",
  "nav.searchOpen": "Search",

  "home.title1": "Discover your",
  "home.title2": "next apps.",
  "home.subtitle": "Everything you need, in one place. Search, discover and install in one tap.",
  "home.search": "Search for an app…",
  "home.cta": "Explore apps",

  "home.trending": "Trending",
  "home.popular": "Popular right now",
  "home.new": "New arrivals",
  "home.editorial": "Editor's pick",
  "home.editorialText": "Apps picked for how simple and useful they are, every day.",
  "home.recommended": "Recommended for you",
  "home.categories": "Browse by category",
  "home.all": "All",
  "home.allPrices": "All prices",
  "home.free": "Free",
  "home.paid": "Paid",
  "home.results": "Results",
  "home.empty": "No app matches this search.",
  "home.seeAll": "See all",

  "cat.title": "Categories",
  "cat.subtitle": "Find the right app, by universe.",
  "cat.apps": "apps",

  "app.back": "Back",
  "app.install": "Install",
  "app.open": "Open",
  "app.description": "About this app",
  "app.screenshots": "Preview",
  "app.permissions": "Requested access",
  "app.whatsnew": "What's new",
  "app.reviews": "Ratings and reviews",
  "app.verified": "Verified app",
  "app.pending": "Being verified",
  "app.autoInstall": "Automatic download and install.",
  "app.updatedOn": "Updated on",
  "app.version": "Version",
  "app.size": "Size",
  "app.category": "Category",
  "app.editor": "Publisher",
  "app.downloads": "installs",
  "app.notFound": "This app is no longer available",
  "app.notFoundText": "It may have been removed from the store.",
  "app.backHome": "Back home",

  "reviews.average": "Average rating",
  "reviews.count": "reviews",
  "reviews.write": "Write a review",
  "reviews.name": "Your name",
  "reviews.rating": "Your rating",
  "reviews.comment": "Your comment",
  "reviews.submit": "Post review",
  "reviews.pending": "Awaiting moderation",
  "reviews.thanks": "Thanks! Your review will appear once checked.",
  "reviews.needName": "Please add your name and a comment.",
  "reviews.spam": "This review looks like spam. Please rewrite it.",
  "reviews.duplicate": "You already posted a very similar review.",
  "reviews.moderation": "Moderation",
  "reviews.approve": "Approve",
  "reviews.reject": "Reject",
  "reviews.approved": "Review approved",
  "reviews.rejected": "Review rejected",
  "reviews.none": "No review yet. Be the first.",
  "reviews.sort": "Sort",
  "reviews.sort.recent": "Most recent",
  "reviews.sort.best": "Highest rated",
  "reviews.sort.worst": "Lowest rated",
  "reviews.filter.all": "All ratings",
  "reviews.more": "Show more reviews",

  "footer.tagline": "Apps to discover and install, simply.",
  "footer.legal": "Privacy",
  "footer.rights": "All rights reserved.",

  "install.title": "Installation",
  "install.pay": "Mobile money payment",
  "install.downloading": "Downloading",
  "install.installing": "Installing",
  "install.done": "Installed",

  "dev.brand": "E'nvlé Developers",
  "dev.headline": "Publishing has never been this simple.",
  "dev.sub":
    "Turn your website or PWA into an Android app, publish it and distribute it from a single workspace.",
  "dev.nav.overview": "Dashboard",
  "dev.nav.docs": "Documentation",
  "dev.tab.pwa": "PWA → APK",
  "dev.tab.upload": "Upload an APK",
  "dev.tab.apps": "My apps",
  "dev.tab.analytics": "Analytics",
  "dev.tab.payouts": "Revenue",

  "pwa.title": "Turn a website or PWA into an APK",
  "pwa.subtitle":
    "Paste your web app URL. The system detects the manifest, icon and colors, generates screenshots, then builds and signs the APK.",
  "pwa.url": "App URL",
  "pwa.start": "Start conversion",
  "pwa.invalid": "Enter a valid URL (e.g. app.agricapital.ci)",
  "pwa.running": "Converting…",
  "pwa.done": "APK built successfully",
  "pwa.failed": "Conversion failed",
  "pwa.retry": "Resume conversion",
  "pwa.queue": "Queue",
  "pwa.queued": "Queued",
  "pwa.history": "Conversion history",
  "pwa.noHistory": "No conversion yet.",
  "pwa.step.detect": "Detecting site and manifest",
  "pwa.step.manifest": "Reading manifest.json and service worker",
  "pwa.step.icons": "Extracting and generating icons (48 → 512 px)",
  "pwa.step.shots": "Automatic mobile screenshots",
  "pwa.step.wrap": "Generating TWA / WebView project",
  "pwa.step.build": "Gradle APK compilation",
  "pwa.step.sign": "Signing and security analysis",
  "pwa.editTitle": "Generated listing — editable",
  "pwa.appName": "App name",
  "pwa.tagline": "Tagline",
  "pwa.desc": "Description",
  "pwa.category": "Category",
  "pwa.price": "Price (FCFA)",
  "pwa.icons": "Detected icon",
  "pwa.shots": "Generated screenshots",
  "pwa.replaceIcon": "Replace icon",
  "pwa.replaceShots": "Replace screenshots",
  "pwa.publish": "Publish to the store",
  "pwa.published": "App sent to the store",
  "pwa.download": "Download APK",
  "pwa.restart": "New conversion",
  "pwa.detected": "Auto-detected",
};

/* ---------------- Langues ivoiriennes (vocabulaire grand public) ---------------- */

const bci: Dict = {
  ...fr,
  "nav.home": "Awlo",
  "nav.categories": "Akpasua mun",
  "home.title1": "Wun ɔ aplikasyɔ",
  "home.title2": "uflɛ mun.",
  "home.subtitle": "Like kwlaa ɔ lika kunngba nun. Kunndɛ, wun, fa i.",
  "home.search": "Kunndɛ aplikasyɔ…",
  "home.cta": "Nian aplikasyɔ mun",
  "home.trending": "Be kunndɛ kpa",
  "home.popular": "Be klo i kpa",
  "home.new": "Uflɛ mun",
  "home.categories": "Nian akpasua nun",
  "home.all": "Kwlaa",
  "home.free": "Kpɔlɛ nun-man",
  "home.paid": "Be tua",
  "app.install": "FA I",
  "app.description": "Ndɛ",
  "app.reviews": "Ndɛ nga be kan",
  "reviews.write": "Kan ɔ liɛ",
  "reviews.submit": "Fa blɛ",
  "footer.tagline": "Aplikasyɔ nga a kwla fa be ndɛndɛ.",
};

const dyu: Dict = {
  ...fr,
  "nav.home": "So",
  "nav.categories": "Sugandiliw",
  "home.title1": "I ka aplikasiɔn",
  "home.title2": "kuraw ye.",
  "home.subtitle": "Fɛn bɛɛ yɔrɔ kelen. Ɲini, a ye, a bila.",
  "home.search": "Aplikasiɔn ɲini…",
  "home.cta": "Aplikasiɔnw lajɛ",
  "home.trending": "Bi ka fɛnw",
  "home.popular": "Minnu ka di kosɛbɛ",
  "home.new": "Kuraw",
  "home.categories": "Sugandiliw lajɛ",
  "home.all": "Bɛɛ",
  "home.free": "Fu",
  "home.paid": "Sɔngɔ b'a la",
  "app.install": "A BILA",
  "app.description": "Kunnafoni",
  "app.reviews": "Hakilinaw ni kumaw",
  "reviews.write": "N ka hakilina di",
  "reviews.submit": "A ci",
  "footer.tagline": "Aplikasiɔnw ka nɔgɔn ka sɔrɔ ani k'u bila.",
};

const goa: Dict = {
  ...fr,
  "nav.home": "Bhlo",
  "nav.categories": "Kpa nu",
  "home.title1": "Zɛ i aplikasion",
  "home.title2": "flɛ nu.",
  "home.subtitle": "Fɛɛ lɛ bhale kʋ wɔ. Wlɛ, zɛ, bhé lɛ.",
  "home.search": "Wlɛ aplikasion…",
  "home.cta": "Zɛ aplikasion nu",
  "home.trending": "Zaan nu",
  "home.popular": "Nu bhɛ é kpa",
  "home.new": "Flɛ nu",
  "home.categories": "Zɛ kpa nu",
  "home.all": "Fɛɛ",
  "home.free": "Sɔ tɩ",
  "home.paid": "Sɔ wɔ",
  "app.install": "BHÉ LƐ",
  "app.description": "Wɛlɩ",
  "app.reviews": "Wɛlɩ nu",
  "reviews.write": "Kan n wɛlɩ",
  "reviews.submit": "Bhla",
  "footer.tagline": "Aplikasion nu bhé lɛ é ka nyrɛ.",
};

const bet: Dict = {
  ...fr,
  "nav.home": "Gbo",
  "nav.categories": "Kpa wa",
  "home.title1": "Zɩ a aplikasɔ",
  "home.title2": "flɛ wa.",
  "home.subtitle": "Kpɛkpɛ lagɔ kʋ zʋ. Kunda, zɩ, kpa lɔ.",
  "home.search": "Kunda aplikasɔ…",
  "home.cta": "Zɩ aplikasɔ wa",
  "home.trending": "Nɩɩ wa",
  "home.popular": "Wa bhɛ nyɩkpa klɔ",
  "home.new": "Flɛ wa",
  "home.categories": "Zɩ kpa wa",
  "home.all": "Kpɛkpɛ",
  "home.free": "Zɔ tɩ",
  "home.paid": "Zɔ mɔ",
  "app.install": "KPA LƆ",
  "app.description": "Nɩɩnɩ",
  "app.reviews": "Nɩɩnɩ wa",
  "reviews.write": "Kan n nɩɩnɩ",
  "reviews.submit": "Kpa zʋ",
  "footer.tagline": "Aplikasɔ wa a kpa lɔ nɩɩ zɔ.",
};

/* ---------------- Compléments (public + développeurs) ---------------- */

const EXTRA_FR: Dict = {
  "brand.store": "E'nvlé Store",
  "nav.discover": "Découvrir",
  "nav.menu": "Menu",

  "home.hello": "Bonjour 👋",
  "home.lead": "Découvrez et installez des applications faites pour vous.",
  "home.forYou": "Pour vous",
  "home.freeApps": "Gratuites à installer",
  "home.seeCategory": "Voir la catégorie",
  "home.openApp": "Voir la fiche",
  "home.filters": "Filtrer",

  "cat.explore": "Explorer",
  "cat.empty": "Aucune application dans cette catégorie pour le moment.",

  "app.similar": "Applications similaires",
  "app.info": "Informations",
  "app.free": "Gratuite",
  "app.report": "Signaler cette application",
  "app.versions": "Versions",

  "reviews.filterStars": "note",
  "reviews.showing": "avis affichés",

  "dev.footer": "Espace réservé aux développeurs E'nvlé.",
  "dev.nav.publish": "Publier",
  "dev.nav.apps": "Mes applications",
  "dev.stat.downloads": "Téléchargements 24 h",
  "dev.stat.active": "Utilisateurs actifs",
  "dev.stat.balance": "Solde disponible",
  "dev.stat.crash": "Taux de crash moyen",
  "dev.apps.rollback": "Revenir à la version précédente",
  "dev.analytics.title": "Téléchargements — 7 derniers jours",
  "dev.analytics.crashes": "Derniers incidents",
  "dev.payouts.title": "Retrait mobile money",
  "dev.payouts.tx": "Transactions récentes",
  "dev.upload.title": "Envoyer un APK",
  "dev.upload.drop": "Déposez votre APK ici",
  "dev.upload.hint": "500 Mo maximum · signature et metadata extraites automatiquement",
  "dev.upload.choose": "Choisir un fichier",
  "dev.upload.listing": "Fiche de l'application",
  "dev.upload.publish": "Publier maintenant",
  "dev.upload.again": "Envoyer un autre APK",
};

const EXTRA_EN: Dict = {
  "brand.store": "E'nvlé Store",
  "nav.discover": "Discover",
  "nav.menu": "Menu",

  "home.hello": "Hello 👋",
  "home.lead": "Discover and install apps made for you.",
  "home.forYou": "For you",
  "home.freeApps": "Free to install",
  "home.seeCategory": "See category",
  "home.openApp": "View app",
  "home.filters": "Filter",

  "cat.explore": "Explore",
  "cat.empty": "No app in this category yet.",

  "app.similar": "Similar apps",
  "app.info": "Information",
  "app.free": "Free",
  "app.report": "Report this app",
  "app.versions": "Versions",

  "reviews.filterStars": "stars",
  "reviews.showing": "reviews shown",

  "dev.footer": "Reserved for E'nvlé developers.",
  "dev.nav.publish": "Publish",
  "dev.nav.apps": "My apps",
  "dev.stat.downloads": "Downloads 24h",
  "dev.stat.active": "Active users",
  "dev.stat.balance": "Available balance",
  "dev.stat.crash": "Average crash rate",
  "dev.apps.rollback": "Roll back to previous version",
  "dev.analytics.title": "Downloads — last 7 days",
  "dev.analytics.crashes": "Latest incidents",
  "dev.payouts.title": "Mobile money payout",
  "dev.payouts.tx": "Recent transactions",
  "dev.upload.title": "Upload an APK",
  "dev.upload.drop": "Drop your APK here",
  "dev.upload.hint": "500 MB max · signature and metadata extracted automatically",
  "dev.upload.choose": "Choose a file",
  "dev.upload.listing": "App listing",
  "dev.upload.publish": "Publish now",
  "dev.upload.again": "Upload another APK",
};

const FR: Dict = { ...fr, ...EXTRA_FR };
const EN: Dict = { ...en, ...EXTRA_EN };

const DICTS: Record<Lang, Dict> = {
  fr: FR,
  en: EN,
  bci: { ...FR, ...bci },
  dyu: { ...FR, ...dyu },
  goa: { ...FR, ...goa },
  bet: { ...FR, ...bet },
};

const STORAGE_KEY = "envle.lang";

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const I18nContext = createContext<I18nValue>({
  lang: "fr",
  setLang: () => {},
  t: (k) => FR[k] ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && DICTS[saved]) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => DICTS[lang][key] ?? FR[key] ?? key,
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
