---
target: ResultScreen (src/sm-survival-score.jsx)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
timestamp: 2026-08-02T18-28-49Z
slug: src-sm-survival-score-jsx-resultscreen
---
# Critique #3 — ResultScreen (SM Survival Score)

Method: dual-agent (Assessment A: design review · Assessment B: detector + measured browser evidence), two isolated sub-agents. Third pass, after nine fixes shipped across PRs #45–#49.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Post-unlock the page swaps the form for cards *under the scroll position* — no in-page acknowledgment beyond the modal |
| 2 | Match System / Real World | 3/4 | Copy is excellent; "Ton niveau en Autonomie : **Solide**" is system logic leaking out as a sales pitch |
| 3 | User Control and Freedom | 2/4 | Escape closes the modal but focus lands on `<body>` — the restore target unmounted with the form |
| 4 | Consistency and Standards | 2/4 | `category.color` (a light-background token) still fills the hero badge: 1.18:1 as a shape |
| 5 | Error Prevention | 2/4 | `isValidEmail` accepts `a@b.`; `required` is inert under `noValidate`; no confirmation on "Refaire le test" |
| 6 | Recognition Rather Than Recall | 3/4 | Numbers persist, but "Par dimension" and the card stack order the same five dimensions differently |
| 7 | Flexibility and Efficiency | 2/4 | Five cards expand one at a time; no expand-all, no jump-to-dimension, no way to reopen the modal |
| 8 | Aesthetic and Minimalist Design | 2/4 | Radar and bars duplicate the same five numbers in the page's largest block |
| 9 | Error Recovery | 1/4 | One message for both a typo and an HTTP 500, in the same yellow as the submit button, unlinked to the field |
| 10 | Help and Documentation | 2/4 | Zero methodology on a screen whose stated differentiator is "scoring rigoureux et **transparent**" |
| **Total** | | **21/40** | **Acceptable** |

**Trend: 21 → 18 → 21.** Back to the starting score after nine merged fixes.

## Design Specificity Verdict

**LLM assessment**: the screen is two products in one skin. The content layer is unmistakably this product — Capital One deployed as a threat rather than a stat, dimension names that read as accusations, and a gate that reveals your score and severity while withholding only the interpretation, which is a genuinely smart paywall shape for a diagnostic. The visual layer could be dropped into any quiz unedited. Nothing in the composition encodes defensibility, urgency, or the asymmetry between a 1/8 and an 8/8 — which is the entire point of the instrument. And this got *worse*: removing the severity side-borders (my change, in #49) deleted the one device that expressed the product's core variable spatially and replaced it with nothing. Post-unlock, five cards render as identical white-then-green stripes distinguished only by an 11px pill. The page now reads as a settings list.

**Deterministic scan**: `detect.mjs` returns **0 findings, exit 0** — verified genuine, not suppressed (`--no-config` also returns 0, no `.impeccable/config.json` exists, no inline `impeccable-disable` comments). Confirmed by scanning history: 4 findings at `cbe7230`, 0 at `e1976e9`.

**Browser overlay + measurement**: 8–10 findings depending on state. **14 of ~76 text/background pairs fail WCAG AA**, identical across all six viewport × score combinations. **7 of 13 interactive elements are under 44×44px.** Zero application JS errors across 12 page loads. The heading outline is clean — `h1 → h2 ×3 → h3 ×5`, no skipped levels — and the main-page focus order matches visual order with no unexpected traps.

## Overall Impression

Nine fixes moved the score from 18 back to 21 — where it started. Every one of them improved a component; not one touched the composition, which is where the specificity problem lives. Worse, three of the nine introduced a regression or don't function, and **all three failures share one shape: I verified the pairing I was fixing and never checked the adjacent one.** That pattern has now cost more than the original bugs did. The biggest opportunity is no longer any single defect — it's that this screen needs a compositional pass, and that point-fixing it in isolation has stopped paying.

## What's Working

- **The gate's information split is the best structural decision in the product.** Locked cards show the dimension, the severity label, the exact score, and one full teaser sentence — withholding only the analysis and the action. It proves the instrument is real before asking for anything. Most lead magnets hide the number; this one hides the interpretation, which is the correct thing to sell.
- **The action strip is a product commitment rendered as layout.** Every diagnostic terminates in a green block with a concrete instruction and a 5-minute promise, and flips from "Action cette semaine" to "Prochain niveau" at high scores. Principle 3 made structural rather than decorative.
- **`getCardArticle`'s anti-duplication branch shows real editorial care** — the `vulnerable` + `visibility` case returns a CTA instead of a link *because the category banner already points at that article*. A deliberate refusal to show the same URL twice within 200px.

## Priority Issues

**[P0] The hero badge is invisible as a shape — and my `onDark` fix is why I missed it**
Measured: `#c81e1e` on `#006946` = **1.18:1**; `#b45309` = **1.35:1**; WCAG 1.4.11 needs 3:1 for a non-text shape. In #47 I split `category.color` into a separate `onDark` token for the score number, verified the badge's *white text* on its fill (5.74 / 5.02 ✅) — and never checked the badge's *fill against the hero background*. The verdict pill — carrying the single word the product exists to deliver — floats on a shape you cannot see. At `irreplaceable` it's worse: the badge and the download button are both `#FFF200` pills, same color, same shape, 90px apart, one clickable and one not.
**Fix**: give the badge a fill from the `onDark` family (or invert: `onDark` fill with `vertDark` text) so it clears 3:1 as a shape. Never place a `#FFF200` pill directly above a `#FFF200` button.
**Suggested command**: `/impeccable audit`

**[P0] Severity is invisible at a glance across the card stack**
After #49 removed the side-borders, five stacked cards are structurally identical; the only differentiator is an 11px pill whose amber variant is functionally beige on cream, plus a yellow "1" badge that repeats unchanged on all five action strips. The product's whole claim is that some dimensions will kill you and some won't. A user who scrolls past `Autonomie — Solide — 8/8` and `Langage business — Vulnérable — 1/8` and can't tell them apart was sold a diagnostic and handed a list. I removed the borders on the reasoning that the badge already carried severity — the badge carries it *semantically*, but not at a glance.
**Fix**: express severity through composition rather than a border — scale the cards. Priority card gets an inset and an explicit rank label; `low` cards get full padding and a promoted 13px badge; `high` cards collapse to a one-line summary that expands on click. Replace the five identical "1" badges with the card's actual rank.
**Suggested command**: `/impeccable layout`

**[P0] The email field is the least visible control on the highest-value screen**
Measured: field background `#ffffff15` composites to `#157555`, against which Chromium's default placeholder `#757575` sits at **1.23:1**; the border `#ffffff40` is **1.74:1** against the hero green. Typed text is white, so the field reads as disabled until you commit to typing. `PRODUCT.md` states email acquisition is "un objectif produit explicite, pas un effet secondaire" — every other conversion element was hardened across five PRs; the input itself was never touched.
**Fix**: style `::placeholder` to `rgba(255,255,255,.65)`, raise the field background and border to clear 3:1, and add a visible label instead of the aria-only one.
**Suggested command**: `/impeccable harden`

**[P1] Two accessibility fixes I shipped are dead code**
(a) The focus ring added in #47: the inline `outline: "none"` on the style object beats the `.signup-input:focus-visible` stylesheet rule, which carries no `!important`. The state matches; the declaration never applies. Measured `computed outline: none 0px` while focused — the one focus stop on the page with no visible indicator.
(b) The focus restore added in #48: `previouslyFocused` captures the submit button, but `setUnlocked(true)` unmounts `GhostSignupForm` before the modal closes, so `.focus()` runs on a detached node. Focus lands on `<body>` — precisely the bug the fix was written to cure. A keyboard user pressing Escape is teleported to the top of a 7,500px document.
**Fix**: (a) delete the inline `outline: "none"` and let the stylesheet rule apply. (b) Restore focus to a node that survives the unmount — the persistent PDF button, or the section heading.
**Suggested command**: `/impeccable harden`

**[P1] The screen's loudest CTA is a vanity download placed on top of bad news**
`Télécharger ma carte de score` is `#FFF200`, 281×48, above the fold on every band including 0/100. Nobody shares a 0. It also spends the brand's single accent colour before the email form — the actual conversion goal, far below the fold — can use it.
**Fix**: demote to `T.btnGhost` and move it into the actions row; or render it in the hero only when `category.key === "irreplaceable"`.
**Suggested command**: `/impeccable layout`

## Verification of the 9 Previous Fixes

| # | Fix | Status |
|---|---|---|
| 1 | Radar floor at score 0 | **Partial** — visually fine, but the floor feeds `aria-label`, so a screen reader announces "Visibilité **0.64**/8" ×5 for an all-zero profile. Fabricated numbers, and the only place per-dimension scores are read aloud as a set. |
| 2 | Locked-teaser 2-line clamp | **Holds, zero headroom** — the longest first sentence measures `scrollHeight 42 / clientHeight 42`. One added word silently re-breaks it. |
| 3 | Clicked dimension threads through | **Holds mechanically, copy regression** — can now pitch "Ton niveau en Autonomie : **Solide**", with the brand's attention yellow on the word "Solide". |
| 4 | Consulting link in modal | **Partial** — gated on `VITE_COLLAB_SOLVED_URL`, documented as optional. In any build without it, including dev, the modal renders no link at all. |
| 5 | `category.onDark` for the score | **Holds for the score, new regression beside it** — score is 3.98 / 4.68 / 5.77:1 ✅, but the badge 90px below still uses the light-background token as its fill on dark green (1.18:1 / 1.35:1). See P0 above. |
| 6 | 360px form overflow | **Holds** — `scrollWidth 360 / clientWidth 360`, stacks below 420px, 48px controls. Clean. |
| 7 | `SIGNAL_TEXTS_HIGH` | **Partial** — fixes 8/8. But the threshold is `score ≥ 6`, so at **5/8** the block still reads "tant que cette dimension reste faible" above a card badged "À renforcer — 5/8". **Voice check flagged**: all five HIGH titles use one template ("Et il tient." bolted after a colon phrase); the five original bodies contain zero em-dashes and zero mid-sentence colons, the HIGH bodies contain two of each; "péremption" and "se redémontre" appear nowhere else in 1,800 lines. It reads like a different writer — mine, not PC's. |
| 8 | Persistent PDF + modal a11y | **Partial** — Escape ✅, focus-into-modal ✅, Tab trap ✅ (verified: 8 presses never left the dialog), focus-restore ❌ (see P1). The persistent button also wraps the actions row to two lines at 1280px and is the same `T.btnAction` green as the share button, so the thing the user paid an email for has identical weight to a share CTA. |
| 9 | Borders removed + consent line | **Consent line holds** (4.86:1, reads as reassurance not friction). **Border removal regressed** — see P0 above. |

## Persona Red Flags

**Amélie (SM mid-reorg, scores 22, phone in a parking lot)**: her first available action after "Vulnérable" is a bright yellow button offering to generate a shareable image of a 22. The one line that would help her — "La matière est souvent là. C'est la traduction qui manque." — is 14px `T.textMid`, fourth paragraph, no emphasis. The gate's value line renders at 2.30:1. She closes on "Envoie le test à un collègue SM".

**Karim (low vision, 200% zoom)**: nine distinct pairings fail AA at his zoom — `TON SCORE` 3.45:1, `/100` 2.89:1, `ACTION CETTE SEMAINE` 2.89:1, `5 minutes` 2.35:1, `T.textLight` everywhere it appears. Note the consent line directly beneath one of these was deliberately tuned to 4.86:1 with a code comment showing the AA math, while the sentence 6px above it sits at 4.03:1 — the fix was applied pointwise, not systemically.

**Sophie (NVDA, scores 0)**: the radar announces five fabricated scores. She presses Escape on the modal and lands on `<body>`. She hits "Voir le diagnostic →" and the viewport scrolls but focus never moves and nothing is announced — from her perspective the button did nothing. The four locked cards each declare `role="region"`, injecting four landmarks, while the unlocked card is `role="article"` — same content type, two announcements.

## Minor Observations

- `isValidEmail` accepts `a@b.` — `includes("@") && includes(".")` is the whole check, and `noValidate` disables the browser's stronger validation.
- The `<h1>` is the score number, so the document has no heading naming what the page is. `PrioritySignal`'s title — arguably the most important editorial sentence on screen — is a `<p>`, absent from the outline.
- `ARTICLE_LINKS.cards` has real links for `proof`, `business`, `autonomy`; only the priority card renders one on screen. The other three ship exclusively in the PDF — the same failure class as fix #4, for a different asset.
- The radar's "Stratégique" label is clipped to "atégique" at 1280px (not at 390px).
- `(30 sec)` is hardcoded on every card regardless of actual length (~120–340 chars).
- `focusedLockedDim` is never cleared, so the panel keeps naming Autonomie even after the user scrolls back to a different card.
- The modal's "Voir mes résultats" is 42px tall (under 44) at 4.29:1 (under 4.5).
- `handleScrollToUnlock` uses `block: "center"`, which on a 360×640 viewport can leave the submit button below the fold.

## Questions to Consider

1. Five PRs, every one improving a component, none touching the composition. What is the smallest set of changes that would make the layout itself express severity — and why does that keep losing to point fixes?
2. If the score-card download is the loudest thing on the page, is this a diagnostic with a lead magnet attached or a share loop with a diagnostic attached? Those want opposite hero designs, and the hero is currently built for the second while the copy is built for the first.
3. `SIGNAL_TEXTS_HIGH` was written to fix a logical contradiction and nobody checked whether it sounded like you. Who signs off on voice when the fix arrives as a code change?
4. Three regressions across nine fixes, all the same shape: the pairing being fixed was verified, the adjacent one wasn't. What would have to exist — beyond the contrast test added in #47 — for that class of error to fail automatically instead of surviving to the next critique?
