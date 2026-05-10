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
                         └── Kit API (email)
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
    ├── DiagnosticCard #1 (dimension la plus faible) — toujours visible
    └── DiagnosticCards #2–5 — verrouillées jusqu'à email
          │ email soumis → Kit form embed (script externe)
          │ MutationObserver détecte le succès
          └── Unlock → 4 cards supplémentaires visibles
```

---

## Composants

### `SMSurvivalScore` (racine)
- Gère l'état global : écran courant, index question, tableau de réponses
- Unique source de vérité pour la navigation

### `LandingScreen`
- Ecran de présentation statique
- Émet `quiz_started` à l'analytics

### `QuestionScreen`
- Reçoit la question courante par props, sélection locale remontée via callback
- `ProgressBar` : 20 segments visuels groupés par dimension

### `ResultScreen`
- Calcule les scores via `useMemo` (pas de re-calcul inutile)
- `DiagnosticCard` : diagnostic + action par dimension déverrouillée
- `LockedDiagnosticCard` : aperçu flou pour les dimensions verrouillées
- Kit embed via injection de `<script>` dans un ref DOM, `MutationObserver` pour détecter la confirmation

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

Reçoit un email, l'inscrit au formulaire Kit configuré en variable d'environnement.

```
Client → POST /api/subscribe { email }
             │
             ▼
        Validation email
             │
             ▼
        Kit API v4 POST /forms/{FORM_ID}/subscribers
             │
             ▼
        200 { success: true }  /  4xx/5xx { error }
```

La clé API Kit n'est jamais exposée côté client.

> **Note** : Le formulaire Kit est aussi intégré directement en embed client-side (script Kit). La serverless function `/api/subscribe` est une alternative serveur disponible mais non utilisée par le flow principal.

---

## Analytics

Tracking anonyme via `navigator.sendBeacon` vers un Google Apps Script déployé en webhook. Aucune donnée personnelle (pas d'email, pas d'IP stockée côté app).

Événements trackés :
- `quiz_started`
- `quiz_completed` (avec score, catégorie, dimension la plus faible, scores par dimension)
- `diagnostics_unlocked`

---

## Contraintes de design

- **Zéro CSS externe** : tout le styling est inline avec des tokens centralisés dans `T`
- **Zéro store externe** : `useState` suffit pour 3 écrans
- **Zéro routing** : navigation gérée par un état `screen` (landing / quiz / result)
- **Zéro backend obligatoire** : l'app fonctionne en statique ; Kit est intégré par script client
