# Spec — P4 : PDF personnalisé post-unlock

## Context

Après l'unlock via email, Ghost envoie une newsletter générique sans lien avec le score obtenu. L'utilisateur n'a aucune continuité entre son diagnostic et ce qu'il reçoit. Le PDF actuel (window.print()) imprime l'écran tel quel — pas un document conçu pour être gardé ou partagé. Ce PDF personnalisé est l'unique mécanisme d'onboarding disponible (Ghost ne supporte pas les séquences email).

**Objectif :** Un document PDF que le SM garde, partage, et qui rappelle Collaboration Solved.

---

## Décisions issues de l'interview

| Sujet | Décision |
|---|---|
| Livraison | Téléchargement immédiat au moment de l'unlock + Ghost envoie son email standard (pas de PDF en pièce jointe) |
| Génération | Client-side via jsPDF + html2canvas (**⚠ libs à approuver avant implémentation**) |
| Action immédiate | Dérivée de la dimension prioritaire (P2) — `DIAGNOSTICS[priorityDimId][level].action` |
| Textes diagnostic | Réutilisation des textes existants dans `DIMENSIONS[id].diagnostics[level].text` |
| CTA | Lien vers collaborationsolved.com + email direct (URLs en config, à définir) |
| Design | Style rapport professionnel — noir/blanc + couleur pour les scores |
| Logo | Texte "Collaboration Solved" en typographie (pas de fichier image) |

---

## Structure du PDF (ordre des pages)

### Page 1 — Couverture

- En-tête : `Collaboration Solved` (texte, style marque)
- Titre : `Diagnostic de survie Scrum Master`
- Sous-titre : `Rapport personnalisé — [date]`
- Bloc score global :
  - Pourcentage (`globalScore`) en grand
  - Badge catégorie (`category.label`) avec couleur (`category.color`)
  - 2 premières phrases de `GLOBAL_RESULTS[category.key].paragraphs[0]`
- Pied de page : URL collaborationsolved.com + email direct

### Page 2 — Signal priorité + Action immédiate

- Section noire / accent coloré (reprend le style du `PrioritySignal` existant) :
  - `SIGNAL_TEXTS[priorityDimId].title`
  - `SIGNAL_TEXTS[priorityDimId].body`
- Box "Ton action immédiate cette semaine" :
  - `DIMENSIONS.find(d => d.id === priorityDimId).diagnostics[level].action`
  - `level` = `getDiagnosticLevel(dimensionScores[priorityDimId])`

### Page 3 — Vue d'ensemble des 5 dimensions

- Tableau ou liste ordonnée par priorité (`orderedDimIds`) :
  - Nom de dimension (`dimension.shortName`)
  - Score en % (`dimensionScoresPct[id]`)
  - Barre de progression (CSS simple, rendu html2canvas)
  - Niveau : Critique / Faible / Moyen / Fort (mappé depuis low/mid/high)
  - La dimension prioritaire est mise en avant (fond coloré ou badge)

### Pages 4-5 — Les 5 diagnostics (ordre priorité)

Pour chaque dimension, dans l'ordre `orderedDimIds` :
- Titre : `dimension.shortName` + score
- Texte : `dimension.diagnostics[level].text`
- Box "Action" : `dimension.diagnostics[level].action`
- Séparateur visuel entre chaque dimension

### Dernière page (ou bas de page 5) — CTA Collaboration Solved

- Texte d'intro : "Pour aller plus loin…"
- Lien : `COLLAB_SOLVED_URL` (variable de config, URL à définir)
- Email direct : `COLLAB_SOLVED_EMAIL` (variable de config)
- Signature : "Pierre-Cyril Denant — Collaboration Solved"

---

## Données disponibles au moment de la génération

Toutes les données nécessaires sont déjà en mémoire dans `ResultScreen` au moment où l'unlock se produit. Le composant PDF reçoit ces props :

```javascript
{
  globalScore: number,          // 0-100
  category: { key, label, color, bg },
  globalResult: { paragraphs: string[] },
  dimensionScores: { visibility, proof, business, autonomy, strategic },   // 0-8
  dimensionScoresPct: { ... },  // 0-100
  dimensionResults: [...],      // buildDimensionResults() — 5 items enrichis
  priorityDimId: string,        // getPriorityDimension()
  orderedDimIds: string[],      // getOrderedDimensions()
}
```

Fonctions pures réutilisées : `getDiagnosticLevel`, `getPriorityDimension`, `getOrderedDimensions`, `buildDimensionResults` (toutes déjà exportées depuis `sm-survival-score.jsx`).

---

## Approche technique

### Librairies requises (à approuver)

| Lib | Usage | Taille bundle |
|---|---|---|
| `jsPDF` | Conversion HTML → PDF, téléchargement | ~250 KB |
| `html2canvas` | Snapshot du composant PDF en canvas | ~180 KB |

Alternative sans lib : composant HTML dédié + CSS `@media print` + `window.print()` avec un meilleur rendu que l'existant. Moins de contrôle sur la pagination. À discuter avant implémentation.

### Flux de génération

```
[Bouton "Télécharger mon rapport" dans UnlockModal]
  → renderToOffscreenDiv(<PDFDocument ...props />)
  → html2canvas(div) → canvas
  → jsPDF.addImage(canvas) → pdf.save("diagnostic-sm.pdf")
  → div removed from DOM
```

### Composant `PDFDocument`

- Nouveau composant dans `sm-survival-score.jsx` (section COMPOSANTS, après LockedDiagnosticCard)
- Props : toutes les données listées ci-dessus
- Rendu off-screen (position absolute, left -9999px, opacity 0) avant capture
- Styles 100% inline (cohérence avec le reste du fichier), palette noir/blanc + couleurs score

### Config URLs

Ajouter dans `.env.example` :
```
VITE_COLLAB_SOLVED_URL=
VITE_COLLAB_SOLVED_EMAIL=
```

Lus via `import.meta.env.VITE_COLLAB_SOLVED_URL` dans le composant.

---

## Changements de fichiers

| Fichier | Changement |
|---|---|
| `src/sm-survival-score.jsx` | + composant `PDFDocument` + fonction `generatePDF()` + bouton dans `UnlockModal` |
| `.env.example` | + `VITE_COLLAB_SOLVED_URL` + `VITE_COLLAB_SOLVED_EMAIL` |
| `package.json` | + `jspdf` + `html2canvas` (après approbation) |

Fichier central resté : `src/sm-survival-score.jsx`. Pas de nouveau fichier.

---

## Ce qui NE change PAS

- Logique Ghost (`/api/subscribe`) : inchangée
- `window.print()` existant : supprimé et remplacé par `generatePDF()`
- Flux email : Ghost envoie son email standard, pas de PDF en pièce jointe
- Structure des données (DIMENSIONS, DIAGNOSTICS, etc.) : aucune modification

---

## Vérification

1. Soumettre un email → modal s'ouvre → cliquer "Télécharger mon rapport"
2. PDF généré et téléchargé automatiquement (pas de dialog navigateur)
3. Vérifier : couverture avec score correct, badge catégorie coloré, signal priorité juste, 5 diagnostics dans l'ordre priorité, CTA en dernière page
4. Ouvrir le PDF sur mobile (iOS Safari, Android Chrome) — vérifier lisibilité
5. Vérifier que l'email Ghost standard est toujours envoyé indépendamment
6. Tester avec les 3 catégories (score < 45, 45-74, ≥ 75) pour valider le contenu conditionnel

---

## Décisions finalisées

| Point | Décision |
|---|---|
| **Libs** | `jspdf` + `html2canvas` ✅ approuvés |
| **Nom du fichier PDF** | `diagnostic-sm-[score]-[date].pdf` — ex. `diagnostic-sm-72-2026-06-14.pdf` |
| **URLs Collaboration Solved** | `VITE_COLLAB_SOLVED_URL` + `VITE_COLLAB_SOLVED_EMAIL` à fournir avant déploiement (reste à définir) |
