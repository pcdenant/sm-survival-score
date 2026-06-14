# PRD — SM Survival Score
**Version:** 1.5.0  
**Date:** 2026-06-14  
**Owner:** Pierre-Cyril Denant — Collaboration Solved  
**Statut:** Production  
**URL:** https://dub.sh/sm-survival-score

---

## 1. CONTEXTE & PROBLÈME

### Problème utilisateur
Les Scrum Masters font face à une vague de suppressions de postes. Capital One a éliminé 1 100 rôles agiles qualifiés de "critiques." La ScrumAlliance estime que 18 % des Scrum Masters ont été touchés par des licenciements depuis 2022. Les outils de gestion de projet automatisent 85 % des responsabilités perçues du SM pour une fraction du salaire.

Le problème n'est pas la compétence — c'est la **défensibilité du rôle**. Un SM peut être excellent et avoir un poste non défendable si son impact est invisible, non chiffré, ou mal articulé au niveau décisionnel.

### Insight central
Les rôles agiles supprimés n'étaient pas nécessairement moins performants que leurs pairs. Ils étaient **moins défendables**. La matière est souvent là ; c'est la traduction qui manque.

### Solution
Un diagnostic interactif en 20 questions qui mesure la solidité du rôle d'un Scrum Master sur 5 dimensions critiques. Le SM repart avec :
- Un score global sur 100
- Un profil radar par dimension
- Un diagnostic texte par dimension (niveau + action immédiate)
- Un plan d'action personnalisé (débloqué par email)

---

## 2. OBJECTIFS PRODUIT

| Objectif | Indicateur | Cible |
|---|---|---|
| Acquisition liste email | Taux de complétion quiz → unlock | > 40 % |
| Engagement | Taux de complétion du quiz | > 70 % |
| Rétention | Taux d'abandon mid-quiz | < 30 % |
| Amplification | Partages via bouton "Envoyer à un collègue" | Mesurable via analytics |

---

## 3. UTILISATEUR CIBLE

**Persona principal :** Scrum Master en poste, 2–8 ans d'expérience, inquiet de la stabilité de son rôle dans un contexte de réduction d'effectifs ou de réorganisation.

**Comportement :** Cherche à se positionner stratégiquement, pas à apprendre les bases du Scrum. Parle français. Connaît les termes métier agile mais commence à sentir qu'ils ne résonnent pas avec le management.

**Contexte d'usage :** Seul, sur desktop ou mobile, pendant 5 minutes. Motivation : curiosité + légère anxiété sur la solidité de son rôle.

---

## 4. FLUX UTILISATEUR

```
LandingScreen
  └─ CTA "Voir mes angles morts"
       └─ QuestionScreen (Q1 → Q20, linéaire, navigation avant/arrière)
            └─ ResultScreen
                 ├─ Score + catégorie (visible immédiatement)
                 ├─ Radar + scores par dimension (visible immédiatement)
                 ├─ Diagnostic #1 — dimension la plus faible (visible immédiatement)
                 ├─ Diagnostics #2–5 (verrouillés)
                 └─ GhostSignupForm (email → POST /api/subscribe → Ghost Admin API)
                      ├─ 201/409 (succès) → UnlockModal
                      │    ├─ Affiche email soumis + spam warning
                      │    ├─ Bouton PDF → flushSync(close) + window.print()
                      │    └─ "Voir mes résultats" → ferme modal
                      └─ UnlockModal fermé → diagnostics #2–5 déverrouillés
```

**Navigation :** Gérée par état `screen` (valeurs : `landing` / `quiz` / `result`). Zéro routing côté client.

---

## 5. CONTENU — DIMENSIONS & QUESTIONS

### Architecture de scoring

- **5 dimensions**, 4 questions chacune
- **3 réponses par question**, scorées 2 / 1 / 0
- **Score dimension :** 0–8 points
- **Score global :** `Math.round((somme dimensions / 40) × 100)` → 0–100 %

### Seuils de catégorie

| Plage | Catégorie | Couleur |
|---|---|---|
| 0–44 % | Vulnérable | Rouge `#dc2626` |
| 45–74 % | Stable | Ambre `#f59e0b` |
| 75–100 % | Irremplaçable | Vert `#006946` |

### Niveaux de diagnostic par dimension

| Score dimension | Niveau |
|---|---|
| 0–3 | `low` |
| 4–5 | `mid` |
| 6–8 | `high` |

---

### Dimension 1 — VISIBILITÉ (`visibility`)
**Nom court :** Visibilité  
**Enjeu :** Le management voit-il et reconnaît-il ce que tu fais ?

#### Questions

**Q1.** "Un VP entre dans l'ascenseur, te demande : 'Qu'est-ce que tu apportes à l'équipe en ce moment ?' Tu as 30 secondes."
- `2` — J'ai une réponse précise — avec un chiffre ou un exemple concret derrière
- `1` — Je m'en sortirai, mais ce serait vague
- `0` — Je bégaierais probablement

**Q2.** "Au cours des 30 derniers jours, as-tu communiqué un résultat chiffré à ton manager ?"
- `2` — Oui, au moins une fois
- `1` — J'ai communiqué des résultats, mais rien de chiffré
- `0` — Non

**Q3.** "En dehors des réunions, ton manager pourrait-il citer de mémoire une contribution concrète de ta part ce trimestre ?"
- `2` — Oui, sans hésitation
- `1` — Peut-être, mais j'en doute
- `0` — Probablement pas

**Q4.** "Si ton poste disparaissait demain, quelqu'un dans le management se battrait-il pour garder TOI — pas juste un SM dans l'équipe ?"
- `2` — Oui, j'ai au moins un allié qui tient à moi — pas juste au rôle
- `1` — Je ne sais pas
- `0` — Probablement pas

#### Diagnostics

| Niveau | Titre | Texte | Action |
|---|---|---|---|
| `low` | Invisible aux yeux du management | Le management ne sait pas ce que tu fais. Si une réorganisation arrive, le travail invisible est coupé en premier. | Envoie à ton manager un message de 3 lignes cette semaine avec UN résultat concret du dernier sprint — pas un statut. |
| `mid` | Vaguement visible, insuffisamment défendable | Ton manager a vaguement l'impression que tu fais du bon travail, mais "vaguement" ne pèse rien dans une décision de licenciement. Pas en danger immédiat, mais pas de filet non plus. | Prends ta contribution la plus significative et reformule-la en une phrase qu'un VP comprendrait sans contexte. Si tu n'y arrives pas, c'est là que tu travailles. |
| `high` | Impact visible et défendable | Ton impact est visible. Le management sait ce que tu apportes et pourrait le défendre. Bonne base — mais la visibilité ne se stocke pas, elle se renouvelle chaque trimestre. | Peux-tu documenter tes 3 contributions majeures de ce trimestre au format avant/après chiffré ? Si oui, tu as un dossier. Sinon, tu as un objectif. |

---

### Dimension 2 — PREUVES (`proof`)
**Nom court :** Preuves  
**Enjeu :** As-tu des données pour appuyer ce que tu fais ? Les mots se discutent. Les chiffres non.

#### Questions

**Q5.** "Si on te demandait combien d'items ton équipe livre par sprint en moyenne, tu connais le chiffre ?"
- `2` — Oui, de tête
- `1` — À peu près
- `0` — Non

**Q6.** "Tu as accès à Jira (ou équivalent). Qu'est-ce que tu en fais ?"
- `2` — Je l'utilise pour diagnostiquer ce qui bloque — et décider quoi faire
- `1` — Je mets à jour les tickets et tire des rapports quand on me le demande
- `0` — Je ne l'utilise pas comme outil de diagnostic — je me base sur ce que j'observe en réunion

**Q7.** "Pourrais-tu montrer à ton manager un avant/après chiffré qui prouve l'impact d'une de tes actions ?"
- `2` — Oui, j'ai au moins un exemple concret
- `1` — Je pourrais probablement en construire un, mais je ne l'ai pas fait
- `0` — Non, je n'aurais rien à montrer

**Q8.** "La dernière fois que tu as proposé un changement à ton équipe ou ton manager, qu'est-ce que tu avais en main ?"
- `2` — Un chiffre ou un fait — j'aurais pu me défendre si on avait insisté
- `1` — Une bonne raison, mais rien à montrer si on avait insisté
- `0` — Surtout une intuition que c'était la bonne direction

#### Diagnostics

| Niveau | Titre | Texte | Action |
|---|---|---|---|
| `low` | Aucune donnée pour défendre ta valeur | Pas de données pour appuyer ce que tu fais. Quand on te demande "quelle est ta valeur ajoutée ?" tu réponds avec des mots. Les mots se discutent ; les chiffres non. Les organisations ne gardent pas les personnes qui n'ont que des mots. | Ouvre Jira et note deux chiffres : items livrés ce sprint et le sprint précédent. C'est ton premier point de données. |
| `mid` | Des réflexes de données, mais pas systématiques | Tu as des réflexes de données mais ce n'est pas systématique. Tu consultes Jira parfois, tu sais à peu près ce qui se passe. Si on te demandait de prouver une amélioration, tu devrais chercher. Tu vois les problèmes mais tu ne peux pas les documenter quand ça compte. | Choisis UNE métrique simple (items livrés ou blocages résolus) et suis-la chaque sprint pendant un mois. Après 4 sprints, tu as une tendance. Une tendance, c'est une preuve. |
| `high` | Tu sais utiliser les données pour diagnostiquer et défendre | Tu sais utiliser les données pour diagnostiquer et appuyer tes actions. La plupart des SMs ne sont pas là. La question : ces données atteignent-elles ton management, ou restent-elles dans ta tête ? | Prends ton meilleur chiffre avant/après et transforme-le en mini-cas de 5 lignes. Si ton manager peut le lire et comprendre l'impact en 30 secondes, tu as un actif réutilisable. |

---

### Dimension 3 — BUSINESS (`business`)
**Nom court :** Business  
**Enjeu :** Parles-tu le langage des décideurs ? Vocabulaire Scrum = invisible. Vocabulaire business = protégé.

#### Questions

**Q9.** "Quand tu parles à ton manager ou un directeur, quel vocabulaire utilises-tu ?"
- `2` — Risque, coût, délai, prédictibilité — avec des chiffres pour illustrer
- `1` — Un mix : je traduis parfois en termes business, parfois je reste en mode Scrum
- `0` — Le vocabulaire de mon rôle (sprint, backlog, retro) — je traduis rarement

**Q10.** "As-tu déjà traduit un problème d'équipe en impact business ? (retard = coût, blocage = risque, turnover = perte de vélocité)"
- `2` — Oui, je l'ai fait et communiqué
- `1` — J'y ai pensé mais ne l'ai pas formalisé
- `0` — Non, je ne saurais pas par où commencer

**Q11.** "Sais-tu ce que coûte une semaine de retard pour ton équipe ?"
- `2` — Oui, j'ai un ordre de grandeur
- `1` — Je pourrais le calculer si on me le demandait
- `0` — Non, et je ne sais pas comment le calculer

**Q12.** "Ton management te consulte-t-il avant de prendre des décisions qui affectent ton équipe ?"
- `2` — Oui, régulièrement
- `1` — Parfois, quand ils y pensent
- `0` — Rarement — j'apprends la décision en même temps que tout le monde

#### Diagnostics

| Niveau | Titre | Texte | Action |
|---|---|---|---|
| `low` | Tu parles Scrum à des décideurs business | Tu parles Scrum à des gens du business. "Sprint goal" quand ils veulent "engagement tenu." "Impediment" quand ils veulent "risque géré." Ce n'est pas un problème de compétence, c'est un problème de traduction. Quand ton VP ne comprend pas ce que tu dis, il conclut que ce que tu fais n'a pas de valeur. | Prends la dernière phrase que tu as dite en jargon Scrum à ton manager et réécris-la en termes de coût, risque ou délai. Une phrase. Entraîne-toi là-dessus. |
| `mid` | Tu commences à parler le bon langage, mais ce n'est pas réflexe | Tu commences à parler le bon langage, mais ce n'est pas réflexe. Tu alternes entre Scrum et business selon le contexte, et tu te trompes parfois de registre. Ton manager se souvient des moments où tu as dit "vélocité de sprint," pas "prédictibilité de livraison." | Avant ta prochaine réunion avec le management, prépare UNE phrase qui traduit un résultat d'équipe en impact business. Ne l'improvise pas. Prépare-la. |
| `high` | Tu parles le langage des décideurs | Tu parles le langage des décideurs. Rare chez les SMs. La plupart restent enfermés dans le vocabulaire Scrum. Ton management te comprend — ça change tout dans ta capacité à influencer. | Pourrais-tu chiffrer le coût d'une semaine de retard pour ton équipe ? Si oui, tu as un argument qu'un CFO écoute. Si non, c'est ta prochaine étape. |

---

### Dimension 4 — AUTONOMIE (`autonomy`)
**Nom court :** Autonomie  
**Enjeu :** Ton équipe peut-elle fonctionner sans toi ? Une équipe dépendante signifie que tu n'as pas fait ton vrai travail — tu es devenu un goulot.

#### Questions

**Q13.** "Si tu es en vacances 2 semaines, que se passe-t-il ?"
- `2` — L'équipe tourne — et je peux expliquer comment j'ai construit ça
- `1` — Ça ralentit. Certaines choses tombent
- `0` — Les événements sautent ou il faut un back-up

**Q14.** "As-tu formé un membre de l'équipe à faciliter un événement Scrum ?"
- `2` — Oui — et cette personne l'a déjà fait sans moi
- `1` — J'ai commencé, mais c'est pas encore ancré
- `0` — Non — je facilite tout

**Q15.** "Les membres de l'équipe résolvent-ils des problèmes entre eux sans passer par toi ?"
- `2` — Oui, c'est la norme — j'ai activement construit ça
- `1` — Ça arrive, mais ils viennent souvent me chercher
- `0` — Non, je suis le point de passage par défaut

**Q16.** "As-tu expliqué à ton management comment tu as construit l'autonomie de ton équipe ?"
- `2` — Oui, j'ai raconté l'histoire et les étapes
- `1` — Non, mais je pourrais si on me le demandait
- `0` — Non, et je ne saurais pas comment le formuler

#### Diagnostics

| Niveau | Titre | Texte | Action |
|---|---|---|---|
| `low` | Ton équipe dépend de toi | Ton équipe dépend de toi. Si tu pars, les événements sautent, les problèmes s'accumulent, personne ne prend le relais. Rassurant à court terme — tu te sens utile. Mais une équipe dépendante, c'est un SM qui n'a pas fait son travail. Le management te voit comme un goulot. | Choisis UN événement Scrum cette semaine et demande à quelqu'un de l'équipe de faciliter. Tu observes. |
| `mid` | Ton équipe se gère en grande partie, mais c'est fragile | Ton équipe se gère en grande partie sans toi, mais c'est fragile. Les réflexes ne sont pas ancrés. Ça fonctionne parce que tu es le filet de sécurité. Le piège : l'équipe fonctionne, personne ne sait que c'est grâce à toi. Et si personne ne le sait, tu es remplaçable. | Identifie une chose que ton équipe fait maintenant qu'elle ne faisait pas il y a 6 mois. Formule-la en une phrase. C'est le début de ton narratif d'autonomie. |
| `high` | Ton équipe est autonome et tu peux l'expliquer | Ton équipe est autonome et tu peux expliquer pourquoi. Tu as construit quelque chose qui tourne, et tu peux le prouver. Maintenant ne te repose pas dessus. L'autonomie nécessite de la maintenance. | As-tu documenté le parcours ? "L'équipe était à X, elle est maintenant à Y, voici ce que j'ai fait." Si cette histoire existe quelque part, tu as un actif. Si elle est juste dans ta tête, elle est invisible. |

---

### Dimension 5 — STRATÉGIQUE (`strategic`)
**Nom court :** Stratégique  
**Enjeu :** Es-tu vu comme un levier business ou un coût opérationnel ? Le positionnement détermine si tu es protégé ou coupé.

#### Questions

**Q17.** "Si ton manager devait justifier ton rôle à un directeur qui décide des coupes budgétaires, que dirait-il ?"
- `2` — Il citerait des résultats concrets ou des risques que tu as évités
- `1` — Il dirait que tu fais du bon travail, sans donner de chiffre ou d'exemple précis
- `0` — Il décrirait ton rôle — facilitation, cérémonies Scrum — sans le relier à un résultat

**Q18.** "Quand des décisions stratégiques se prennent dans ton département (roadmap, budget, reorg), quand es-tu dans la boucle ?"
- `2` — Avant la décision — on me consulte
- `1` — Après la décision — je suis informé en même temps que tout le monde
- `0` — Je l'apprends par accident ou trop tard

**Q19.** "As-tu un objectif de performance lié à un résultat business ? (pas 'faciliter les retros' — un résultat)"
- `2` — Oui, clairement défini
- `1` — C'est vague ou implicite
- `0` — Non, je n'ai pas d'objectif mesurable

**Q20.** "Si ton poste disparaissait demain, quelle serait la réaction dans ton organisation ?"
- `2` — On mesurerait une perte concrète — une livraison ralentie, un risque non géré
- `1` — On sentirait un vide, mais personne ne pourrait le chiffrer
- `0` — Ça passerait probablement inaperçu — quelqu'un absorberait le rôle rapidement

#### Diagnostics

| Niveau | Titre | Texte | Action |
|---|---|---|---|
| `low` | Tu es perçu comme facilitateur de cérémonies | Tu es vu comme un facilitateur de cérémonies. Ton manager te décrit comme "celui qui fait tourner les rituels Scrum," tu n'es pas consulté avant les décisions, et tu n'as pas d'objectif lié à un résultat business. Position la plus exposée. Pour les décideurs, tu es un coût opérationnel. Le coût opérationnel se coupe. | Demande à ton manager un objectif mesurable pour le prochain trimestre. Pas "améliorer l'agilité de l'équipe." Un résultat : réduire les retards, améliorer la prédictibilité. Si ton manager ne sait pas quoi te donner, c'est un signal. |
| `mid` | Utile mais pas essentiel — la zone grise | Tu es sorti de la case "animateur de réunions," mais tu n'es pas dans la salle quand les vraies décisions se prennent. Zone grise. Utile mais pas essentiel. Cette zone est confortable — c'est exactement là où la hache tombe en premier. Personne ne te cible, mais personne ne te protège non plus. | Demande à ton manager quelles décisions stratégiques arrivent qui affectent ton équipe (roadmap, reorg, changements de priorité). Puis offre-lui une perspective appuyée sur des données avant la décision. Juste poser la question change ton positionnement. |
| `high` | Le management te consulte et te défend en termes de résultats | Le management te consulte, tu as des objectifs mesurables, et on parle de toi en termes de résultats. Ce n'est pas un rôle que les gens remettent en question. C'est une personne que les gens veulent garder. | Pourrais-tu former un autre SM à atteindre ce positionnement ? Si oui, tu passes de SM irremplaçable à leader qui multiplie l'impact. |

---

## 6. RÉSULTATS GLOBAUX

### Catégorie : Vulnérable (0–44 %)
> "La question n'est pas de savoir si tu mérites ce rôle. La question est de savoir si quelqu'un dans ta direction pourrait le défendre si on lui posait la question demain."
>
> "Avec ce score, probablement pas."
>
> "Les rôles agiles supprimés chez Capital One n'étaient pas nécessairement moins bons que leurs pairs. Ils étaient moins défendables. C'est différent."
>
> "La matière est souvent là. C'est la traduction qui manque."
>
> "Tes diagnostics ci-dessous montrent où tu es exposé."

### Catégorie : Stable (45–74 %)
> "Tu n'es pas en danger immédiat. Ton profil est assez solide pour survivre aux décisions de routine."
>
> "Sauf que 'stable' a une date de péremption. Quand une réorg arrive ou qu'un directeur change, quelqu'un doit défendre ton rôle en 5 minutes à quelqu'un qui ne te connaît pas."
>
> "Ton score dit qu'il y a des endroits où cette défense ne tiendra pas. Tes diagnostics ci-dessous montrent lesquels."

### Catégorie : Irremplaçable (75–100 %)
> "La plupart des SMs qui passent ce test n'arrivent pas ici. Ce score dit que tu as construit quelque chose de difficile à couper."
>
> "Ça nécessite de la maintenance. Ce qui te rend irremplaçable aujourd'hui ne le reste pas automatiquement. Les contextes changent, les directions changent."
>
> "Regarde le détail quand même. Il y a souvent un angle mort même à ce niveau. Le genre de faille qui ne se voit pas jusqu'à ce qu'on la cherche activement."

---

## 7. ARCHITECTURE TECHNIQUE

### Stack

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite 5 (JavaScript, pas TypeScript) |
| Backend | Vercel Functions (serverless) |
| Styling | CSS 100% inline via design tokens (objet `T`) |
| Charts | Recharts 2.x (RadarChart) |
| Fonts | DM Sans via Google Fonts |
| Analytics | Google Apps Script webhook (sendBeacon) |
| Email / CRM | Ghost Admin API (JWT HS256) |
| Hébergement | Vercel |

### Structure de fichiers

```
/
├── src/
│   ├── main.jsx                        # Point d'entrée React
│   ├── sm-survival-score.jsx           # Tout : données, logique, composants, styles
│   └── sm-survival-score.test.js       # Tests unitaires logique de scoring
├── api/
│   ├── subscribe.js                    # Vercel Function : POST email → Ghost Admin API
│   └── subscribe.test.js               # 27 tests unitaires Ghost API + JWT
├── tests/
│   └── e2e/
│       └── subscription.spec.js        # 8 tests Playwright E2E
├── index.html                          # Shell HTML (lang="fr", meta SEO)
├── vite.config.js
├── playwright.config.js
├── package.json
├── .env.example                        # Variables requises : GHOST_ADMIN_API_KEY, GHOST_URL
├── CLAUDE.md                           # Instructions IA
├── PRD.md                              # Ce document
├── README.md
├── CHANGELOG.md
└── ARCHITECTURE.md
```

### Décisions architecturales clés

1. **Fichier unique** — `sm-survival-score.jsx` contient tout. Pas de split en sous-composants. Facilite l'audit et élimine les imports croisés.
2. **Zéro routing** — Navigation par état `screen` : `landing` / `quiz` / `result`.
3. **Zéro base de données** — Toutes les données sont statiques dans le code source.
4. **Scoring pur** — Fonctions de scoring exportées, testables sans React.
5. **Styles inline** — Objet `T` centralisé comme design system minimaliste. Pas de fichier CSS séparé, pas de Tailwind.

### Ordre des sections dans `sm-survival-score.jsx`

1. `DATA` — DIMENSIONS, QUESTIONS, GLOBAL_RESULTS, DIAGNOSTICS
2. `CONSTANTS` — MAX_SCORE, SCORE_THRESHOLDS, SCREEN enum
3. `SCORING UTILITIES` — fonctions pures exportées
4. `ANALYTICS` — trackEvent (fire-and-forget via sendBeacon)
5. `DESIGN TOKENS` — objet T
6. `GLOBAL STYLES` — StyleProvider
7. `COMPONENTS` — BentoCard, DiagnosticCard, LockedDiagnosticCard, ProgressBar, GhostSignupForm, UnlockModal
8. `SCREENS` — LandingScreen, QuestionScreen, ResultScreen
9. `APP ROOT` — SMSurvivalScore (export default)

---

## 8. DESIGN TOKENS

```javascript
const T = {
  // Couleurs brand
  vert:       "#006946",   // Vert primaire
  vertDark:   "#004d34",   // Vert foncé (texte CTA sur jaune)
  vertLight:  "#e6f5ef",   // Teinte verte légère
  jaune:      "#FFF200",   // Jaune accent (CTAs)
  jauneMuted: "#e6d900",   // Jaune assourdi
  creme:      "#FBF3EB",   // Crème (fond page)
  cremeDeep:  "#f0e6d9",   // Crème profond (bordures)
  white:      "#ffffff",

  // Texte
  text:       "#1a1a1a",   // Principal
  textMid:    "#4a4a4a",   // Secondaire
  textMuted:  "#7a7a7a",   // Tertiaire
  textLight:  "#a3a3a3",   // Désactivé

  // Bordures
  border:      "#e8ddd1",
  borderLight: "#f0e8de",

  // Rayons
  r:    16,   // Défaut
  rLg:  20,   // Grand (BentoCard)
  rSm:  10,   // Petit (badges)

  // Typographie
  f: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};
```

---

## 9. COMPOSANTS

### `BentoCard`
Wrapper partagé pour toutes les cartes. Props : `children`, `style`, `...props`. Border-radius 20px, fond blanc, bordure légère. Accepte un merge de style via prop.

### `DiagnosticCard`
- Props : `dimension` (objet enrichi avec scores, niveau, texte), `index` (stagger animation)
- Layout : header (nom + badge niveau) + texte diagnostic + boîte action
- Animation : fadeUp avec délai `index × 0.06s`
- Bordure gauche colorée (couleur de catégorie)

### `LockedDiagnosticCard`
- Version floue de DiagnosticCard
- Overlay semi-transparent
- Bouton "Déverrouiller" → scroll vers formulaire email

### `ProgressBar`
- 20 segments (5 groupes de 4)
- Couleurs : complété = vert, courant = jaune, futur = crème
- Transitions douces
- ARIA : role="progressbar", valuenow, min/max

### `GhostSignupForm`
- Props : `onSuccess(email)` — callback après inscription réussie
- État interne : `email` (string), `status` ("idle" | "submitting" | "error")
- Comportement : `POST /api/subscribe { email }` ; fire `diagnostics_unlocked` sur succès ; appelle `onSuccess(email)` pour passer l'email au modal
- Validation email côté client avant envoi (regex : présence @ et .)
- Affiche message d'erreur en cas de réponse non-OK

### `UnlockModal`
- Props : `email` (string — affiché dans le modal), `onClose` (callback)
- `role="dialog"` pour l'accessibilité ; fermeture via fond sombre ou bouton
- Bouton PDF : `flushSync(() => onClose())` puis `window.print()` → dialog impression natif (zéro dépendance)
- Bouton "Voir mes résultats" → `onClose()`

### `StyleProvider`
- Injecte CSS global via `<style>` au mount
- Guard contre injection multiple (`stylesInjected`)
- Contient : import DM Sans, reset CSS, keyframes fadeUp/fadeIn/scaleIn, prefers-reduced-motion, `@media print` (masque UI, affiche résultats)

---

## 10. HOOKS

Aucun hook custom. `useKitFormUnlock` supprimé en v1.4.0 (migration ConvertKit → Ghost Admin API).

---

## 11. ANALYTICS

### Endpoint
Google Apps Script webhook (fire-and-forget via `navigator.sendBeacon`, fallback `fetch` avec `keepalive: true`).

### Événements trackés

| Événement | Déclencheur | Payload |
|---|---|---|
| `quiz_started` | Clic CTA landing | `{ timestamp, event }` |
| `quiz_completed` | Mount ResultScreen (1 fois) | `{ timestamp, event, score_global, category, weakest_dim, visibility, proof, business, autonomy, strategic }` |
| `quiz_abandoned` | `visibilitychange` ou `pagehide` pendant quiz | `{ timestamp, event, questionIndex, questionNumber, dimension, answersGiven }` |
| `diagnostics_unlocked` | Succès formulaire email (GhostSignupForm) | `{ timestamp, event }` |

### Règle de non-blocage
Analytics toujours dans `try/catch` silent. Une erreur analytics ne peut pas casser l'app.

---

## 12. INTÉGRATION EMAIL (Ghost Admin API)

### Architecture

Couche unique — serverless function côté serveur uniquement (pas d'embed client).

**Flux :**
```
GhostSignupForm (client)
  └─ POST /api/subscribe { email }
       └─ Validation email (regex)
            └─ createGhostToken(GHOST_ADMIN_API_KEY)  ← JWT HS256, expiry 5min
                 └─ Ghost Admin API POST /members/
                      ├─ 201 (créé) ou 409 (doublon) → 200 { success: true }
                      └─ 422 / 5xx → proxy du code d'erreur { error: "..." }
```

**Authentification JWT HS256 :**
- Clé splitée : `GHOST_ADMIN_API_KEY = "id:hex_secret"`
- Header : `{ alg: "HS256", typ: "JWT", kid: <id> }`
- Payload : `{ aud: "/ghost/api/admin/", iat: now, exp: now+300s }`
- Signature : HMAC-SHA256, Node.js `crypto` natif (zéro dépendance)

**Label membre :** Chaque inscription reçoit le label "SM Score" dans Ghost.

**409 traité comme succès :** Un email déjà membre Ghost retourne quand même `{ success: true }` — pas d'erreur affichée à l'utilisateur.

### Variables d'environnement requises

| Variable | Usage |
|---|---|
| `GHOST_ADMIN_API_KEY` | Auth Ghost (format `id:hex_secret`, via Ghost admin → Integrations) |
| `GHOST_URL` | URL du site Ghost (ex: `https://your-ghost.ghost.io`) |

Ces variables sont **serveur uniquement** (Vercel Functions). Non exposées au client.

---

## 13. ÉCRANS

### LandingScreen

**Layout :** Pleine hauteur, fond vert `#006946`, centré, animation fadeUp 0.5s.

**Contenu (dans l'ordre) :**
1. Badge "Diagnostic gratuit" (jaune border, uppercase)
2. H1 : "Ton rôle est en danger. Tu ne sais pas encore où."
3. Sous-titre : "20 questions · 5 min · Score sur 5 dimensions"
4. Corps : contexte (Capital One, ScrumAlliance, outils automatisant 85 % des tâches SM)
5. CTA : "Voir mes angles morts" (fond jaune, texte vert foncé)
6. Footer : "Gratuit · Sans inscription · Résultat immédiat"

**Interaction :** Clic CTA → fire `quiz_started` → navigate `quiz`.

---

### QuestionScreen

**Layout :** Pleine hauteur, fond crème, header sticky vert, nav sticky bas.

**Header sticky :**
- Gauche : nom de dimension (jaune, uppercase, 12px)
- Droite : compteur question `N/20`
- Dessous : ProgressBar

**Zone centrale :**
- H2 : texte question (18–22px clampé, line-height 1.5)
- 3 boutons réponse (radiogroup)
  - Non sélectionné : fond blanc, texte sombre, bordure claire
  - Sélectionné : fond vert, texte blanc, gras
  - Cible tactile min 56px hauteur

**Navigation sticky bas :**
- "Précédent" (désactivé Q1)
- "Suivant" / "Voir mon résultat" (désactivé si pas de réponse, label change à Q20)

**Clavier :**
- Flèche bas/droite : option suivante (cycle)
- Flèche haut/gauche : option précédente (cycle)

---

### ResultScreen

**Layout :** Pleine hauteur + scroll, fond crème.

**Hero (fond vert) :**
- "Ton score" (muted)
- Chiffre score (64–96px clampé, 900 weight, animation scaleIn)
- Badge catégorie (jaune, texte vert)

**Contenu principal (max-width 600px) :**
1. Carte résultat global (texte par catégorie)
2. Grille bento 2 colonnes :
   - Radar chart (Recharts, 5 axes, 260px)
   - Scores par dimension (barres de progression animées)
3. Section diagnostics (triés par score croissant)
   - Dimension la plus faible : toujours visible
   - Dimensions 2–5 : verrouillées si non unlocked
4. Formulaire unlock email (si non unlocked)
5. Alerte confirmation (si unlocked)
6. Boutons action : "Envoie le test à un collègue SM" + "Refaire le test"
7. Footer Collaboration Solved

**Partage :**
- Web Share API (fallback clipboard)
- Texte : "Je viens de faire un diagnostic sur la solidité de mon rôle de Scrum Master. 20 questions, 5 minutes, et des pistes d'action que j'aurais aimé avoir avant → https://dub.sh/sm-survival-score"

---

## 14. FONCTIONS SCORING EXPORTÉES

```javascript
computeDimensionScores(answers, questions, dimensions)  // → { [dimId]: number }
computeGlobalScore(dimensionScores)                      // → number (0-100)
getCategory(percentage)                                   // → { key, label, color, bg }
getDiagnosticLevel(score)                                 // → "low" | "mid" | "high"
buildDimensionResults(dimensionScores, dimensions)        // → enriched array
isValidEmail(email)                                       // → boolean
saveQuizState(state)                                      // → void (localStorage)
loadQuizState()                                           // → object | null
clearQuizState()                                          // → void
```

> `buildAbandonPayload` est une fonction interne (non exportée) utilisée par la logique analytics. Elle est mirrorée dans les tests mais ne fait pas partie de l'API publique du module.

---

## 15. ACCESSIBILITÉ

| Feature | Implémentation |
|---|---|
| Hiérarchie sémantique | H1 > H2 > H3 > H4 |
| Rôles ARIA | `radiogroup`, `radio`, `progressbar`, `meter`, `article`, `region`, `alert`, `img` |
| Labels ARIA | Tous éléments interactifs et visualisations |
| Navigation clavier | Flèches pour réponses, Tab pour focus |
| Focus visible | 2px outline + shadow `#006946` |
| Reduced motion | Media query, toutes animations → 0.01ms |
| Cibles tactiles | 48px min hauteur boutons |
| Contraste | WCAG AA vérifié sur toutes combinaisons bg/text |

---

## 16. TESTS

### Fichiers
- `src/sm-survival-score.test.js` — logique de scoring, données, wording, storage, migration
- `api/subscribe.test.js` — Ghost API, JWT, validation (27 assertions)
- `tests/e2e/subscription.spec.js` — flows utilisateur complets (8 scénarios Playwright)

### Couverture `sm-survival-score.test.js`

**Intégrité des données :**
- 5 dimensions, 20 questions, 4 questions/dimension, 3 réponses/question (scores 2/1/0)

**Scoring :**
- Cas max, min, middle, mixte, partiels (null), index invalides
- Seuils de catégorie exacts (44/45, 74/75)
- Niveaux de diagnostic (low/mid/high, frontières 3/4 et 5/6)
- Arrondi mathématique du score global
- buildDimensionResults (métadonnées préservées, pct calculés)

**Personas :** Vulnérable (all-worst), Stable (all-middle), Irremplaçable mixte (fort partout sauf une dimension)

**buildAbandonPayload :** Retourne null hors quiz, payload complet sur quiz, dimension et answersGiven corrects

**Wording v1.2 :** 25 strings nouvelles présentes, 24 anciennes absentes

**Wording v1.3 :** 9 textes globaux (catégories Vulnérable/Stable/Irremplaçable) mis à jour

**Storage utilities :** 10 tests (round-trip, corruption, reset, validation stricte des valeurs)

**Modal + migration Kit→Ghost :** Textes du modal présents, ancienne bannière absente, embed Kit supprimé, GhostSignupForm présent

### Couverture `api/subscribe.test.js` (27 assertions)

- Méthodes non-POST → 405
- Email invalide (absent, vide, sans @) → 400
- Vars env manquantes → 500
- Ghost 201 et 409 → 200 `{ success: true }`
- Ghost 422 → proxy 422 ; fetch throw → 500
- createGhostToken : structure JWT, alg HS256, kid, aud `/ghost/api/admin/`, iat/exp

### Couverture `subscription.spec.js` (8 scénarios E2E Playwright)

- Formulaire visible sur écran résultat
- Unlock des diagnostics après succès API (200)
- Erreur client sur email invalide
- Erreur affichée sur réponse API 500
- 409 (membre existant) traité comme succès
- Modal apparaît avec titre "Diagnostics déverrouillés"
- Modal affiche l'email soumis
- Fermeture modal révèle les diagnostics

### Runner
Node.js vanilla pour tests unitaires — zéro dépendance de test externe. Intentionnel.  
Playwright (`@playwright/test`) pour les tests E2E — lance le serveur de dev Vite.

---

## 17. DÉPLOIEMENT

| Élément | Valeur |
|---|---|
| Plateforme | Vercel |
| Build | `vite build` → `dist/` |
| Frontend | Static hosting (Vercel) |
| API | Vercel Functions (`api/*.js`) |
| Secrets | Panel Vercel uniquement (jamais dans le code) |
| URL prod | https://dub.sh/sm-survival-score |

### Variables d'environnement (`.env.example`)
```
GHOST_ADMIN_API_KEY=your_ghost_id:your_ghost_hex_secret
GHOST_URL=https://your-site.ghost.io
```

---

## 18. CONTRAINTES NON-NÉGOCIABLES

1. **Pas de bibliothèque sans discussion préalable.** Libs approuvées : react, react-dom, recharts, vite, @vitejs/plugin-react.
2. **Pas de TypeScript.** Le projet est JavaScript uniquement.
3. **Un seul fichier composant.** Pas de split.
4. **Zéro secret dans le code.** Toujours via `process.env`.
5. **Pas de `console.log` en production.**
6. **Pas de `TODO` / `FIXME` dans le code commité.**

---

## 19. CHANGELOG (résumé)

| Version | Date | Changements |
|---|---|---|
| v1.5.0 | 2026-05-23 | UnlockModal post-inscription, PDF via `window.print()`, 3 nouveaux tests E2E Playwright |
| v1.4.0 | 2026-05-23 | Migration email ConvertKit → Ghost Admin API (JWT HS256), 27 tests unitaires Ghost |
| v1.3.0 | 2026-05-23 | Persistance localStorage (saveQuizState/loadQuizState/clearQuizState), 10 tests storage |
| v1.2.0 | 2026-05-11 | Ajustement seuils de catégorie (vulnérable <45%, stable 45–74%, irremplaçable ≥75%) |
| v1.1.0 | 2026-05-11 | Reformulation de 14 questions pour clarté et impact (wording v1.2) |
| v1.0.0 | 2025-05-10 | Lancement MVP production |

---

## 20. RÉFÉRENCES

- `CLAUDE.md` — Instructions IA et règles de développement
- `ARCHITECTURE.md` — Détail technique (flux, composants, API)
- `CHANGELOG.md` — Historique complet des versions
- `README.md` — Guide de démarrage et déploiement
- `.env.example` — Variables d'environnement requises
