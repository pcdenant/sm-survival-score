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
    │ clic "Je fais le test"
    ▼
QuestionScreen (20 questions, navigation avant/arrière)
    │ réponse à la dernière question
    ▼
ResultScreen
    ├── Score global + catégorie
    ├── Radar chart (Recharts)
    ├── Barres par dimension
    ├── PrioritySignal (texte de signal — dimension la plus critique selon l'algorithme pondéré)
    ├── DiagnosticCard #1 (dimension prioritaire — poids de survie, pas score brut) — toujours visible
    └── DiagnosticCards #2–5 — verrouillées jusqu'à email, ordonnées par criticité
          │ email soumis → GhostSignupForm
          │ POST /api/subscribe → Ghost Admin API
          ├── 201 / 409 (succès)
          │   ├── UnlockModal apparaît
          │   │   ├── Affiche l'email soumis
          │   │   ├── Avertit de vérifier spams
          │   │   ├── Bouton "Télécharger plan d'action (PDF)"
          │   │   │   └── window.print() → boîte d'impression (zéro dep)
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
- Gère l'état global : écran courant, index question, tableau de réponses
- Unique source de vérité pour la navigation
- **localStorage** : restaure l'état du quiz à chaque reload via lazy init des `useState` ; persiste automatiquement via `useEffect` ; nettoie si retour au landing vierge

### `LandingScreen`
- Ecran de présentation statique
- Émet `quiz_started` à l'analytics

### `QuestionScreen`
- Reçoit la question courante par props, sélection locale remontée via callback
- `ProgressBar` : 20 segments visuels groupés par dimension

### `ResultScreen`
- Calcule les scores via `useMemo` (pas de re-calcul inutile)
- Gère 3 états : `unlocked` (booléen), `showModal` (booléen), `subscribedEmail` (string)
- **Sélection prioritaire** : `priorityDimId` via `getPriorityDimension()` — algorithme pondéré, pas score brut. `orderedDimResults` via `getOrderedDimensions()` pour l'ordre post-gate.
- `PrioritySignal` : texte de signal contextuel affiché entre radar/barres et diagnostics
- `GhostSignupForm` : formulaire email soumettant à `/api/subscribe`
- `UnlockModal` : confirmation post-inscription avec email visible, spam warning, bouton PDF
- `DiagnosticCard` : diagnostic + action par dimension déverrouillée
- `LockedDiagnosticCard` : aperçu flou pour les dimensions verrouillées

### `GhostSignupForm`
- Formulaire email simple avec validation côté client
- Soumet à `POST /api/subscribe` avec email
- Gère les états loading/erreur
- Callback `onSuccess(email)` passe l'email pour l'afficher dans le modal

### `UnlockModal`
- Modal centré affiché après succès d'inscription
- `role="dialog"` pour l'accessibilité
- Affiche ✓, titre "Diagnostics déverrouillés", email et avertissement spams
- Bouton PDF : appelle `flushSync(() => onClose())` puis `window.print()` → print dialog
- Bouton "Voir mes résultats" ferme le modal
- Fermeture via clic sur le fond sombre (background dismiss)
- CSS `@media print` : modal et UI masquées, seul le contenu imprimable visible

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

---

## Données

Tout le contenu est défini statiquement dans le fichier principal :

- `DIMENSIONS` (5) — identifiants et libellés
- `QUESTIONS` (20) — 4 par dimension, 3 choix par question (scores 2/1/0)
- `GLOBAL_RESULTS` — textes d'analyse par catégorie (vulnerable / stable / irreplaceable)
- `DIAGNOSTICS` — texte + action par dimension × niveau (low / mid / high)

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
             ├→ 201 (créé) / 409 (doublon) = succès
             │   └→ 200 { success: true }
             │
             └→ 422 / 5xx = erreur
                 └→ 500 { error: message }
```

**Authentification JWT HS256 :**
- `header` : `{ alg: "HS256", typ: "JWT", kid: GHOST_ADMIN_API_KEY }`
- `payload` : `{ iss: "Admin API", aud: "/admin/", iat: now, exp: now+5min }`
- `signature` : HMAC-SHA256(header.payload, GHOST_ADMIN_API_KEY)

Les clés `GHOST_ADMIN_API_KEY` et `GHOST_URL` ne sont jamais exposées côté client (variables serveur Vercel uniquement).

---

## Analytics

Tracking anonyme via `navigator.sendBeacon` vers un Google Apps Script déployé en webhook. Aucune donnée personnelle (pas d'email, pas d'IP stockée côté app).

Événements trackés :
- `quiz_started`
- `quiz_completed` (avec score, catégorie, dimension prioritaire `priority_dim`, scores par dimension)
- `quiz_abandoned` (avec index de question, dimension, nombre de réponses données)
- `diagnostics_unlocked`

---

## Contraintes de design

- **Zéro CSS externe** : tout le styling est inline avec des tokens centralisés dans `T`
- **Zéro store externe** : `useState` suffit pour 3 écrans + modal
- **Zéro routing** : navigation gérée par un état `screen` (landing / quiz / result)
- **Zéro dépendance pour PDF** : `window.print()` native + CSS `@media print` pour masquer l'UI
- **Zéro dépendance pour crypto** : Node.js `crypto.createHmac` pour JWT HS256 (serverless)
- **Accessibility first** : ARIA roles, modal, dialog, reduced-motion, progressbar, radiogroup
