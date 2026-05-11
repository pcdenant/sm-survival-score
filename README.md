# SM Survival Score

> Diagnostic interactif pour Scrum Masters — 20 questions · 5 minutes · Un score clair

Un outil créé par [Collaboration Solved](https://dub.sh/cs-website) (Pierre-Cyril Denant) pour aider les Scrum Masters à évaluer la solidité de leur rôle face aux réductions d'effectifs.

---

## Pourquoi ce projet

1 100 rôles agile éliminés chez Capital One. Des coupes massives chez Fidelity, dans les banques UK et ailleurs. Les rôles qui survivent ne sont pas les meilleurs — ce sont ceux qui savent **prouver leur valeur**.

Ce diagnostic mesure 5 dimensions clés et donne un plan d'action personnalisé.

---

## Stack

| Couche | Technologie |
|---|---|
| UI | React 18 + Vite 5 |
| Graphiques | Recharts |
| Styles | CSS-in-JS inline (design tokens) |
| API serverless | Vercel Functions |
| Email | Kit (ConvertKit) |
| Analytics | Google Apps Script (webhook) |
| Tests | Node.js vanilla (zéro dépendances) |

---

## Structure

```
/
├── src/
│   ├── main.jsx                  # Point d'entrée React
│   └── sm-survival-score.jsx     # Composant principal + logique métier
├── api/
│   └── subscribe.js              # Serverless function : inscription Kit
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

La suite de tests vérifie la logique de scoring, les frontières de catégories, la validation email, les scénarios personas et l'intégrité du wording des questions.

---

## Variables d'environnement

Copier `.env.example` en `.env` et remplir :

| Variable | Description |
|---|---|
| `KIT_API_KEY` | Clé API Kit (ConvertKit) |
| `KIT_FORM_ID` | ID du formulaire Kit |

Ces variables sont utilisées **uniquement côté serveur** (Vercel Functions). Elles ne sont jamais exposées au client.

---

## Déploiement

Le projet est conçu pour Vercel :
- `npm run build` génère le dossier `dist/`
- Le dossier `api/` est automatiquement déployé comme Vercel Functions

---

## Les 5 dimensions évaluées

| Dimension | Ce qu'elle mesure |
|---|---|
| **Visibilité** | Ton impact est-il connu et reconnu par le management ? |
| **Preuves** | As-tu des données pour démontrer tes résultats ? |
| **Business** | Parles-tu le langage de ceux qui décident ? |
| **Autonomie** | Ton équipe peut-elle fonctionner sans toi ? |
| **Stratégique** | Es-tu perçu comme levier ou comme coût ? |

Chaque dimension est notée sur 8. Le score global est sur 100.

| Score | Catégorie |
|---|---|
| 0 – 44 | Vulnérable |
| 45 – 74 | Stable |
| 75 – 100 | Irremplaçable |

---

## Licence

GPL-3.0 — voir [LICENSE](./LICENSE)
