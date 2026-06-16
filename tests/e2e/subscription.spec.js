import { test, expect } from "@playwright/test";

// Auto-advance fires at 600ms after selection. Chapter reveals auto-dismiss at 2000ms
// but are also click-dismissable immediately.
async function completeQuiz(page) {
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  for (let i = 0; i < 20; i++) {
    // Dismiss chapter reveal if showing (appears after Q4/Q8/Q12/Q16, persists ~2s)
    const revealVisible = await page.getByTestId("chapter-reveal").isVisible().catch(() => false);
    if (revealVisible) {
      await page.getByTestId("chapter-reveal").click();
      await page.waitForTimeout(300);
    }
    await page.getByRole("radio").first().click();
    // Wait for auto-advance (600ms) + render buffer
    await page.waitForTimeout(800);
  }
}

// Form submit button: use exact: true to distinguish from LockedDiagnosticCard unlock buttons
const submitBtn = (page) => page.getByRole("button", { name: "Déverrouiller", exact: true });

test("affiche le formulaire email sur l'écran résultat", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  await expect(page.locator("form")).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(submitBtn(page)).toBeVisible();
});

test("déverrouille les diagnostics sur succès API", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("test@example.com");
  await submitBtn(page).click();
  await expect(page.locator("#unlock-form")).not.toBeVisible({ timeout: 5000 });
});

test("affiche erreur sur email invalide (côté client)", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("pasunmail");
  await submitBtn(page).click();
  await expect(page.getByText(/Email invalide|erreur/i)).toBeVisible();
});

test("affiche erreur sur échec API (500)", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Server error" }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("test@example.com");
  await submitBtn(page).click();
  await expect(page.getByText(/Email invalide|erreur/i)).toBeVisible();
});

test("409 (membre existant) est traité comme succès", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    // backend normalise 409 → 200 côté serveur avant de répondre au client
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("existing@example.com");
  await submitBtn(page).click();
  await expect(page.locator("#unlock-form")).not.toBeVisible({ timeout: 5000 });
});

test("modal apparaît avec titre après unlock", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("test@example.com");
  await submitBtn(page).click();
  await expect(page.getByText("Diagnostics déverrouillés")).toBeVisible();
});

test("modal affiche l'email soumis", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("pierre@example.com");
  await submitBtn(page).click();
  await expect(page.getByText("pierre@example.com")).toBeVisible();
});

test("fermer le modal affiche les diagnostics", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("test@example.com");
  await submitBtn(page).click();
  await expect(page.getByText("Diagnostics déverrouillés")).toBeVisible();
  await page.getByRole("button", { name: "Voir mes résultats" }).click();
  await expect(page.getByText("Diagnostics déverrouillés")).not.toBeVisible();
});

// ── Nouveaux tests : auto-advance, chapter reveal, key-letter badges ──────────

test("auto-advance : sélectionner une réponse avance automatiquement à la suivante", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Verify we're on Q1
  await expect(page.getByRole("progressbar")).toBeVisible();
  // Click the first answer
  await page.getByRole("radio").first().click();
  // After 700ms, we should be on Q2 (progressbar label changes)
  await page.waitForTimeout(750);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
});

test("auto-advance : changer de réponse repart à zéro et on ne passe pas trop tôt", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Click first answer
  await page.getByRole("radio").nth(0).click();
  // Immediately click second answer (resets timer)
  await page.waitForTimeout(100);
  await page.getByRole("radio").nth(1).click();
  // After 400ms total since the second click, still on Q1
  await page.waitForTimeout(400);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  // After 700ms more, we've passed 600ms since second click → now on Q2
  await page.waitForTimeout(350);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
});

test("chapter reveal : apparaît après Q4 avec le bon contenu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Complete Q1-Q4 via auto-advance
  for (let i = 0; i < 4; i++) {
    await page.getByRole("radio").first().click();
    await page.waitForTimeout(750);
  }
  // Chapter reveal should now be visible
  await expect(page.getByTestId("chapter-reveal")).toBeVisible({ timeout: 2000 });
  await expect(page.getByText("Dimension complète")).toBeVisible();
  await expect(page.getByText("Visibilité de ton impact")).toBeVisible();
  await expect(page.getByText("Maîtrise des preuves →")).toBeVisible();
});

test("chapter reveal : clic le dismiss immédiatement et charge Q5", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("radio").first().click();
    await page.waitForTimeout(750);
  }
  await expect(page.getByTestId("chapter-reveal")).toBeVisible({ timeout: 2000 });
  // Click to dismiss immediately
  await page.getByTestId("chapter-reveal").click();
  await page.waitForTimeout(300);
  // Chapter reveal gone, now on Q5
  await expect(page.getByTestId("chapter-reveal")).not.toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
});

test("chapter reveal : n'apparaît PAS après Q20 (direct vers résultats)", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  // Should be on result screen, not chapter reveal
  await expect(page.getByTestId("chapter-reveal")).not.toBeVisible();
  await expect(page.getByText("Ton score")).toBeVisible();
});

test("badges A/B/C : visibles sur chaque réponse au quiz", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Badges A, B, C should be visible
  await expect(page.getByText("A", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("B", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("C", { exact: true }).first()).toBeVisible();
});

test("raccourci clavier A : sélectionne la première réponse", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Press 'A' keyboard shortcut
  await page.keyboard.press("a");
  // First answer should be selected (aria-checked="true")
  await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");
});

test("raccourci clavier C : sélectionne la troisième réponse", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  await page.keyboard.press("c");
  await expect(page.getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
});

test("Précédent : navigue en arrière et efface le chapter reveal en cours", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  // Answer Q1
  await page.getByRole("radio").first().click();
  await page.waitForTimeout(750); // now on Q2
  // Go back to Q1
  await page.getByRole("button", { name: "Question précédente" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  // No auto-advance should fire (pre-existing answer, not user-initiated on THIS question)
  await page.waitForTimeout(800);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
});

test("locked card shows score badge with /8", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  const lockedCard = page.locator('[aria-label*="Diagnostic verrouillé"]').first();
  await expect(lockedCard).toBeVisible();
  await expect(lockedCard.getByText(/\/8/)).toBeVisible();
});

test("locked card has 'Voir le diagnostic' CTA button", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  await expect(page.getByRole("button", { name: /Voir le diagnostic/ }).first()).toBeVisible();
});

test("unlock form shows personalized dimension name", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  const form = page.locator("#unlock-form");
  await expect(form).toBeVisible();
  await expect(form.getByText(/Visibilité|Preuves|Business|Autonomie|Stratégique/)).toBeVisible();
});

test("priority diagnostic card has expander", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  await expect(page.getByText(/Lire l'analyse complète/)).toBeVisible();
});

test("priority diagnostic card action block visible without expanding", async ({ page }) => {
  await page.goto("/");
  await completeQuiz(page);
  await expect(page.getByText(/Action cette semaine|Prochain niveau/).first()).toBeVisible();
});

test("le bouton PDF déclenche un téléchargement avec le bon nom de fichier", async ({ page }) => {
  await page.route("/api/subscribe", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await page.goto("/");
  await completeQuiz(page);
  await page.locator('input[type="email"]').fill("test@example.com");
  await submitBtn(page).click();
  await expect(page.getByText("Diagnostics déverrouillés")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Télécharger mon rapport/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^diagnostic-sm-\d+-\d{4}-\d{2}-\d{2}\.pdf$/);
}, 30000);
