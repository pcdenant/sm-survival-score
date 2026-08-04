# Architecture

## Vue d'ensemble

SM Survival Score est une **Single Page Application** React servie par Vite, déployée sur Vercel. Un seul serverless function gère l'inscription email. Pas de base de données.

```
Browser
  │
  ├── /              → Vite SPA (dist/)
  │     └── React app (3 écrans)
  │
  └── /api/subscribe → Vercel Function
                         └── Ghost Admin API (JWT HS256)
```

---

## Flux utilisateur

```
LandingScreen
    │ clic "Voir mes angles morts" → génère sessionId UUID
    ▼
QuestionScreen (20 questions, navigation avant/arrière)
    │ après Q4, Q8, Q12, Q16 (fin de dimension)
    ├── ChapterRevealScreen (2s auto-avance ou clic)
    │       └──→ QuestionScreen (dimension suivante)
    │
    │ réponse à la dernière question (Q20)
    ▼
ResultScreen
    ├── Score global + catégorie
    ├── Barres par dimension, classées par risque, priorité marquée
    ├── Bloc méthodologie repliable (seuils, paliers, poids)
    ├── PrioritySignal (texte de signal — dimension la plus critique selon l'algorithme pondéré)
    ├── DiagnosticCard #1 (dimension prioritaire — poids de survie, pas score brut) — toujours visible
    └── DiagnosticCards #2–5 — verrouillées jusqu'à email, ordonnées par criticité
          │ email soumis → GhostSignupForm
          │ POST /api/subscribe → Ghost Admin API
          ├── 201 / 409 (succès)
          │   ├── UnlockModal apparaît
          │   │   ├── Affiche l'email soumis
          │   │   ├── Avertit de vérifier spams
          │   │   ├── Bouton "Télécharger mon rapport (PDF)"
          │   │   │   └── generatePDF(pdfProps) : render off-screen → html2canvas → jsPDF → téléchargement
          │   │   └── Bouton "Voir mes résultats" → ferme modal
          │   │
          │   └── Unlock → 4 cards + modal visibles
          │
          └── 4xx / 5xx (erreur)
              └── Message d'erreur affiché, modal masqué
```

---

## Composants

### `SMSurvivalScore` (racine)
- Gère l'état global : `screen`, `currentQ`, `answers`, `sessionId` (UUID par session, persisté), `chapterReveal` (éphémère — index de la dimension qui vient de se terminer)
- Unique source de vérité pour la navigation
- **localStorage** : restaure l'état du quiz à chaque reload via lazy init des `useState` ; persiste automatiquement via `useEffect` (y compris `sessionId`) ; nettoie si retour au landing vierge
- **Abandon tracking** : écoute `visibilitychange` + `pagehide` pour émettre `quiz_abandoned` ; dédup via `abandonSentRef` + reset bfcache
- **Reload detection** : émet `quiz_resumed` si `performance.getEntriesByType("navigation")[0].type === "reload"` et qu'un quiz était en cours

### `LandingScreen`
- Ecran de présentation statique
- Émet `quiz_started` à l'analytics

### `QuestionScreen`
- Reçoit la question courante par props, sélection locale remontée via callback
- `ProgressBar` : 20 segments visuels groupés par dimension
- **Raccourcis clavier** : `A`/`B`/`C` sélectionnent directement la réponse correspondante
- **Navigation flèches** : `ArrowDown`/`ArrowRight` → réponse suivante ; `ArrowUp`/`ArrowLeft` → réponse précédente, avec focus management via `answerRefs`
- **Auto-advance** : avance automatiquement 600ms après une sélection active de l'utilisateur (pas sur navigation arrière, détecté via `userJustSelectedRef`)
- **Badges lettres** : chaque option affiche son raccourci sous forme de badge `<kbd>`

### `ChapterRevealScreen`
- Écran interstitiel plein-écran (fond `T.vert`) affiché après chaque dimension complétée (Q4, Q8, Q12, Q16)
- Affiche la dimension complétée (✓) et annonce la prochaine dimension en jaune
- Auto-avance après 2000ms ou au clic ; `data-testid="chapter-reveal"` pour les tests E2E

### `ResultScreen`
- Calcule les scores via `useMemo` (pas de re-calcul inutile)
- États : `unlocked`, `showModal`, `subscribedEmail`, `isGeneratingCard`, `cardError`, `isGeneratingPdf`, `pdfError`, `focusedLockedDim` — plus `unlockedNoticeRef`, cible de restauration du focus à la fermeture du modal (le formulaire, lui, est démonté à ce moment-là)
- **Sélection prioritaire** : `priorityDimId` via `getPriorityDimension()` — algorithme pondéré, pas score brut. `orderedDimResults` via `getOrderedDimensions()` donne **le seul classement du produit** : barres, cartes et PDF le suivent tous, et la dimension prioritaire y est marquée
- **Bloc méthodologie** (`<details>`) : base de 40 points, seuils 45/75, paliers par dimension, poids de survie. Valeurs interpolées depuis les constantes
- `PrioritySignal` : signal contextuel entre les barres et les diagnostics. Passe par `getSignalText(dimId, level)`, qui choisit entre `SIGNAL_TEXTS` et `SIGNAL_TEXTS_HIGH` — sans quoi le bloc annonce une faiblesse au-dessus d'une carte « Solide »
- **Bannière article** : accroche + lien ciblé selon catégorie globale, fourni par `ARTICLE_LINKS.banners[category.key]`
- `GhostSignupForm` : formulaire email soumettant à `/api/subscribe`
- `UnlockModal` : confirmation post-inscription, bouton PDF, Escape, piège à focus, verrou de défilement
- `DiagnosticCard` : diagnostic + action + lien article. Prend un `rank` : la sévérité se lit dans la composition (en-tête dédié au rang 1, numérotation ensuite), pas seulement dans la pastille
- `LockedDiagnosticCard` : titre, niveau réel, score réel et première phrase du diagnostic, tronqués à deux lignes. Rien n'est flouté ni inventé — c'est ce qui rend le gate crédible

### `GhostSignupForm`
- Validation côté client alignée sur la règle du serveur (`isValidEmail`), pour ne pas promettre ce que l'API refusera
- Soumet à `POST /api/subscribe` avec email
- **Six modes d'échec distincts** (`SIGNUP_ERRORS`) : saisie invalide, refus serveur, panne 5xx, réseau. Le client lit `res.status` ; le serveur produit déjà des messages distincts qu'il ne faut pas jeter. Une panne de notre côté ne doit jamais s'annoncer comme une adresse fautive
- `aria-invalid` + `aria-describedby`, effacement du message à la frappe, focus rendu au champ
- Callback `onSuccess(email)` passe l'email pour l'afficher dans le modal

### `UnlockModal`
- Modal centré affiché après succès d'inscription
- `role="dialog"` pour l'accessibilité
- Affiche ✓, titre "Diagnostics déverrouillés", email et avertissement spams
- Bouton "Télécharger mon rapport (PDF)" : appelle `generatePDF(pdfProps)` — feedback "Génération..." pendant la génération
- Bouton "Voir mes résultats" ferme le modal
- Fermeture via clic sur le fond sombre (background dismiss)
- Reçoit `pdfProps` depuis `ResultScreen` (score, catégorie, résultats ordonnés, URLs CTA)

### `PDFDocument`
- Composant layout A4 (794px), styles 100% inline, tokens T
- Sections : en-tête marque, score + texte global complet, signal prioritaire + action, bannière article catégorie, barres d'ensemble (CSS), 5 diagnostics ordonnés (texte + action + lien article), CTA Collaboration Solved
- Chaque section porte `data-pdf-force-break` — `generatePDF` coupe les pages à ces marqueurs, pas en plein milieu d'une carte
- Props `articleLinks` (par dimension) + `bannerArticle` (par catégorie) transmis depuis `ResultScreen`
- Tous les `<a>` deviennent des liens cliquables dans le PDF via `pdf.link()`
- Jamais rendu dans l'arbre principal — uniquement instancié off-screen dans `generatePDF`

### `generatePDF(pdfProps)`
- Fonction async (non-composant)
- Import dynamique de `html2canvas` et `jspdf` (lazy-loaded uniquement au clic)
- Render `PDFDocument` off-screen via `createRoot` + `flushSync`
- Collecte les positions des `[data-pdf-force-break]` et de tous les `<a href>` avant le snapshot
- `html2canvas` capture le nœud DOM en Canvas 2×
- **Pages adaptatives** : découpe le canvas aux positions de force-break ; chaque page a la hauteur exacte de sa section (pas 1 123px fixes)
- `jsPDF` encode chaque tranche en JPEG 0.92 ; `pdf.link()` ajoute les annotations cliquables par-dessus le raster
- Nom de fichier : `diagnostic-sm-[score]-[date].pdf` (date ISO)
- Cleanup DOM + unmount React après génération

### `BentoCard`
- Wrapper visuel partagé (fond blanc, border-radius, border)

### `StyleProvider`
- Injecte les styles globaux (fonts, keyframes, reset) via `useEffect`
- Guard `stylesInjected` pour éviter les doublons

---

## Logique métier exportée

Toutes les fonctions pures sont exportées depuis `sm-survival-score.jsx` pour pouvoir être testées sans React :

| Fonction | Description |
|---|---|
| `computeDimensionScores(answers)` | Agrège les scores par dimension (0–8 chacune) |
| `computeGlobalScore(dimScores)` | Score global 0–100 (somme / 40 × 100, arrondi) |
| `getCategory(pct)` | Retourne la catégorie et la couleur pour un % donné |
| `getDiagnosticLevel(score)` | `low` / `mid` / `high` pour un score 0–8 |
| `buildDimensionResults(dimScores)` | Enrichit chaque dimension avec score + % |
| `isValidEmail(email)` | Validation légère (présence @ et .) |
| `saveQuizState(state)` | Persiste le quiz (screen, currentQ, answers) dans localStorage |
| `loadQuizState()` | Restaure l'état du quiz depuis localStorage ; retourne `null` si invalide |
| `clearQuizState()` | Efface l'état du quiz depuis localStorage |
| `DIMENSION_WEIGHTS` | Constante : poids de survie par dimension (`visibility=5, strategic=4, proof=3, business=2, autonomy=1`) |
| `getPriorityDimension(dimensionScoresPct)` | Dimension prioritaire selon l'algorithme pondéré ; tie-break par poids décroissant |
| `getOrderedDimensions(dimensionScoresPct)` | 5 IDs ordonnés du plus au moins critique pour l'affichage post-gate |
| `buildAbandonPayload(screen, currentQ, answers)` | Retourne `{ questionIndex, questionNumber, dimension, answersGiven }` si `screen === QUIZ`, sinon `null` |

---

## Données

Tout le contenu est défini statiquement dans le fichier principal :

- `DIMENSIONS` (5) — identifiants et libellés
- `QUESTIONS` (20) — 4 par dimension, 3 choix par question (scores 2/1/0)
- `GLOBAL_RESULTS` — textes d'analyse par catégorie (vulnerable / stable / irreplaceable)
- `DIAGNOSTICS` — texte + action par dimension × niveau (low / mid / high)
- `ARTICLE_LINKS` — URLs d'articles ciblés : `cards` (par dimension) + `banners` (par catégorie globale). Utilisé dans `ResultScreen` (bannière + `DiagnosticCard`) et dans `PDFDocument`
- `getCardArticle(categoryKey, dimensionId)` — Retourne `{ url, linkText }`, `{ cta: true, text }` ou `null`. Logique anti-doublon intégrée (vulnérable + visibilité → CTA newsletter)

Aucune API de contenu. Aucun CMS. Modification directe dans le code source.

---

## API serverless

### `POST /api/subscribe`

Reçoit un email, l'inscrit à Ghost via l'Admin API avec authentification JWT HS256.

```
Client → POST /api/subscribe { email }
             │
             ▼
        Validation email (regex : ^[^\s@]+@[^\s@]+\.[^\s@]+$)
             │
             ▼
        Création JWT HS256
        (header.payload.signature)
             │
             ▼
        Ghost Admin API POST /members/ + label "SM Score"
             │
             ├→ 201 (créé) / 409 (doublon ancien Ghost) = succès
             │   └→ 200 { success: true }
             │
             ├→ 422 avec "already exists" dans errors[].message ou errors[].context
             │   └→ 200 { success: true }   ← membre déjà existant, pas une erreur
             │
             └→ autre 4xx / 5xx = erreur
                 └→ status Ghost { error: "Erreur Ghost API" }
```

**Authentification JWT HS256 :**
- `header` : `{ alg: "HS256", typ: "JWT", kid: <id_part_of_key> }`
- `payload` : `{ aud: "/ghost/api/admin/", iat: now, exp: now+5min }`
- `signature` : HMAC-SHA256(header.payload, GHOST_ADMIN_API_KEY)

Les clés `GHOST_ADMIN_API_KEY` et `GHOST_URL` ne sont jamais exposées côté client (variables serveur Vercel uniquement).

---

## Analytics

Tracking anonyme via `navigator.sendBeacon` vers un Google Apps Script déployé en webhook. Aucune donnée personnelle (pas d'email, pas d'IP stockée côté app).

**Identifiants de tracking :**
- `sessionId` — UUID généré à chaque démarrage de quiz, persisté dans localStorage et transmis dans tous les événements de la session
- `deviceId` — UUID persisté dans `localStorage["sm-device-id"]`, généré une seule fois par appareil, inclus dans chaque payload

Événements trackés :
- `quiz_started` (avec `sessionId`)
- `quiz_completed` (avec `sessionId`, score, catégorie, `priority_dim`, scores par dimension)
- `quiz_abandoned` (avec `sessionId`, `questionIndex`, `questionNumber`, `dimension`, `answersGiven`) — émis sur `visibilitychange` (onglet caché) ou `pagehide`, avec dédup via `abandonSentRef` et reset bfcache
- `quiz_resumed` (avec `sessionId`, `questionIndex`) — émis au rechargement de page si un quiz était en cours, permet d'apparier abandon + reprise
- `diagnostics_unlocked`

---

## Contraintes de design

- **Zéro CSS externe** : tout le styling est inline avec des tokens centralisés dans `T`
- **Zéro store externe** : `useState` suffit pour 3 écrans + modal
- **Zéro routing** : navigation gérée par un état `screen` (landing / quiz / result)
- **PDF client-side** : `jsPDF` + `html2canvas` en import dynamique (lazy-loaded au clic) — pas de dépendance serveur
- **Zéro dépendance pour crypto** : Node.js `crypto.createHmac` pour JWT HS256 (serverless)
- **Accessibility first** : ARIA roles, modal, dialog, reduced-motion, progressbar, radiogroup
- **Couleurs portées par surface** : chaque couleur vaut pour un fond clair *ou* pour le vert, jamais les deux. `getCategory` le modélise avec `color` (fond clair) et `onDark` (fond vert) — un token unique assombri pour passer AA sur clair échoue sur foncé, et c'est exactement ainsi qu'une régression a été introduite

## Gate d'accessibilité

`tests/e2e/a11y.spec.js` + `tests/e2e/a11y-probe.js`, lancés par `npm run test:e2e`.

Les tests unitaires lisent la source : ils ne voient ni l'héritage CSS, ni la composition alpha,
ni la surface sur laquelle un élément atterrit réellement. Trois correctifs successifs ont régressé
de la même façon — la paire couleur/surface réparée était vérifiée, la voisine jamais. Ce gate
mesure donc la page rendue, sur 3 bandes de score × verrouillé/déverrouillé × 390/1280px, plus le modal :

- contraste du texte, composé contre les ancêtres réels, seuil choisi d'après la taille et la graisse calculées
- contraste non-textuel des formes porteuses de sens (`data-a11y-shape`, `data-a11y-icon`) — une forme passe si son fond **ou** sa bordure tranche
- indicateur de focus vérifié contre **sa propre** surface, à chaque arrêt de tabulation
- cibles tactiles ≥ 48px, avec l'exemption WCAG 2.2 pour les liens en ligne dans une phrase
- `@axe-core/playwright` pour ARIA, noms accessibles, ordre des titres

Il ne couvre que ce qu'il échantillonne. Avant d'ajouter une surface (pseudo-élément, cible
programmatique), vérifier qu'elle entre dans son périmètre — sinon elle deviendra le prochain angle mort.
