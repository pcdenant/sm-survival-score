---
target: ResultScreen (src/sm-survival-score.jsx)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-02T14-36-11Z
slug: src-sm-survival-score-jsx-resultscreen
---
# Critique #2 — ResultScreen (SM Survival Score)

Method: dual-agent (Assessment A: design review · Assessment B: detector + measured browser evidence), run as two isolated sub-agents. Re-critique after 5 fixes from critique #1 were merged (PRs #45, #46).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Unlocking produces no on-page acknowledgment — 4 locked cards silently become open ones, no banner, no scroll, no count |
| 2 | Match System / Real World | 3/4 | Domain language outstanding; but screen readers announce "Visibilité 0.64/8" (the radar floor leaking into the aria-label) |
| 3 | User Control and Freedom | 1/4 | PDF is reachable only from `UnlockModal` — dismiss it and the report the user just traded an email for is gone; no Escape handler |
| 4 | Consistency and Standards | 2/4 | Category pill styled as a button beside a real button; radar monochrome while bars encode the same 5 numbers in color; yellow means CTA, brand, "Solide" and error |
| 5 | Error Prevention | 1/4 | Submit button clipped off-viewport at 360px; input has no label/`autocomplete`/`inputMode`; error never clears on retype |
| 6 | Recognition Rather Than Recall | 3/4 | Level + n/8 + real teaser on every card is strong; radar tick labels unreadable at 2.5:1 |
| 7 | Flexibility and Efficiency | 2/4 | No path to the priority action, no way to re-reach the PDF, no keyboard affordances beyond default tab order |
| 8 | Aesthetic and Minimalist Design | 2/4 | Radar and bars are two encodings of the same 5 numbers; 13 focusables and 4 identical CTAs before the form |
| 9 | Error Recovery | 1/4 | One string for both a typo and a dead API; no `aria-live`; status never resets to idle on edit |
| 10 | Help and Documentation | 1/4 | No methodology, no thresholds, and no privacy/consent line on the email form for a GDPR audience |
| **Total** | | **18/40** | **Poor** |

Down from 21/40. Four of five merged fixes landed, but two introduced regressions worse than what they replaced, and this pass reached failures the first one missed.

## Design Specificity Verdict

**LLM assessment**: the content is unmistakably this product; the design largely is not. The one genuinely product-specific device is `DiagnosticCard`'s two-zone split — white analysis panel welded to a dark-green action strip with a yellow "1" and "5 minutes". That is Principle 3 ("actionnable avant tout") made into a shape. Everything structural around it is stock lead-magnet furniture. The sharpest tell: the product's stated differentiator — "scoring rigoureux et transparent (5 dimensions × 4 questions, seuils précis)" — is entirely absent from the screen that delivers the verdict. Nothing explains what 48 means, that the thresholds are 45 and 75, or why Visibilité outranks Autonomie. A product whose whole thesis is *stop asserting, start proving* asserts a score and never shows the arithmetic.

**Deterministic scan**: `detect.mjs` — 4 findings, all `side-tab`; 2 in scope (`DiagnosticCard` L642, `LockedDiagnosticCard` L714), 2 in `PDFDocument` (out of scope). Unchanged from critique #1; still the deliberate severity-border decision.

**Browser overlay + measurement**: 13–20 findings depending on state (worst at score 0). Independently measured, not eyeballed:
- **12 of 60 text/background pairs fail WCAG AA** at score 50; 13 of 63 at score 0.
- **5 of 13 interactive elements are under 44×44px**, including both email-form controls at 38px tall — against `PRODUCT.md`'s own ≥48px commitment.
- The email input has no `id`, `name`, `label`, or `aria-label` — placeholder-only — and its inline `outline: "none"` means it has **no visible focus indicator at all** (the global focus rule targets `button:focus-visible` only).
- Zero application JS errors across 6 state/viewport combinations. The console noise is sandbox-only (Google Fonts and the analytics beacon are network-blocked here).

## Overall Impression

The first critique's fixes were applied faithfully but too narrowly — two of them optimized a local measurement and broke the thing next to it. The screen is now *measurably worse* than before at its single most important pixel. The underlying problem is that this codebase has one color token doing two contradictory jobs, and no test encodes the accessibility promise `PRODUCT.md` makes, so a "fix" can silently reverse it. The biggest opportunity is no longer a design idea: it's making the stated commitments executable, so the next fix can't quietly undo them.

## What's Working

- **`DiagnosticCard`'s two-zone anatomy** — the color inversion makes the action visually inescapable even when skimming, and the time cost is stated *before* the user commits attention. The `level === "high" ? "Prochain niveau" : "Action cette semaine"` swap is a small correct touch: it stops congratulating people with a to-do.
- **The locked-card teaser is honest persuasion** — real level badge, real n/8, real first sentence of the real diagnostic. Nothing faked or blurred. The user knows exactly what they're trading an email for, which is why the gate doesn't feel cheap.
- **`PrioritySignal` as editorial interjection** — converts five numbers into one sentence with a point of view before the user has to synthesize anything. The only element doing the interpretive work the audience came for.

## Priority Issues

**[P0] The verdict is illegible for two of three outcomes — and my own critique-#1 fix caused half of it**
Measured: `#b45309` on `#006946` = **1.35:1**; `#dc2626` on `#006946` = **1.40:1**. Only *Irremplaçable* (`#FFF200`, 5.77:1) is readable. The 96px/900 score number fails large-text AA (3:1) by a factor of two. The "stable" case specifically **regressed from 3.15:1 (passing) to 1.35:1** because `getCategory().color` is consumed both on light backgrounds (badges, bars — what I was fixing) and on the dark hero (where darker is worse). The red case was pre-existing and missed in critique #1. This audience skews to the low and middle bands by design, so the people the product exists for are exactly the ones who can't read their score — and red-on-green is the worst pairing for the most common color blindness, in a majority-male profession.
**Fix**: add a `category.onDark` token used by the hero only; keep `category.color` for badges/bars, which now pass. Don't let hue alone carry the tier — the pill already says it in words.
**Suggested command**: `/impeccable audit`

**[P0] The conversion form breaks at 360px**
Measured at 360px: `document.scrollWidth` 389 vs `clientWidth` 360 — the whole page pans horizontally, and the `Déverrouiller` button's right edge lands at 389px, outside the viewport. Cause: `display:flex` with `<input style={{flex:1}}>` and no `minWidth: 0`, so the input refuses to shrink. Both controls are also 38px tall against the documented ≥48px. Email acquisition is a stated product objective and discovery is LinkedIn-first, i.e. mobile — on a 360px Android the primary conversion control hangs off the screen edge.
**Fix**: `minWidth: 0` on the input; stack below ~420px; raise padding to 48px; add `autoComplete="email"`, `inputMode="email"`, and a real label.
**Suggested command**: `/impeccable adapt`

**[P1] The screen contradicts itself at high scores**
`PrioritySignal` renders unconditionally. At 100/100 it displays "Ton angle mort le plus urgent… **Tant que cette dimension reste faible**…" directly above a card reading `Solide — 8/8`. For an audience professionally trained to spot unfalsifiable assessments, one visibly contradicted sentence discredits the whole score — and it poisons the single element doing real interpretive work.
**Fix**: branch `SIGNAL_TEXTS` on `getDiagnosticLevel(priorityDimResult.score)`; for `high`, swap to a maintenance frame. `GLOBAL_RESULTS.irreplaceable` already handles this correctly — `PrioritySignal` just needs to match.
**Suggested command**: `/impeccable clarify`

**[P1] The unlock is a one-way door with no acknowledgment**
Four compounding failures at the highest-stakes moment: `generatePDF` is called from exactly one place, so dismissing the modal permanently destroys the promised report; on submit `document.activeElement` becomes `BODY`, so keyboard and screen-reader users are dumped nowhere and never learn the modal opened; Escape does nothing; and the `<a href="#unlock-form">S'abonner →</a>` in the priority card outlives its target. Separately, the whole screen has **no `<h1>` and no `<h2>`** — headings start at `h3` and the score is a `<div>`, so the verdict has no structural rank.
**Fix**: persist a PDF button in the actions row once `unlocked`; focus the modal heading on mount, trap Tab, handle Escape, restore focus on close; promote the score to `<h1>`.
**Suggested command**: `/impeccable harden`

**[P2] The gate can sell the user their own strength, and asks for consent it never requests**
Critique #1's fix #4 (threading the clicked dimension) works correctly but made the pitch able to read "Ton niveau en Autonomie : **Solide**" — with *Solide* in the celebration yellow — i.e. *give me your email to unlock a dimension where you're already fine.* Separately there is no privacy line, no "désabonnement en un clic", and no disclosure that the email subscribes you to a weekly newsletter; the user only learns that after submitting.
**Fix**: suppress the level word when it's `high`, or clamp to the weakest locked dimension. Add one consent line under the input.
**Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Karim (SM, 4 yrs, Android 360px, scored 18, just heard "réorg")**: cannot read his own score (1.40:1); taps Déverrouiller and the page slides sideways instead; "Analyse + action concrète" at 2.30:1/11px is invisible so the gate reads as pure paywall with no stated benefit; the page ends by asking him to forward the test to a colleague.

**Sophie (SM, 7 yrs, desktop, scored 92, vetting this for her chapter)**: `PrioritySignal` tells her a dimension she scored 8/8 in "reste faible" — she stops trusting the instrument on that sentence alone; the radar's "Stratégique" label renders clipped as "atégique" at 1280px; nothing states the 45/75 thresholds she'd need to vouch for it.

**Marc (deuteranopia, 200% zoom, occasional VoiceOver)**: `#dc2626` and `#b45309` are indistinguishable to him — and they are the *only* thing separating "Vulnérable" from "À renforcer" on badges, bars and borders; at score 0 his screen reader announces "Visibilité 0.64/8" five times; navigating by heading he reaches "Ton profil" first because the score isn't a heading; "Lire l'analyse complète" measures 198×14px.

## Minor Observations

- The radar floor leaks into the accessible name — bars got this right (`aria-valuenow` keeps the true value), the radar didn't.
- Post-unlock, `DiagnosticCard`s are rendered without `cardArticle`, so the real article links for `proof`, `business` and `autonomy` are **never rendered anywhere in the app** — dead content.
- Five unlocked cards each carry a yellow disc reading "1".
- `T.textMuted` (#7a7a7a) on cream = 3.91:1 — fails AA for "Refaire le test" and the footer link.
- "Refaire le test" wipes the result irreversibly, one click, no confirmation, 12px from a share button.
- The form error has no `role="alert"` (the score-card error does — inconsistent), and `status` never resets to `idle` on edit, so the error persists under a now-valid address.
- 23 text elements render below 12px.
- The consulting link added in critique #1 is gated on `VITE_COLLAB_SOLVED_URL`, empty in `.env.example` — so in a default build it renders nothing.

## Questions to Consider

1. The positioning is that Scrum Masters lose their jobs because they assert value instead of proving it. Why does this screen assert a score of 48 and never show the arithmetic that would let the user defend the number to themselves?
2. The brightest, highest-contrast control on a screen that may have just told someone their role is indefensible is a button to generate a shareable image of that fact. Who is that button for — the user, or the funnel?
3. `PRODUCT.md` states "WCAG AA vérifié sur toutes les combinaisons fond/texte" and "cibles tactiles ≥ 48px". The hero score is 1.35:1 and the submit button is 38px. What process produced that claim, and what would make it a test instead of a sentence?
