---
target: ResultScreen (src/sm-survival-score.jsx)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-02T02-36-07Z
slug: src-sm-survival-score-jsx-resultscreen
---
# Critique — ResultScreen (SM Survival Score)

Method: dual-agent (Assessment A: design review · Assessment B: detector + live browser overlay evidence), run as two isolated sub-agents that did not see each other's output.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | "Envoie le test à un collègue SM" silently falls back to `clipboard.writeText` with zero UI feedback on any browser without the Web Share API (most desktop browsers) |
| 2 | Match Between System and Real World | 3/4 | Copy is excellent and audience-specific, but every "Voir le diagnostic →" button routes to the same unlock panel naming a fixed dimension, regardless of which card was clicked |
| 3 | User Control and Freedom | 2/4 | `UnlockModal` has no visible close (×) — dismissal only via backdrop click or a secondary button, undiscoverable |
| 4 | Consistency and Standards | 3/4 | Strong token-driven consistency, but touch targets vary (44px vs. the project's own 48px target) and toggle buttons lack `aria-expanded` |
| 5 | Error Prevention | 2/4 | `isValidEmail` only checks for `"@"` and `"."` — very loose; submit correctly disables while in flight |
| 6 | Recognition Rather Than Recall | 3/4 | Score/category persist visually; unlock panel restates the relevant dimension inline |
| 7 | Flexibility and Efficiency of Use | 1/4 | No anchor/skip links, no way to jump to a specific diagnostic; everything is linear scroll |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean, coherent bento layout; some repetition ("Analyse + action concrète" identical ×4) |
| 9 | Error Recovery | 1/4 | One generic message ("Email invalide ou erreur — réessaie.") conflates client validation and server failure, styled in the same yellow used for CTAs — doesn't read as an error state |
| 10 | Help and Documentation | 1/4 | No legend anywhere for the radar's 0–8 scale or what the 5 dimensions mean, for a user who can land here cold via a shared link |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment**: The copy is genuinely bespoke — Capital One named directly, ScrumAlliance cited, jargon-translation lines written for this exact anxiety. But the *composition* is a generic quiz/dashboard template: bento cards, a radar chart + KPI-style progress bars, a blur-gated locked-card paywall, and a numbered "action step" habit-app pattern would all drop unchanged into a marketing-skills quiz or a sales-readiness assessment. Nothing about the layout, motion, or interaction model registers "this verdict concerns your job" — the worst-case (Vulnérable, score 0) and best-case (Irremplaçable, score 100) states are structurally identical, differing only by a swapped color token and copy. A page whose entire premise is layoff anxiety arguably deserves to *feel* different at its worst moment, not just say different words.

**Deterministic scan**: `detect.mjs` found 4 findings on this file, all rule `side-tab` (colored left-border on cards) — 2 in scope (`DiagnosticCard` L642, `LockedDiagnosticCard` L714), 2 out of scope (`PDFDocument`, not part of the on-screen page). This is the same pattern I deliberately kept in the prior polish pass, reasoning that the border color is functional (it mirrors the severity badge/bar color for each dimension, not decoration). The detector doesn't know that — it flags the shape unconditionally as a generic "AI-slop" tell. I stand by keeping it as-is since it's load-bearing for glanceability across 5 cards, but flagging the disagreement explicitly rather than silently overriding the tool: **if you'd rather the cards not use this pattern at all**, that's a legitimate call and worth a dedicated `/impeccable layout` pass to find a replacement severity cue.

**Visual overlays**: the browser-injected detector (live DOM/computed-style pass, distinct from the static CLI scan) found 20 anti-pattern instances on the results page — not shown by the CLI scan because these require rendered contrast/font-size measurement:
- **`low-contrast` (repeated 8×)** — most seriously: the hero category badge ("Stable") renders **white text on `#f59e0b` amber at 2.1:1 contrast**, and the per-dimension level badges ("À renforcer — 4/8") render `#f59e0b` text on `#fffbeb` at 2.1:1 — both need 4.5:1 for AA. I confirmed this visually (screenshot below) — it's plainly hard to read, not a detector false alarm. This directly contradicts `PRODUCT.md`'s stated commitment: *"WCAG AA vérifié sur toutes les combinaisons fond/texte."* A third finding: `#a3a3a3` (light gray) on the cream background at 2.3:1, on smaller supporting text.
- **`undersized-ui-text` / `tiny-text`** — "Action cette semaine" at 9px, "5 minutes" at 10px, body copy at 11px, all below reasonable minimums for functional text.
- **`text-overflow`** — on the **desktop** viewport only, the radar chart's "Stratégique" axis label clips against the card edge (confirmed in the desktop screenshot; not visible on mobile's single-column layout).
- **`cream-palette`** — an advisory-only flag on the page's cream/beige background; this is the brand's actual palette (`T.creme`), not a defect — false positive, safe to ignore.

## Overall Impression

The writing is the product's real asset — direct, specific, unafraid to name a real company and a real number, which is exactly the brand's stated edge. But the visual system carries none of that specificity: it's a well-executed generic dashboard shell, and two of its promises don't hold up under inspection — the accessibility claim in `PRODUCT.md` is currently false for at least two color combinations live on this page, and the one visualization built to make "where you're exposed" vivid goes completely blank for the person in the worst position. The single biggest opportunity is closing the gap between what the copy promises (a precise, personal diagnosis) and what the interface actually delivers at the moment it matters most (a blank radar, a same-for-everyone locked-card CTA, a color-blind-unfriendly badge).

## What's Working

- **The "Vulnérable" copy earns the brand's bluntness without cruelty.** Naming Capital One and reframing "less defensible, not less good" gives even the worst-case screen a face-saving exit rather than just bad news — the one place the product's promised tone actually shows up structurally, not just decoratively.
- **`DiagnosticCard`'s action strip turns a verdict into a task.** Numbered badge + "Action cette semaine" + an explicit "5 minutes" estimate converts abstract feedback into something an anxious user can act on today — exactly what this audience needs instead of a bare score.
- **One source of truth for severity color** (`getCategory` drives the badge, the card border, and the bar fill everywhere) is a real architecture win — it keeps the color language coherent for free, and makes the contrast fix below cheap: fix the color pairing once in `getCategory`, it propagates everywhere.

## Priority Issues

**[P1] Radar chart renders as an invisible dot at a 0/100 score**
**Why it matters**: this is exactly the user the whole funnel exists to reach — someone in real danger — and the flagship "here's where you're exposed" chart shows nothing right when it matters most. Confirmed via screenshot: at score 0, the polygon collapses to a single point at center, no shape at all. The dimension bars already handle this correctly (`Math.max(dim.pct, 3)` floor) — the radar doesn't have an equivalent floor.
**Fix**: apply a minimum-radius floor to the radar's plotted values (mirroring the bars' `Math.max(pct, 3)` pattern) so a near-zero profile still traces a visible shape.
**Suggested command**: `/impeccable harden`

**[P1] Confirmed WCAG AA contrast failures on the hero badge and dimension-level badges**
**Why it matters**: white-on-`#f59e0b` (2.1:1) and `#f59e0b`-on-`#fffbeb` (2.1:1) both fail AA's 4.5:1 requirement — visually confirmed, not a detector false alarm. This affects the "Stable" category (roughly a third of all outcomes) and every "À renforcer" dimension badge, and it directly contradicts the accessibility guarantee stated in `PRODUCT.md`.
**Fix**: darken the amber token used for text-on-tint pairings, or swap to a darker text color on the solid badge (e.g. use `T.vertDark`-style darkening logic already applied to the "Irremplaçable"/jaune badge, which correctly uses a dark foreground instead of white).
**Suggested command**: `/impeccable audit` (to catalog every instance across `getCategory`), then `/impeccable polish`

**[P2] Locked-card teaser text is hard-clipped mid-sentence**
**Why it matters**: this happens on the exact card, one screen above the email field, where the product is asking a skeptical audience to hand over their email — a visibly broken-looking sentence at that moment reads as buggy software, not a considered content gate, right at the conversion point.
**Fix**: replace the fixed `height: 50` + mask container with `-webkit-line-clamp` (or size to the actual rendered line-height) so truncation never lands mid-word/mid-sentence.
**Suggested command**: `/impeccable polish`

**[P2] Every "Voir le diagnostic →" button routes to the same unlock panel, which names a fixed dimension**
**Why it matters**: a user specifically worried about "Autonomie" clicks that card's CTA and lands on a panel discussing a different dimension entirely (`orderedDimResults[1]`, always) — a direct mismatch that undercuts the tool's core promise of precision-diagnosing individual weak spots.
**Fix**: either make the unlock-panel headline dimension-agnostic ("Débloque tes 4 dimensions restantes") or thread the clicked dimension through so the panel reflects it accurately.
**Suggested command**: `/impeccable clarify`

**[P2] The only link to the actual consulting offer lives inside the PDF, never on the live page**
**Why it matters**: for the "Vulnérable" user who most needs a next step beyond a checklist, the real conversion path is buried five steps deep (submit email → dismiss modal → download PDF → open file → find link) in a file most people never open. The live page's only persistent CTAs are "share" and "restart" — this directly undercuts `PRODUCT.md`'s own stated purpose (email/lead acquisition as an explicit product goal).
**Fix**: surface a low-key consulting link directly on the web result page (e.g. in `UnlockModal` or below the diagnostics section), not PDF-exclusive.
**Suggested command**: `/impeccable distill`

## Persona Red Flags

**Jordan (First-Timer)**: arriving cold via a shared link, Jordan gets a radar chart with no legend for the 0–8 axis and no explanation of what the 5 dimensions mean. Per the CTA-mismatch issue above, clicking a locked card's button lands on a panel discussing a *different* dimension than the one clicked — actively confusing instead of clarifying, right when Jordan most needs orientation.

**Casey (Distracted Mobile User)**: the mid-sentence-clipped "Positionnement stratégique" teaser reads as a rendering bug on a quick glance. The "Lire l'analyse complète" toggle has no explicit `minHeight`/padding — under both the project's stated 48px target and the 44px used elsewhere — an easy mis-tap on a phone.

**Sam (Accessibility-Dependent User)**: `GhostSignupForm`'s email input has no `<label>` or `aria-label`, relying solely on the placeholder for its accessible name (placeholder text isn't reliably announced or persists once typing starts); the expand/collapse toggle has no `aria-expanded`; and `handleScrollToUnlock` moves the viewport via `scrollIntoView` without moving keyboard/screen-reader focus to the destination. Combined with the confirmed 2.1:1 contrast badges, this page currently falls short of the AA bar `PRODUCT.md` claims it meets.

## Minor Observations

- After unlocking, the 4 newly-revealed `DiagnosticCard`s never receive a `cardArticle` (only the priority card does) — a missed engagement touchpoint right after the highest-intent moment.
- Desktop (1280px) content is capped at `maxWidth: 600` with large unused margins either side; nothing structurally differentiates desktop beyond the radar/bars sitting side-by-side.
- `role="region"` on all 4 locked cards creates 4 generically-labeled landmark regions for screen-reader users navigating by region.
- `PrioritySignal` (dark-green block) sits directly above the priority `DiagnosticCard`'s own dark-green action strip — two near-identically styled dark blocks back to back blur which one is "the thing to do."
- Share button (`handleShare`) gives no visible confirmation after a successful clipboard write — one of only two persistent page actions, silently doing nothing from the user's perspective on desktop.
- `cream-palette` detector flag is a false positive — it's the brand's own established background color, not an issue.

## Questions to Consider

1. If the Vulnérable and Irremplaçable states are structurally identical (same layout, same pacing, same card system, only a color/copy swap), is the product designed around the emotional stakes it claims to address, or is the copy doing all the emotional labor alone?
2. Is a bento-grid/KPI-dashboard visual language — usually associated with SaaS analytics tools — the right register for "here's how exposed you are to being laid off," or does it inadvertently make a personal, high-stakes verdict feel like a corporate report card?
3. Given the color-coded border-left is functionally load-bearing (severity at a glance across 5 cards) but is also the thing the detector flags as the most generic "AI-built UI" tell — is there a version of that severity cue that feels more authored to this product specifically (an icon, a corner mark, a subtle background tint) rather than the default left stripe?
