# Plan d'implémentation — PDF personnalisé post-unlock (P4)

## Contexte

Après l'unlock via email, l'utilisateur reçoit l'email Ghost standard mais n'a aucun document personnel synthétisant son diagnostic. La feature ajoute un téléchargement PDF client-side au moment de l'unlock, avec son score, ses diagnostics ordonnés par priorité, et un CTA Collaboration Solved. Libs approuvées : `jspdf` + `html2canvas`. Nom du fichier : `diagnostic-sm-[score]-[date].pdf`.

---

## Étape 0 — Baseline régression (avant tout changement)

**Actions :**
```bash
npm test           # node src/sm-survival-score.test.js && node api/subscribe.test.js
npm run build      # vérifier que le build passe
```

**Vérifier :** noter le nombre de tests passants. Ce résultat est la référence à ne pas dégrader.

---

## Étape 1 — Dépendances + variables d'environnement

**Fichiers modifiés :** `package.json`, `.env.example`

**Actions :**
- `npm install jspdf html2canvas` → ajoute les deux dans `dependencies`
- Dans `.env.example`, ajouter après les variables Ghost existantes :
  ```
  # CTA PDF — liens Collaboration Solved
  VITE_COLLAB_SOLVED_URL=
  VITE_COLLAB_SOLVED_EMAIL=
  ```

**Vérifier :** `npm run build` passe sans erreur.

---

## Étape 2 — Composant `PDFDocument`

**Fichier modifié :** `src/sm-survival-score.jsx`

**Emplacement :** Section COMPOSANTS, après `LockedDiagnosticCard` (ligne ~468), avant `GhostSignupForm` (ligne ~474).

**Props attendues :**
```javascript
function PDFDocument({
  globalScore,         // number 0-100
  category,            // { key, label, color, bg }
  globalResult,        // { paragraphs: string[] }
  dimensionScores,     // { visibility, proof, business, autonomy, strategic } (0-8)
  dimensionScoresPct,  // { ... } (0-100)
  dimensionResults,    // Array<{ id, name, shortName, diagnostics, score, pct }>
  priorityDimId,       // string
  orderedDimIds,       // string[]
  collabUrl,           // string
  collabEmail,         // string
})
```

**Structure du rendu (5 sections, styles 100% inline, palette T) :**

1. **En-tête** — "Collaboration Solved" + titre + date ISO
2. **Score global** — pourcentage en grand + badge catégorie coloré + paragraphes[0]+[1]
3. **Signal priorité** — fond sombre, `SIGNAL_TEXTS[priorityDimId].title/body` + box action immédiate (`getDiagnosticLevel` + `dimension.diagnostics[level].action`)
4. **Vue d'ensemble** — barre de progression pour chaque dimension dans l'ordre `orderedDimIds`, dimension prioritaire mise en avant
5. **Diagnostics détaillés** — pour chaque dim dans `orderedDimIds` : shortName, score, `diagnostics[level].text`, box action
6. **CTA** — `collabUrl` + `collabEmail` + signature

**Contrainte rendu :** largeur fixe 794px (A4 96dpi). Pas de `ResponsiveContainer` recharts — valeurs directes. Pas de SVG radar (html2canvas capture mal SVG recharts) → barres horizontales simples en CSS.

**Vérifier :** le composant s'affiche visuellement dans un dev snapshot (temporairement rendre dans la page pour vérification visuelle, puis retirer).

---

## Étape 3 — Fonction `generatePDF(pdfProps)`

**Fichier modifié :** `src/sm-survival-score.jsx`

**Emplacement :** Section SCORING UTILITIES (après ligne 156), ou juste avant `PDFDocument`.

**Import à ajouter :** `createRoot` depuis `react-dom/client` (dans les imports existants en tête de fichier).

**Implémentation :**
```javascript
async function generatePDF(pdfProps) {
  const { globalScore } = pdfProps;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `diagnostic-sm-${globalScore}-${dateStr}.pdf`;

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;';
  document.body.appendChild(container);

  const root = createRoot(container);
  flushSync(() => root.render(<PDFDocument {...pdfProps} />));

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123] });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = pageW / canvas.width;
  const imgH = canvas.height * ratio;

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  let heightLeft = imgH;
  let yPos = 0;
  pdf.addImage(imgData, 'JPEG', 0, yPos, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    yPos -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, yPos, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
  root.unmount();
  document.body.removeChild(container);
}
```

**Notes :**
- Import dynamique de `html2canvas` et `jspdf` (tree-shaking, chargement lazy)
- `flushSync` garantit le rendu synchrone avant html2canvas
- Format PDF `[794, 1123]` = A4 en pixels à 96dpi
- Pagination automatique si contenu dépasse une page

**Vérifier :** appeler `generatePDF(mockPdfProps)` depuis la console en dev et télécharger le PDF. Vérifier le nom de fichier et le contenu.

---

## Étape 4 — Mise à jour `UnlockModal` + `ResultScreen`

**Fichier modifié :** `src/sm-survival-score.jsx`

### 4a — `UnlockModal` (lignes 514–553)

**Changements :**
- Ajouter `pdfProps` aux props : `function UnlockModal({ email, onClose, pdfProps })`
- Ajouter state `[isGenerating, setIsGenerating]` pour désactiver le bouton pendant la génération
- Remplacer `handlePrint` :
  ```javascript
  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true);
    await generatePDF(pdfProps);
    setIsGenerating(false);
  }, [pdfProps]);
  ```
- Bouton PDF : appelle `handleDownloadPDF`, label `isGenerating ? "Génération..." : "Télécharger mon rapport (PDF)"`, `disabled={isGenerating}`
- Supprimer `flushSync` et `window.print()` et l'import `flushSync` si devenu inutilisé

### 4b — `ResultScreen` (lignes 674–812)

**Changements :**
- Construire `pdfProps` à partir des valeurs déjà calculées :
  ```javascript
  const pdfProps = useMemo(() => ({
    globalScore,
    category,
    globalResult: GLOBAL_RESULTS[category.key],
    dimensionScores,
    dimensionScoresPct,
    dimensionResults,
    priorityDimId,
    orderedDimIds,
    collabUrl: import.meta.env.VITE_COLLAB_SOLVED_URL ?? '',
    collabEmail: import.meta.env.VITE_COLLAB_SOLVED_EMAIL ?? '',
  }), [globalScore, category, dimensionScores, dimensionScoresPct, dimensionResults, priorityDimId, orderedDimIds]);
  ```
- Passer `pdfProps` à `UnlockModal` : `<UnlockModal email={subscribedEmail} onClose={...} pdfProps={pdfProps} />`

**Vérifier :**
1. Modal s'ouvre après soumission email
2. Clic "Télécharger" → spinner "Génération..." → PDF téléchargé → spinner disparaît
3. Clic "Voir mes résultats" → modal se ferme, diagnostics visibles
4. Vérifier que `window.print()` n'est plus appelé nulle part

---

## Étape 5 — Tests

### 5a — Tests unitaires existants

**Vérifier :** `npm test` produit le même résultat qu'en étape 0. Aucun changement au fichier `api/subscribe.test.js` ni à `src/sm-survival-score.test.js`.

### 5b — Tests E2E existants

**Vérifier :** `npm test:e2e` — les 7 tests existants de `tests/e2e/subscription.spec.js` passent. Attention aux sélecteurs : le bouton s'appelait "Télécharger mon plan d'action (PDF)" et s'appelle maintenant "Télécharger mon rapport (PDF)". Mettre à jour les sélecteurs dans les tests existants si besoin.

### 5c — Nouveau test E2E à ajouter dans `tests/e2e/subscription.spec.js`

```javascript
test('clicking PDF button triggers a file download', async ({ page }) => {
  await page.route('/api/subscribe', route => route.fulfill({ status: 200 }));
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.getByRole('button', { name: 'Déverrouiller', exact: true }).click();
  
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Télécharger mon rapport/ }).click();
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toMatch(/^diagnostic-sm-\d+-\d{4}-\d{2}-\d{2}\.pdf$/);
});
```

**Note :** Ce test nécessite que la page supporte le download event. Si html2canvas/jsPDF ne déclenchent pas l'événement `download` dans Playwright headless, utiliser `page.on('download', ...)` ou vérifier que le bouton est cliquable et ne produit pas d'erreur.

---

## Étape 6 — Documentation

**3 fichiers à mettre à jour :**

### `CHANGELOG.md`
Ajouter une entrée :
```
## [1.7.0] - 2026-06-14
### Added
- PDF personnalisé post-unlock : téléchargement client-side (jsPDF + html2canvas)
  - Score global, badge catégorie, signal priorité, 5 diagnostics ordonnés, CTA Collaboration Solved
  - Nom de fichier : diagnostic-sm-[score]-[date].pdf
```

### `ARCHITECTURE.md`
- Mettre à jour la section dépendances : ajouter `jspdf` et `html2canvas`
- Mettre à jour le flux UnlockModal : `window.print()` → `generatePDF()`
- Ajouter les 2 nouvelles variables d'env `VITE_COLLAB_SOLVED_URL` + `VITE_COLLAB_SOLVED_EMAIL`

### `CLAUDE.md`
- Dans le tableau "Libs approuvées" (section 6), ajouter :
  ```
  | PDF client-side | jspdf + html2canvas |
  ```
- Mettre à jour la liste "Libs actuellement installées"
- Mettre à jour la date en bas : *Updated: 2026-06-14*

---

## Ordre d'exécution

```
0. [Baseline] npm test + npm run build            → vérifier : résultats de référence
1. [Deps]     npm install jspdf html2canvas        → vérifier : npm run build OK
              .env.example mis à jour
2. [Composant] PDFDocument ajouté                  → vérifier : rendu visuel en dev
3. [Fonction]  generatePDF() ajoutée               → vérifier : PDF téléchargé depuis console
4. [Wire]      UnlockModal + ResultScreen mis à jour → vérifier : flux unlock complet
5. [Tests]     npm test (unitaires inchangés)      → vérifier : même résultat qu'étape 0
               npm test:e2e (7 existants + 1 nouveau) → vérifier : tout vert
6. [Docs]      CHANGELOG + ARCHITECTURE + CLAUDE.md mis à jour
```

---

## Fichiers modifiés (synthèse)

| Fichier | Changement |
|---|---|
| `package.json` | + `jspdf` + `html2canvas` dans `dependencies` |
| `.env.example` | + `VITE_COLLAB_SOLVED_URL` + `VITE_COLLAB_SOLVED_EMAIL` |
| `src/sm-survival-score.jsx` | + import `createRoot` · + `generatePDF()` · + `PDFDocument` · ± `UnlockModal` · ± `ResultScreen` |
| `tests/e2e/subscription.spec.js` | + 1 test PDF download · ± sélecteur bouton si renommé |
| `CHANGELOG.md` | + entrée v1.7.0 |
| `ARCHITECTURE.md` | ± dépendances + flux + env vars |
| `CLAUDE.md` | ± tableau libs + liste installées + date |

**Fichiers non modifiés :** `api/subscribe.js`, `api/subscribe.test.js`, `src/sm-survival-score.test.js`, `index.html`, `vite.config.js`, `playwright.config.js`

---

## Ce qui NE change PAS

- Logique Ghost (`/api/subscribe`) : inchangée
- Flux email : Ghost envoie son email standard, pas de PDF joint
- `@media print` CSS existant : conservé tel quel (suppression = 0 valeur ajoutée)
- Scoring utilities : toutes les fonctions pures restent identiques
- Structure DATA (DIMENSIONS, QUESTIONS, GLOBAL_RESULTS) : inchangée
