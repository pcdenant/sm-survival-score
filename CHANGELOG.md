# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionning basé sur [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.7.0] — 2026-06-14

### Ajouté
- **PDF personnalisé post-unlock** — Téléchargement client-side déclenché depuis `UnlockModal` via `jsPDF` + `html2canvas`
  - Nom de fichier : `diagnostic-sm-[score]-[date].pdf`
  - Contenu : score global, badge catégorie, texte global, signal prioritaire, vue d'ensemble (barres CSS), 5 diagnostics ordonnés par criticité (texte + action), CTA Collaboration Solved
- **`PDFDocument`** — Composant layout A4 (794px) styles 100% inline, palettes et tokens existants
- **`generatePDF(pdfProps)`** — Fonction async : render off-screen, html2canvas, jsPDF, pagination automatique, cleanup
- **Variables d'env** : `VITE_COLLAB_SOLVED_URL` + `VITE_COLLAB_SOLVED_EMAIL` (optionnelles, affichées dans le PDF)

### Modifié
- **`UnlockModal`** — Bouton "Télécharger mon rapport (PDF)" → appelle `generatePDF()` (remplace `window.print()`), feedback "Génération..." pendant la génération
- **`ResultScreen`** — Construit `pdfProps` via `useMemo` et le transmet à `UnlockModal`

### Dépendances
- `jspdf@^4.2.1` + `html2canvas@^1.4.1` ajoutées (import dynamique — lazy-loaded uniquement au clic)

### Tests
- +1 test E2E Playwright : vérifie le nom de fichier du téléchargement PDF
- Mise à jour assertion wording : `"Télécharger mon plan d'action"` → `"Télécharger mon rapport"`
- Total : 252 + 27 = 279 tests unitaires passing

### Connu — à corriger (cosmétique, non bloquant)
- **Pagination PDF** : le contenu est tronqué à la page 2 au niveau de la 2e dimension. La logique de découpage `imgH / pageH` fonctionne mais le contenu généré par html2canvas dépasse la hauteur A4 de façon imprévisible selon le score (volume de texte variable). Fix envisagé : multi-canvas par section, ou ajuster la hauteur de page dynamiquement selon `container.scrollHeight`.

---

## [1.6.0] — 2026-06-14

### Ajouté
- **Algorithme de priorité pondéré** — Remplace la sélection par score brut le plus bas par `priorityScore = (1 − score_normalized) × weight`. Le diagnostic pré-gate affiche désormais la dimension la plus dangereuse pour la survie du poste, pas la plus basse. Ex : autonomy=0%, visibility=40% → signal Visibilité affiché en priorité.
- **`DIMENSION_WEIGHTS`** — Constante exportée : `visibility=5, strategic=4, proof=3, business=2, autonomy=1`
- **`getPriorityDimension(dimensionScoresPct)`** — Retourne l'ID de la dimension prioritaire ; tie-break par poids décroissant
- **`getOrderedDimensions(dimensionScoresPct)`** — Retourne les 5 IDs ordonnés du plus au moins critique
- **`PrioritySignal`** — Composant inline affiché entre le radar/barres et les diagnostics : fond sombre `#1a1a2e`, bordure gauche jaune `#FFF200`, texte de signal spécifique à la dimension prioritaire
- **`SIGNAL_TEXTS`** — 5 textes éditoriaux (un par dimension) : titre "Ton angle mort le plus urgent : …" + corps

### Modifié
- **`ResultScreen`** — Pré-gate et ordre post-gate utilisent l'algorithme pondéré au lieu de `sort((a, b) => a.score - b.score)`
- **Analytics** — `quiz_completed` : champ `weakest_dim` → `priority_dim`

### Tests
- +20 tests unitaires : `getPriorityDimension` (6), `getOrderedDimensions` (4), wording `SIGNAL_TEXTS` (10)
- Total : 252 tests passing

---

## [1.5.0] — 2026-05-23

### Ajouté
- **UnlockModal** — Modal centré qui apparaît après la soumission email pour confirmer l'inscription et inviter l'utilisateur à vérifier son email (spams inclus)
- **Téléchargement PDF** — Bouton "Télécharger mon plan d'action" qui utilise `window.print()` (zéro dépendances) ; CSS `@media print` masque l'UI pour un PDF propre
- **Tests E2E Playwright** — 3 nouveaux tests validant le modal : apparition du titre, affichage de l'email soumis, fermeture du modal

### Modifié
- **Bannière d'unlock** — Suppression de la bannière verte "C'est débloqué..." remplacée par le modal plus informatif
- **GhostSignupForm** — Callback `onSuccess` passe maintenant l'email soumis pour l'afficher dans le modal

### Tests
- +5 assertions d'intégrité de wording pour vérifier la présence des textes du modal et l'absence de l'ancienne bannière

---

## [1.4.0] — 2026-05-23

### Modifié
- **Inscription email** — Migration de ConvertKit (Kit) vers **Ghost Admin API** avec authentification JWT HS256
- **API serverless** — `/api/subscribe` réécrite pour appeler Ghost au lieu de Kit, gère 201 (créé) et 409 (membre existant) comme succès
- **Label membre** — Les email soumis reçoivent automatiquement le label "SM Score" dans Ghost

### Supprimé
- `useKitFormUnlock()` hook utilisant MutationObserver (approche fragile)
- Injection de script Kit côté client (intégration directe disparue)

### Tests
- +27 nouveaux tests unitaires pour Ghost API : JWT HS256, validation email, gestion des codes HTTP, erreurs réseau
- 5 tests E2E Playwright couvrant le flow complet : accès au formulaire, succès API, erreurs, doublon (409)

---

## [1.3.0] — 2026-05-23

### Ajouté
- **Persistance localStorage** — Quiz progress sauvegardé automatiquement; l'utilisateur qui rafraîchit la page en cours de diagnostic reprend à la même question avec ses réponses
- **3 fonctions pures exportées** : `saveQuizState`, `loadQuizState`, `clearQuizState` pour persistance transparente (testables sans React)

### Modifié
- **Lazy init setState** — `screen`, `currentQ` et `answers` restaurés depuis localStorage au mount
- **Cleanup auto** — localStorage effacé automatiquement si l'état revient au landing vierge
- **handleRestart** — appelle `clearQuizState()` avant réinitialisation

### Tests
- +10 nouveaux tests pour storage utilities : round-trip, corruption, recovery, edge cases
- Tests mockent localStorage en Node.js (zéro dépendance)

---

## [1.2.0] — 2026-05-11

### Modifié
- **Seuils de scoring** — ajustement des frontières de catégories : Vulnérable 0–44% (était 0–39%), Stable 45–74% (était 40–69%), Irremplaçable 75–100% (était 70–100%).

---

## [1.1.0] — 2026-05-11

### Modifié
- **Wording v1.2** — Reformulation du texte de 14 questions et options pour plus de clarté et d'impact (Q1, Q2, Q3, Q4, Q6, Q7, Q8, Q9, Q12, Q13, Q14, Q15, Q17, Q20). Aucun changement de scoring ni de logique de calcul.
- **Q20** — Question et option score 0 réécrites pour aligner l'angle éditorial sur l'impact de l'absence du SM, cohérent avec les options score 2 et 1.

### Tests
- Nouveau bloc `WORDING INTEGRITY v1.2` dans la suite de tests : vérifie la présence des strings finales et l'absence des anciennes pour les 14 questions modifiées.

---

## [1.0.0] — 2025-05-10

### Ajouté
- Application complète de diagnostic en 3 écrans (landing → quiz → résultats)
- 20 questions réparties sur 5 dimensions : Visibilité, Preuves, Business, Autonomie, Stratégique
- Calcul de score global sur 100 avec 3 catégories (Vulnérable / Stable / Irremplaçable)
- Radar chart Recharts pour visualiser le profil par dimension
- Barres de progression par dimension avec code couleur
- Diagnostic textuel + action immédiate pour chaque dimension
- Unlock des 4 diagnostics supplémentaires via email (intégration Kit / ConvertKit)
- Tracking anonyme des événements via Google Apps Script (quiz_started, quiz_completed, diagnostics_unlocked)
- Serverless function Vercel `/api/subscribe` pour l'inscription Kit côté serveur
- Suite de tests Node.js zero-dépendance couvrant la logique de scoring et les cas limites
- Design system inline avec tokens : vert #006946, jaune #FFF200, crème #FBF3EB, typographie DM Sans
- Support responsive mobile-first
- Accessibilité : ARIA roles, progressbar, radiogroup, meter, reduced-motion
- Bouton de partage natif (Web Share API avec fallback clipboard)
