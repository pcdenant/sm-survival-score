import { test, expect } from "@playwright/test";

async function completeQuiz(page) {
  await page.getByRole("button", { name: "Voir mes angles morts" }).click();
  for (let i = 0; i < 20; i++) {
    // Answer options have role="radio" inside a radiogroup
    await page.getByRole("radio").first().click();
    // Next button: aria-label "Question suivante" for Q1-19, "Voir le résultat" for Q20
    await page.getByRole("button", { name: /Question suivante|Voir le résultat/ }).click();
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
