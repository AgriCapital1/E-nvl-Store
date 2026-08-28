# E'nvlé Store

📋 CAHIER DES CHARGES — E'nvlé Store
1. VISION PRODUIT

Slogan interne : "30 minutes pour héberger. L'installer, c'est l'avoir."

Promesse utilisateur :

Développeur africain → Upload APK en 30 min → App disponible immédiatement
Utilisateur final → 1 clic → Auto-download, auto-install, auto-launch
Zéro friction : pas de carte bancaire, pas de Gmail obligatoire, pas d'attente PlayStore
2. ARCHITECTURE GLOBALE
┌─────────────────────────────────────────────────────────────┐
│                   E'nvlé Store                              │
├──────────────────┬──────────────────┬──────────────────┐────┤
│  DEVELOPER ZONE  │   APP CATALOG    │  INSTALLER SVC   │ BD │
│  (Dashboard)     │   (User Store)   │  (Background DL) │    │
└──────────────────┴──────────────────┴──────────────────┘────┘
        │                  │                   │
    Lovable +          React + Supabase    Node.js +
    Supabase              +CDN              Bull Queue
        │                  │                   │
    Upload APK ────→ Scan ────────→ Distribute ────→ Install
3. MODULES DÉTAILLÉS
MODULE 1 : DEVELOPER DASHBOARD (Lovable)

URL : apphub.envle.ci/dev

Fonctionnalités clés :

yaml
Inscription:
  - Email OU numéro WhatsApp
  - Génération token API automatique
  - KYC ultra-léger (juste confirmation)

Upload APK:
  - Drag-n-drop zone
  - Validation instantanée :
    * Taille max 500 MB
    * Vérif signature APK (jamais signé deux fois)
    * Extraction metadata (nom, version, icône, permissions)
    * Scan malware (VirusTotal API gratuit)
    * Détection clones d'apps existantes

Gestion des versions:
  - Versioning automatique (v1, v2, etc.)
  - Notes de version en français
  - Changelog auto-généré (diff binaire)
  - Rollback en 1 clic si crash > 50% users

Dashboard analytics:
  - Téléchargements / jour
  - Crash reports en temps réel
  - Revenue tracking (paiements mobile money)
  - Utilisateurs actifs par jour/semaine

Withdrawal:
  - Seuil min : 10,000 FCFA
  - Sélection mobile money (MTN, Orange, Moov)
  - Numéro de compte
  - Frais : 1.5% + 500 FCFA

Settings:
  - Description app (multilingue: FR, EN, Baoulé)
  - Screenshots (4-5 max)
  - Catégorie (Jeux, Productivité, Éducation, etc.)
  - Contact dev (email, WhatsApp, site)

Tech Stack :

React + Vite (Lovable)
Supabase Auth (email/SMS)
TailwindCSS + shadcn/ui
MODULE 2 : APP CATALOG (React + Supabase CDN)

URL : apphub.envle.ci/store

Pages :

yaml
Explore:
  - Grille d'apps (6 colonnes desktop, 3 mobile)
  - Filtres: Catégorie, Gratuit/Payant, Rating
  - Recherche full-text (titre, dev, tags)
  - "Trending Today" algorithme simple (téléchargements 24h)

App Detail Page:
  - Banner image (1200x630)
  - 5 screenshots carousels
  - Rating étoiles (agrégé)
  - Bouton → "INSTALLER MAINTENANT" (pas "Télécharger")
  - Permissions listées (lisibles)
  - Reviews (nom dev, texte, rating, date)
  - Info dev (nom, apps publiées, rating moyen)
  - Version actuelle, changelog

Account (Utilisateur):
  - Mes apps installées
  - Mes reviews
  - Historique téléchargements
  - Paramètres de notif

Admin Panel (Caché, accès manuel):
  - Flag apps suspeçonneuses
  - Bloquer devs malveillants
  - Analytics macro (total installs, revenue, users actifs)

Performance :

Supabase CDN pour APK dist (ou Bunny CDN pour scale)
Cache: app listings 5 min, detail pages 1 min
APK metadata stocké en JSON sur Supabase
Images optimisées (WebP, lazy-load)
MODULE 3 : SERVICE D'INSTALLATION AUTOMATIQUE (Node.js)

Le cœur technique.

Workflow :

1. Utilisateur clique "INSTALLER MAINTENANT"
   ↓
2. Navigateur → Fetch APK via API
   • POST /api/install-session → génère session_id
   • GET /api/apps/{app_id}/download?session_id=XXX
   ↓
3. Download progressif (avec UI):
   • Affiche barre de progression (0-100%)
   • Calcule ETA
   • Permet cancel
   ↓
4. Trigger Installation:
   • Détecte version Android utilisateur
   • Génère intent Android appropriate :
     - Android 8-11: adb install (local)
     - Android 12+: Play Protect bypass + PackageInstaller
     - Fallback: APK classique à installer manuellement
   ↓
5. Install Confirmation:
   • Popup "Installation en cours..."
   • Spinner + "Ne fermez pas cette page"
   • Sur success: "Ouvrir l'app" OU "Afficher accueil"
   ↓
6. Icon Shortcut:
   • Génère automatiquement shortcut sur écran d'accueil
   • Icône = icône app (extraite APK)
   • Tooltip: "E'nvlé Store"

Techniquement (CRITIQUE) :

javascript
// Node.js + Express backend

// 1. APK Download tracking
POST /api/install-session
→ Crée doc Supabase:
  {
    session_id: uuid,
    user_id: "anon" | userId,
    app_id,
    timestamp,
    status: "initiated",
    device_info: { os, version, brand }
  }

// 2. Servir APK avec streaming + métadonnées
GET /api/apps/{app_id}/download?session_id=XXX
→ Supabase RLS vérifie session
→ Streame APK depuis Bunny/S3
→ Headers custom:
    X-Total-Size: 12500000
    X-MD5: abc123...
→ Événement: increment download_count

// 3. Détection Android + Intents
POST /api/install/finalize
Body: {
  session_id,
  device_info: {
    android_version: 14,
    has_adb: false,
    brand: "Samsung"
  }
}
→ Retourne:
  {
    install_method: "app-link" | "manual",
    intent_uri: "intent://...",
    fallback_url: "https://..."
  }

// 4. Antivirus interne
POST /api/apps/scan (en arrière-plan)
→ APK décodé (avec node-apk-parser)
→ Extracte fichiers douteux (.so natifs, assets obfusqués)
→ Appel VirusTotal API (gratuit, 4 req/min)
→ Marque app "Verified", "Pending Review", ou "Blocked"

// 5. Versioning + Rollback
GET /api/apps/{app_id}/latest
→ Si crash_rate > 50% sur version N:
  • Retour automatique à version N-1
  • Notifie dev "Rollback automatique"

// 6. Revenue tracking
POST /api/payments/webhook
← MTN Mobile Money callback
→ Crée transaction Supabase
→ Update dev balance

Installation Auto (PWA + Capacitor) :

html
<!-- Dans le player web de l'app detail -->
<script>
  // Au clic "INSTALLER MAINTENANT":
  
  async function installApp(appId) {
    // 1. Créer session
    const session = await fetch('/api/install-session', {
      method: 'POST',
      body: JSON.stringify({ app_id: appId })
    }).then(r => r.json());

    // 2. Télécharger APK
    const response = await fetch(
      `/api/apps/${appId}/download?session_id=${session.id}`
    );
    
    const blob = await response.blob();
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];
    
    // Afficher progression
    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;
      updateProgressBar(receivedLength, response.headers.get('X-Total-Size'));
    }
    
    // 3. Trigger installation
    const deviceInfo = await detectAndroidVersion();
    const installResponse = await fetch('/api/install/finalize', {
      method: 'POST',
      body: JSON.stringify({
        session_id: session.id,
        device_info: deviceInfo
      })
    }).then(r => r.json());
    
    // 4. Rediriger vers intent (Android) ou fallback
    if (installResponse.install_method === 'app-link') {
      window.location.href = installResponse.intent_uri;
    } else {
      // Manuel: laisser navigateur gérer téléchargement
      downloadAPKManually(blob);
    }
    
    // 5. Créer shortcut écran d'accueil (PWA manifest)
    if ('BeforeInstallPromptEvent' in window) {
      createHomeScreenShortcut(appId);
    }
  }
</script>
MODULE 4 : PAIEMENTS MOBILE MONEY

Intégration MTN Mobile Money :

yaml
Flux utilisateur (Payant app):
  1. Utilisateur clique "INSTALLER (1,000 FCFA)"
  2. Popup: "Confirmer avec MTN?"
  3. Redirect: https://mtn.api.ci/payment/init
     Params: amount=1000, callback=https://apphub.envle.ci/payment/confirm
  4. Utilisateur valide sur son téléphone (prompt MTN)
  5. MTN POST → webhook apphub.envle.ci/payment/confirm
  6. Vérif signature, créer transaction BD
  7. Déclencher download immédiatement
  8. Dev reçoit 80% (si commission 20%)

Données stockées (Supabase):
  transactions:
    - id, app_id, user_id, amount, currency, status
    - mtn_reference, timestamp, receipt_url
    
  app_pricing:
    - app_id, base_price_fcfa, discount_percentage
    - auto_disable_after_days (optionnel)

Alternatives (Y2) :

Orange Money (CI, Senegal, Mali)
Wave (Senegal, Mali)
Moov Africa (CI, Benin)
4. SÉCURITÉ & ANTI-MALWARE

Antivirus interne (Custom) :

python
# Python backend (async)

async def scan_apk(apk_file_path: str) -> ScanResult:
    """Scan APK pour malware, permissions dangereuses"""
    
    # 1. Décoder APK
    apk = APK(apk_file_path)
    
    # 2. Extraire permissions
    dangerous_perms = [
        "android.permission.READ_CONTACTS",
        "android.permission.READ_SMS",
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO"
    ]
    
    perms_found = [
        p for p in apk.get_permissions() 
        if p in dangerous_perms
    ]
    
    risk_score = len(perms_found) * 10  # 0-100
    
    # 3. VirusTotal check (gratuit)
    vt_report = await virustotal_scan(apk_file_path)
    if vt_report['detected'] > 3:  # >3 détections
        risk_score += 50
        return ScanResult(status="BLOCKED", reason="Malware detected")
    
    # 4. Détect native code obfusqué
    native_libs = apk.get_dex_files()
    if obfuscated_check(native_libs):
        risk_score += 30
    
    # 5. Verdict
    if risk_score > 70:
        return ScanResult(status="BLOCKED")
    elif risk_score > 40:
        return ScanResult(status="PENDING_REVIEW")
    else:
        return ScanResult(status="VERIFIED", risk_level=risk_score)

Device Fingerprinting :

javascript
// Verifier utilisateur ne triche pas downloads gratuits
// En cas de fraude (500 installs en 2h from same IP):
// → Flag dev, review manuel, potential block

POST /api/analytics/install-event
Body: {
  session_id,
  device_fingerprint: {
    user_agent,
    ip_address,
    device_id (Android ID),
    timestamp
  }
}
→ Supabase détecte patterns anormaux → Alert admin
5. DÉTAILS TECHNIQUES : AUTO-INSTALL ANDROID

Le problème : APK direct = utilisateur doit cliquer "Installer" manuel.
La solution : PackageInstaller API + Deep Links.

android
// Android Manifest (app test d'installation)
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

<activity android:name=".InstallReceiver">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <data
      android:scheme="https"
      android:host="apphub.envle.ci"
      android:pathPrefix="/install/" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
  </intent-filter>
</activity>

// Java
public class InstallReceiver extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    Uri apkUri = Uri.parse(getIntent().getData());
    
    // Android 12+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
      intent.setData(apkUri);
      intent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
      startActivity(intent);
    } else {
      // Fallback Android 8-11
      installViaADB(apkUri);
    }
  }
}

Mieux encore : Utiliser Nearby Share API ou Google Play Instant pattern.

6. ROADMAP DÉVELOPPEMENT (Lovable + Supabase)
Sprint 1 : MVP Core (2 semaines)
Week 1:
  ☐ Lovable: Dev Dashboard skeleton
  ☐ Supabase: Schemas (users, apps, transactions)
  ☐ React: Catalog page statique
  ☐ API Node: Upload endpoint basic

Week 2:
  ☐ APK upload + metadata extraction
  ☐ VirusTotal API integration
  ☐ Download counter
  ☐ Mobile Money webhook (test MTN sandbox)
Sprint 2 : App Install + UI Polish (2 semaines)
Week 1:
  ☐ Download progress bar
  ☐ Auto-install intent génération
  ☐ Home screen shortcut creation
  ☐ Analytics tracking
  
Week 2:
  ☐ Rollback system
  ☐ Crash detection
  ☐ Dev withdrawal panel
  ☐ E2E testing
Sprint 3 : Production Hardening (1 semaine)
  ☐ Rate limiting
  ☐ CDN setup (Bunny)
  ☐ Sentry (error tracking)
  ☐ Performance audit
  ☐ Security audit (OWASP top 10)
7. STACK TECHNIQUE PRÉCIS
yaml
Frontend (User Catalog):
  - React 18 + TypeScript + Vite
  - TailwindCSS + shadcn/ui (ou Chakra)
  - Zustand (state management)
  - TanStack Query (data fetching)
  - Framer Motion (smooth transitions)
  - react-hook-form + Zod (validation)

Frontend (Developer Dashboard):
  - Lovable IDE (React gen automatique)
  - Supabase auth (email, SMS)
  - Chart.js / Recharts (analytics graphs)
  - React Dropzone (APK upload)

Backend:
  - Node.js 20 + Express
  - Supabase (PostgreSQL + RLS)
  - Bull (job queue for scans)
  - node-apk-parser (APK metadata)
  - axios (VirusTotal, MTN APIs)
  - Sentry (error tracking)

DevOps:
  - Docker + Docker Compose (local dev)
  - GitHub Actions (CI/CD)
  - Fly.io ou Railway (hosting 10-30$/mo)
  - Bunny CDN (APK distribution, ~0.01$/GB)

Monitoring:
  - Supabase analytics
  - Sentry (errors)
  - Custom Slack webhook (alerts)
8. MODÈLE ÉCONOMIQUE (Year 1)
Revenue:
  Commission 20% app payantes
  Example: dev vend app 5,000 FCFA
           → E'nvlé gagne 1,000 FCFA
           → dev gagne 4,000 FCFA

Costs:
  Infrastructure: 30$/mo (Fly + Postgres)
  CDN (Bunny): ~50-200$/mo (scale-dependent)
  VirusTotal API: gratuit (4 req/min)
  Monitoring: ~30$/mo
  ─────────────────────────────
  Total: ~150$/mo fixed, + CDN variable

Profitability:
  If 100 paid apps à 2,000 FCFA/mois:
    Revenue: 100 × 2,000 × 0.20 = 40,000 FCFA/mois
    Cost: 150 × 655 CFA ≈ 98,250 FCFA/mois
    → Breakeven: ~250 apps payantes
9. PARTENARIATS STRATÉGIQUES (Y2-Y3)
yaml
Phase 1 (Mois 1-6):
  - Orange CI (distribution, co-marketing)
  - MTN CI (mobile money, SMS alerts)
  - GHub Abidjan (developer outreach)
  
Phase 2 (Mois 7-12):
  - HuaWei AppGallery (alt distribution)
  - Samsung Galaxy Store (pre-install deals)
  - Microsoft AppStore (Android bridge)
  
Phase 3 (Year 2):
  - Faire partie du playstore comme alternative distribuée
  - Govern AI data (usage analytics → drive PL)
10. FICHIERS À PRÉPARER
📦 E'nvlé Store Repo (GitHub)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Catalog.tsx
│   │   │   ├── AppDetail.tsx
│   │   │   ├── Account.tsx
│   │   │   └── Download.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/ (Zustand)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.ts
│   │   │   ├── download.ts
│   │   │   ├── payments.ts
│   │   │   └── analytics.ts
│   │   ├── services/
│   │   │   ├── apk-scanner.ts
│   │   │   ├── mtn-payment.ts
│   │   │   └── virustotal.ts
│   │   ├── middleware/
│   │   └── app.ts
│   ├── package.json
│   └── .env.example
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_rls_policies.sql
│   │   └── 003_add_indexes.sql
│   └── seed.sql
│
├── docker-compose.yml (local dev)
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
│
└── README.md (français)

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e40cbe8b-304e-47f1-83ab-d62257b1f2a5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
