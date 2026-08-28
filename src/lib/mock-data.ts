import type { AppItem, AppVersion, Review, ScanStatus } from "@/lib/catalog-types";

export type { AppItem, AppVersion, Review, ScanStatus };
export { formatFcfa, formatCount } from "@/lib/catalog-types";

export type AppCategory =
  | "Jeux"
  | "Productivité"
  | "Éducation"
  | "Finance"
  | "Social"
  | "Transport";

const perms = {
  net: "Accès Internet",
  storage: "Stockage du téléphone",
  camera: "Appareil photo",
  contacts: "Contacts",
  location: "Position GPS",
  sms: "Lecture des SMS",
  audio: "Microphone",
};

const MOCK_APPS: Omit<AppItem, "storeAppId">[] = [
  {
    id: "djassa-market",
    name: "Djassa Market",
    developer: "Kouassi Digital",
    category: "Social",
    tagline: "Le marché de quartier dans ta poche",
    description:
      "Achetez et vendez entre voisins à Abidjan. Publiez une annonce en 20 secondes, discutez par WhatsApp et payez en mobile money. Fonctionne même en 2G.",
    priceFcfa: 0,
    rating: 4.6,
    reviewsCount: 1284,
    downloads: 48210,
    downloads24h: 1420,
    sizeMb: 18.4,
    version: "3.2.0",
    updatedAt: "2026-08-21",
    scan: "verified",
    permissions: [perms.net, perms.storage, perms.camera, perms.location],
    versions: [
      { version: "3.2.0", date: "2026-08-21", notes: "Recherche par quartier + mode hors-ligne", crashRate: 0.4 },
      { version: "3.1.0", date: "2026-07-30", notes: "Discussions plus rapides, correctifs photos", crashRate: 1.2 },
      { version: "3.0.0", date: "2026-06-12", notes: "Nouvelle interface, paiement Wave", crashRate: 2.1 },
    ],
    reviews: [
      { author: "Aminata T.", rating: 5, date: "2026-08-22", text: "Installé en 30 secondes, j'ai vendu mon frigo le jour même." },
      { author: "Yao B.", rating: 4, date: "2026-08-18", text: "Très fluide, il manque juste les notifications de prix." },
    ],
    accent: "djassa",
    initials: "DM",
  },
  {
    id: "tontine-pro",
    name: "Tontine Pro",
    developer: "Fintech Yopougon",
    category: "Finance",
    tagline: "Gérez votre tontine sans cahier",
    description:
      "Suivi des cotisations, rappels automatiques par SMS, historique des tours et reçus PDF. Pensé pour les groupes de 5 à 200 membres.",
    priceFcfa: 1500,
    rating: 4.8,
    reviewsCount: 642,
    downloads: 21980,
    downloads24h: 780,
    sizeMb: 12.1,
    version: "2.4.1",
    updatedAt: "2026-08-24",
    scan: "verified",
    permissions: [perms.net, perms.storage, perms.sms, perms.contacts],
    versions: [
      { version: "2.4.1", date: "2026-08-24", notes: "Reçus PDF + export Excel", crashRate: 0.2 },
      { version: "2.3.0", date: "2026-08-02", notes: "Rappels SMS programmables", crashRate: 0.9 },
    ],
    reviews: [
      { author: "Mariam K.", rating: 5, date: "2026-08-25", text: "Fini les disputes de cahier. Tout le monde voit le même compte." },
      { author: "Serge A.", rating: 5, date: "2026-08-20", text: "Vaut largement ses 1500 F." },
    ],
    accent: "tontine",
    initials: "TP",
  },
  {
    id: "gbaka-go",
    name: "Gbaka Go",
    developer: "MoveCI",
    category: "Transport",
    tagline: "Horaires et lignes de gbaka en temps réel",
    description:
      "Trouvez la bonne ligne, le tarif du jour et le temps d'attente à chaque gare. Données mises à jour par la communauté.",
    priceFcfa: 0,
    rating: 4.3,
    reviewsCount: 903,
    downloads: 63420,
    downloads24h: 2310,
    sizeMb: 24.7,
    version: "1.9.3",
    updatedAt: "2026-08-19",
    scan: "verified",
    permissions: [perms.net, perms.location, perms.storage],
    versions: [
      { version: "1.9.3", date: "2026-08-19", notes: "Nouvelles lignes Bingerville", crashRate: 1.8 },
      { version: "1.9.0", date: "2026-07-14", notes: "Carte hors-ligne", crashRate: 3.4 },
    ],
    reviews: [
      { author: "Christelle N.", rating: 4, date: "2026-08-19", text: "Les tarifs sont à jour, c'est déjà énorme." },
    ],
    accent: "gbaka",
    initials: "GG",
  },
  {
    id: "ecole-facile",
    name: "École Facile",
    developer: "EduAfrik",
    category: "Éducation",
    tagline: "Révisions CEPE et BEPC hors-ligne",
    description:
      "Cours, exercices corrigés et annales téléchargeables. Mode hors-ligne complet pour réviser sans forfait data.",
    priceFcfa: 2500,
    rating: 4.9,
    reviewsCount: 2140,
    downloads: 88710,
    downloads24h: 3140,
    sizeMb: 96.3,
    version: "5.0.2",
    updatedAt: "2026-08-25",
    scan: "verified",
    permissions: [perms.net, perms.storage],
    versions: [
      { version: "5.0.2", date: "2026-08-25", notes: "Annales 2026 ajoutées", crashRate: 0.1 },
      { version: "5.0.0", date: "2026-08-05", notes: "Nouveau moteur de quiz", crashRate: 0.7 },
    ],
    reviews: [
      { author: "Prof. Diallo", rating: 5, date: "2026-08-25", text: "J'ai équipé toute ma classe. Les annales sont fiables." },
      { author: "Fatou S.", rating: 5, date: "2026-08-23", text: "Je révise dans le gbaka sans connexion." },
    ],
    accent: "ecole",
    initials: "EF",
  },
  {
    id: "awale-legend",
    name: "Awalé Legend",
    developer: "Studio Bouaké",
    category: "Jeux",
    tagline: "L'awalé en ligne, 100% africain",
    description:
      "Affrontez des joueurs de toute l'Afrique de l'Ouest, montez dans le classement et débloquez des plateaux traditionnels.",
    priceFcfa: 0,
    rating: 4.5,
    reviewsCount: 3510,
    downloads: 152300,
    downloads24h: 5120,
    sizeMb: 42.8,
    version: "4.1.0",
    updatedAt: "2026-08-16",
    scan: "verified",
    permissions: [perms.net, perms.storage, perms.audio],
    versions: [
      { version: "4.1.0", date: "2026-08-16", notes: "Mode tournoi hebdomadaire", crashRate: 1.1 },
      { version: "4.0.0", date: "2026-06-28", notes: "Multijoueur temps réel", crashRate: 4.6 },
    ],
    reviews: [
      { author: "Ibrahim C.", rating: 5, date: "2026-08-17", text: "Le mode tournoi est addictif." },
      { author: "Nadia O.", rating: 4, date: "2026-08-11", text: "Un peu lourd en data mais très bon jeu." },
    ],
    accent: "awale",
    initials: "AL",
  },
  {
    id: "facture-kit",
    name: "Facture Kit",
    developer: "Kouassi Digital",
    category: "Productivité",
    tagline: "Devis et factures en 3 taps",
    description:
      "Créez des factures conformes, envoyez-les par WhatsApp et suivez les paiements mobile money. Sans abonnement.",
    priceFcfa: 3000,
    rating: 4.4,
    reviewsCount: 418,
    downloads: 12640,
    downloads24h: 340,
    sizeMb: 15.9,
    version: "2.0.1",
    updatedAt: "2026-08-12",
    scan: "pending",
    permissions: [perms.net, perms.storage, perms.contacts],
    versions: [
      { version: "2.0.1", date: "2026-08-12", notes: "Modèles de facture personnalisables", crashRate: 2.4 },
    ],
    reviews: [
      { author: "Bakary D.", rating: 4, date: "2026-08-14", text: "Simple et efficace pour mon atelier." },
    ],
    accent: "facture",
    initials: "FK",
  },
];

export const CATEGORIES: AppCategory[] = [
  "Jeux",
  "Productivité",
  "Éducation",
  "Finance",
  "Social",
  "Transport",
];

export const APPS: AppItem[] = MOCK_APPS.map((a) => ({ ...a, storeAppId: a.id }));

export function getApp(id: string) {
  return APPS.find((a) => a.id === id);
}

/* ---- Developer dashboard mock data ---- */

export const DEV_PROFILE = {
  name: "Kouassi Digital",
  whatsapp: "+225 07 00 12 34 56",
  apiToken: "envle_sk_live_7f3c…9a21",
  balanceFcfa: 184500,
  payoutThreshold: 10000,
};

export const DEV_APPS = [APPS[0]!, APPS[5]!];

export const DOWNLOADS_7D = [
  { day: "Jeu", value: 820 },
  { day: "Ven", value: 1140 },
  { day: "Sam", value: 1620 },
  { day: "Dim", value: 1480 },
  { day: "Lun", value: 1210 },
  { day: "Mar", value: 1390 },
  { day: "Mer", value: 1760 },
];

export const DEV_TRANSACTIONS = [
  { id: "TX-90412", app: "Facture Kit", amount: 3000, net: 2400, method: "MTN MoMo", date: "26 août 14:02", status: "Payé" },
  { id: "TX-90408", app: "Facture Kit", amount: 3000, net: 2400, method: "Orange Money", date: "26 août 11:47", status: "Payé" },
  { id: "TX-90391", app: "Facture Kit", amount: 3000, net: 2400, method: "Wave", date: "25 août 19:20", status: "Payé" },
  { id: "TX-90377", app: "Facture Kit", amount: 3000, net: 2400, method: "MTN MoMo", date: "25 août 09:11", status: "En attente" },
];
