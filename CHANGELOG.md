# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionning basé sur [Semantic Versioning](https://semver.org/lang/fr/).

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
