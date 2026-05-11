# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionning basé sur [Semantic Versioning](https://semver.org/lang/fr/).

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
