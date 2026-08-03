import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PROBE_SOURCE, FOCUS_PROBE_SOURCE } from "./a11y-probe.js";

// Gate d'accessibilité de l'écran résultat.
//
// Il existe parce que trois correctifs successifs ont régressé de la même façon : la paire
// couleur/surface réparée était vérifiée, la voisine jamais. Les tests unitaires lisent la
// source et ne voient donc ni l'héritage, ni la composition alpha, ni la surface réelle.
// Ce spec mesure le rendu, sur toutes les combinaisons état × largeur.
//
// Il DOIT échouer tant que PR 2 n'a pas corrigé ce qu'il signale. C'est l'inventaire du travail.

const STATE_KEY = "sm-survival-score-state";

// index 0 = meilleure réponse, 2 = pire. fill(0) → 100, fill(1) → 50, fill(2) → 0.
const BANDS = {
  irremplacable: Array(20).fill(0),
  stable: Array(20).fill(1),
  vulnerable: Array(20).fill(2),
  // Profil inégal : sans lui l'ordre de priorité est dégénéré et on ne teste qu'un seul cas.
  mixte: [0, 0, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 2, 1, 0, 2, 2, 1, 0],
};

const VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } };

async function gotoResult(page, answers) {
  await page.goto("/");
  await page.evaluate(
    ([key, a]) => localStorage.setItem(key, JSON.stringify({ answers: a, currentQ: 19, screen: "result" })),
    [STATE_KEY, answers]
  );
  await page.reload();
  await page.waitForSelector("h1");
  // Recharts mesure son conteneur avant de peindre ; sans ça on sonde un bloc vide.
  await page.waitForTimeout(400);
}

async function unlock(page) {
  await page.route("**/api/subscribe", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' })
  );
  await page.locator("#unlock-form input[type=email]").fill("gate@example.com");
  await page.getByRole("button", { name: "Déverrouiller", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

const probe = (page) => page.evaluate(PROBE_SOURCE);

function report(violations) {
  const byType = violations.reduce((acc, v) => {
    (acc[v.type] ??= []).push(v);
    return acc;
  }, {});
  return Object.entries(byType)
    .map(([type, list]) => {
      const lines = list.map((v) => {
        const { type: _t, element, tag, ...rest } = v;
        return `    • [${tag}] "${element}" — ${JSON.stringify(rest)}`;
      });
      return `  ${type} (${list.length}):\n${lines.join("\n")}`;
    })
    .join("\n");
}

for (const [bandName, answers] of Object.entries(BANDS)) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    test(`a11y — ${bandName} / ${vpName} / verrouillé`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoResult(page, answers);
      const violations = await probe(page);
      expect(violations, `\n${report(violations)}\n`).toEqual([]);
    });
  }
}

test("a11y — déverrouillé (5 diagnostics ouverts)", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await gotoResult(page, BANDS.mixte);
  await unlock(page);
  await page.getByRole("button", { name: "Fermer" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const violations = await probe(page);
  expect(violations, `\n${report(violations)}\n`).toEqual([]);
});

test("a11y — modal de déverrouillage", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await gotoResult(page, BANDS.stable);
  await unlock(page);
  await page.evaluate(() => document.querySelector('[role="dialog"]')?.setAttribute("data-a11y-scope", ""));
  const violations = await probe(page);
  expect(violations, `\n${report(violations)}\n`).toEqual([]);
});

test("a11y — chaque élément focusable a un anneau visible sur SA surface", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop);
  await gotoResult(page, BANDS.mixte);

  const handles = await page.locator("button, a[href], input").elementHandles();
  const bad = [];
  for (const h of handles) {
    if (!(await h.isVisible())) continue;
    await h.focus();
    const r = await page.evaluate(
      ({ src, el }) => new Function("return " + src)()(el),
      { src: FOCUS_PROBE_SOURCE, el: h }
    );
    // 3:1 contre sa propre surface — c'est le seuil que l'anneau blanc-sur-blanc rate.
    if (!r.indicator || r.ratio < 3) bad.push(r);
  }
  expect(bad, `\nAnneaux de focus insuffisants:\n${bad.map((b) => `    • [${b.tag}] "${b.label}" — indicateur=${b.indicator ?? "AUCUN"} ratio=${b.ratio} sur ${b.surface}\n`).join("")}`).toEqual([]);
});

test("axe — écran résultat (verrouillé et déverrouillé)", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop);
  await gotoResult(page, BANDS.mixte);

  const locked = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(
    locked.violations,
    `\n${locked.violations.map((v) => `  ${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).join("\n    ")}`).join("\n")}\n`
  ).toEqual([]);

  await unlock(page);
  await page.getByRole("button", { name: "Fermer" }).click();
  const unlocked = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(
    unlocked.violations,
    `\n${unlocked.violations.map((v) => `  ${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).join("\n    ")}`).join("\n")}\n`
  ).toEqual([]);
});
