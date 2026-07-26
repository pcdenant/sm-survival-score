# Spec — Carte de score partageable ("Score Card")

## Context

Le quiz produit un score fort émotionnellement (peur de perdre son poste), mais le partage actuel (`handleShare`, ligne ~1257) n'est qu'un texte + lien via Web Share API / clipboard. Rien de visuel, rien qui donne envie d'être vu sur LinkedIn. Résultat : le produit ne passe pas le test "vaut le coup d'un screenshot" — c'est le principal frein identifié dans l'audit Purple Cow à la circulation organique du quiz.

**Objectif :** une image générée automatiquement à partir du résultat, au format post LinkedIn/Instagram, que l'utilisateur télécharge et partage lui-même. Le but n'est pas de remplacer le partage texte existant, mais d'ajouter un artefact visuel qui donne une vraie raison de publier.

---

## Décisions issues de l'interview

| Sujet | Décision |
|---|---|
| Déclenchement | Disponible immédiatement sur `ResultScreen`, **avant** l'email — pas de barrière |
| Contenu | Score global (/100) + badge catégorie + mini radar des 5 dimensions |
| Personnalisation | Anonyme — aucun prénom, aucune donnée perso sur la carte |
| Score sensible ("Vulnérable") | Pas de filtre — le score brut est affiché tel quel, cohérent avec le ton cash du produit |
| Format | Carré 1:1 (1080×1080), optimisé feed LinkedIn/Instagram |
| CTA sur la carte | Logo/texte "Collaboration Solved" + URL du quiz |
| Partage | Bouton "Télécharger l'image" → l'utilisateur poste lui-même. Pas de Web Share API image en v1 |
| Mesure de succès | Événement analytics : nombre de cartes générées/téléchargées |

---

## Goals

1. Créer un artefact visuel que l'utilisateur a envie de publier (test "vaut le coup d'un screenshot" du Purple Cow audit) — proxy : ratio cartes générées / résultats vus
2. Aucune nouvelle dépendance npm — réutiliser `html2canvas` (déjà chargé dynamiquement pour le PDF)
3. Zéro impact sur le funnel email existant : la carte est un ajout, pas un remplacement du unlock

## Non-Goals (v1)

- Web Share API avec image jointe (partage natif mobile) — fallback téléchargement uniquement pour l'instant ; possible v2 si le taux de génération est bon mais le taux de partage effectif reste bas
- Personnalisation (prénom, photo, message perso) — anonyme uniquement en v1
- Formats additionnels (story 9:16, etc.) — un seul format carré pour limiter le scope
- Tracking du retour trafic réel (UTM cliquable) — une image n'est pas cliquable ; on mesure la génération, pas le clic entrant (voir Open Questions)
- Comparatif/percentile face aux autres SM sur la carte — c'est la piste #2 de l'audit Purple Cow, traitée séparément (implique un backend)

---

## Contenu visuel de la carte (P0)

- Fond : vert brand (`T.vert`), cohérent avec le hero du `ResultScreen`
- En-tête : "SM Survival Score" + petite mention "Collaboration Solved"
- Centre : score en grand (même traitement que le hero, `clamp` typo), `/100`, badge catégorie coloré (`category.label`, `category.color`)
- Radar 5 dimensions (mini version), labels courts (`dimension.shortName`)
- Pied de carte : URL du quiz (`https://dub.sh/sm-survival-score`)

Toutes les données sont déjà calculées dans `ResultScreen` via `useMemo` (globalScore, category, dimensionResults, radarData) — disponibles qu'on soit unlocked ou non, donc aucun calcul supplémentaire nécessaire pour rendre la carte disponible avant l'email.

---

## Approche technique

### Pas de nouvelle dépendance
`html2canvas` est déjà importé dynamiquement dans `generatePDF()` (ligne ~213-219). Même pattern réutilisable :

```
[Bouton "Télécharger ma carte"]
  → import("html2canvas") dynamique
  → renderToOffscreenDiv(<ScoreCardDocument ...props />)  // 1080×1080, hors écran
  → html2canvas(container) → canvas
  → canvas.toBlob() → lien <a download> → déclenchement automatique
  → div retiré du DOM
```

Nommage fichier : `score-sm-survival-[score]-[date].png` (même convention que le PDF : `diagnostic-sm-[score]-[date].pdf`).

### ⚠️ Point technique à valider avant implémentation
Le `PDFDocument` existant (ligne 764) n'inclut **pas** le radar Recharts — probable limitation connue de html2canvas avec le SVG généré par Recharts (gradients, `foreignObject`). Pour la carte, deux options :
1. Redessiner un radar simplifié en SVG statique fait main (5 axes, pas de dépendance Recharts) — plus fiable pour la capture
2. Tester `html2canvas` sur le `RadarChart` Recharts directement — risque de rendu cassé/vide

**Recommandation** : partir sur l'option 1 (SVG maison) pour éviter la mauvaise surprise en prod. À confirmer par un test rapide avant de committer l'approche finale.

### Nouveau composant
`ScoreCardDocument` — même famille que `PDFDocument`, section COMPOSANTS. Rendu off-screen (`position: absolute; left: -9999px`), styles inline (cohérent avec le reste du fichier).

---

## Analytics

Nouvel événement, même pattern que les 4 existants (`trackEvent`, fire-and-forget, `try/catch` silencieux) :

| Événement | Déclencheur | Payload |
|---|---|---|
| `score_card_generated` | Clic "Télécharger ma carte" (succès génération) | `{ timestamp, event, sessionId, score_global, category }` |

---

## Changements de fichiers

| Fichier | Changement |
|---|---|
| `src/sm-survival-score.jsx` | + composant `ScoreCardDocument` + fonction `generateScoreCard()` + bouton dans `ResultScreen` + événement `score_card_generated` |
| Aucun nouveau fichier, aucune nouvelle dépendance `package.json` |

---

## Ce qui NE change PAS

- `handleShare` (partage texte existant) : inchangé, reste disponible en plus de la carte
- Flux email / Ghost / `GhostSignupForm` / `UnlockModal` : inchangés
- Le unlock des diagnostics reste conditionné à l'email — la carte n'en fait pas partie
- Structure des données (`DIMENSIONS`, `DIAGNOSTICS`, etc.) : aucune modification

---

## Vérification

1. Sur `ResultScreen`, sans avoir donné d'email → bouton "Télécharger ma carte" visible et actif
2. Clic → image PNG 1080×1080 téléchargée automatiquement (pas de dialog navigateur)
3. Vérifier contenu : score exact, badge catégorie coloré correct, radar lisible et fidèle aux 5 scores
4. Tester les 3 catégories (Vulnérable / Stable / Irremplaçable) pour valider les couleurs
5. Tester sur mobile (iOS Safari, Android Chrome) — le téléchargement doit fonctionner sans passer par un dialog bloquant
6. Vérifier l'événement `score_card_generated` dans l'analytics (payload correct)
7. Vérifier qu'aucune régression n'affecte le bouton "Envoie le test à un collègue SM" existant

---

## Open Questions

| # | Question | Qui tranche |
|---|---|---|
| 1 | Radar Recharts vs SVG maison pour la fiabilité html2canvas — confirmer par un test technique rapide | Engineering |
| 2 | Emplacement du bouton : juste sous le hero (score, à chaud) vs. en bas à côté de "Envoie le test" — recommandation : sous le hero, en plus du bouton bas | Produit/Design |
| 3 | Tagline/nom exact affiché sur la carte : juste "SM Survival Score" ou une punchline par catégorie ? | Produit |
| 4 | Faut-il un paramètre distinct sur l'URL affichée (ex. mention courte type "via score card") pour distinguer ce canal dans les retours qualitatifs, sachant qu'un lien dans une image n'est pas cliquable et devra être retapé ? | Produit |
| 5 | Palette exacte de la carte : vert plein (comme le hero) ou fond crème avec accents verts (comme le reste du produit) — maquette à valider avant implémentation | Design |
