# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Scrum Master en poste, 2–8 ans d'expérience, francophone. Inquiet de la stabilité de son rôle dans un contexte de réduction d'effectifs ou de réorganisation. Cherche à se positionner stratégiquement, pas à apprendre les bases du Scrum ; connaît le vocabulaire agile mais sent qu'il ne résonne pas avec le management. Usage solo, desktop ou mobile, session unique d'environ 5 minutes. Motivation : curiosité + anxiété légère sur la solidité de son poste.

## Product Purpose

Diagnostic interactif (20 questions) qui mesure la « défendabilité » du rôle d'un Scrum Master sur 5 dimensions (visibilité, preuves, business, autonomie, stratégique). Livre un score global, un profil radar, des diagnostics par dimension et un plan d'action personnalisé. Sert aussi d'aimant à emails qualifiés pour Collaboration Solved (conseil de Pierre-Cyril Denant) — l'acquisition d'emails est un objectif produit explicite, pas un effet secondaire.

## Positioning

Le problème n'est pas la compétence du Scrum Master, c'est la défensibilité de son rôle face au management. « La matière est souvent là ; c'est la traduction qui manque. » Se distingue des quiz de carrière génériques par un scoring rigoureux et transparent (5 dimensions × 4 questions, seuils précis, sourcé par des faits vérifiables — Capital One, ScrumAlliance), des diagnostics actionnables plutôt qu'un simple score, et un ton direct/cash sans langue de bois corporate. Ce ton est un choix de marque assumé, à pousser davantage plutôt qu'à adoucir (validé par le fondateur suite à un audit Purple Cow — le safe middle est le principal risque d'invisibilité du produit).

## Operating Context

Usage solo, desktop ou mobile, session unique d'environ 5 minutes. Découverte via partage LinkedIn/réseau agile, lien direct (dub.sh/sm-survival-score), ou recommandation d'un collègue SM. Funnel : Landing → Quiz (20 questions, linéaire, navigation avant/arrière) → Résultat (score et catégorie visibles immédiatement, sans barrière) → email pour débloquer les 4 diagnostics restants → PDF téléchargeable. Zéro routing, navigation par état applicatif.

## Capabilities and Constraints

React 18 + Vite 5, JavaScript (pas TypeScript). Fichier composant unique (`src/sm-survival-score.jsx`) — pas de split en sous-composants. Zéro base de données, toutes les données sont statiques dans le code source. Styles 100 % inline via un objet de design tokens centralisé (`T`) — pas de fichier CSS séparé, pas de Tailwind. Zéro nouvelle dépendance npm sans discussion préalable ; libs approuvées : `react`, `react-dom`, `recharts`, `vite`, `@vitejs/plugin-react` — `html2canvas` et `jsPDF` sont déjà en place via import dynamique pour la génération du PDF existante. Email/CRM via Ghost Admin API (JWT HS256, zéro dépendance, `crypto` natif Node). Analytics fire-and-forget via Google Apps Script webhook (`sendBeacon`), jamais bloquant.

## Brand Commitments

Collaboration Solved (Pierre-Cyril Denant). Palette : vert `#006946` (primaire), jaune `#FFF200` (accent CTA), crème `#FBF3EB` (fond). Police DM Sans. Ton de marque : direct, cash, sans jargon corporate — différenciateur assumé du produit, pas une aspérité à limer.

## Evidence on Hand

Statistiques citées dans le produit et sourcées : 1 100 rôles agiles supprimés chez Capital One ; 18 % des Scrum Masters touchés par des licenciements depuis 2022 (ScrumAlliance) ; outils de gestion de projet automatisant 85 % des tâches perçues du SM. Aucun témoignage client ni étude de cas disponible — ne pas en inventer.

## Product Principles

1. La défensibilité prime sur la compétence — le produit mesure et enseigne à traduire la valeur, pas à juger le talent.
2. Direct plutôt que rassurant — dire la vérité inconfortable plutôt qu'amortir le coup ; c'est l'edge du produit, pas un défaut à corriger.
3. Actionnable avant tout — chaque diagnostic se termine par une action immédiate concrète, jamais un simple constat.
4. Gratuit et sans friction jusqu'à la valeur — le score se voit avant toute barrière email.
5. Un seul fichier, une architecture simple — le produit reste maintenable en solo (composant unique, zéro DB, zéro dépendance superflue).

## Accessibility & Inclusion

WCAG AA vérifié sur toutes les combinaisons fond/texte. Rôles ARIA complets (`radiogroup`, `radio`, `progressbar`, `meter`, `article`, `region`, `alert`, `img`). Navigation clavier (flèches pour les réponses, tab pour le focus). Cibles tactiles ≥ 48px. `prefers-reduced-motion` respecté (animations réduites à 0.01ms).
