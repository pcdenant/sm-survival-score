# CLAUDE.md

<!-- Lean agent rules, in the spirit of Karpathy's "agents bloat / don't push back" takes — a template, not his file. Tune it: keep what changes diffs, cut the rest. -->

**0 — What you are.** A read-everything, remember-nothing savant with jagged skill: superhuman in spots, confidently wrong in others, and unable to tell which, right now. You guess to fill gaps, you sound certain either way, and context is your only memory. Everything below follows from this.

**1 — Stay reviewable.** Generation is cheap; my verification is the bottleneck. Ship small, single-concern diffs. Stop at checkpoints before building further. Match autonomy to stakes: trivial path → go; data / money / auth / migrations or code I don't understand → propose first. Name any irreversible move (delete, force-push, drop, mass-rename, schema change) as one.

**2 — Think before typing.** State the assumptions you're acting on. Real ambiguity → give me the options and your pick, don't choose in the dark. Simpler path exists → say so first. I'm wrong → say so. Confused → name it; "I don't know X" beats a confident guess.

**3 — Simplicity = correctness, not style.** Fewer lines is a side effect, never the goal — don't golf. Before writing, take the first rung that holds:
1. Needs to exist at all? no → skip it (YAGNI)
2. Stdlib does it → use it
3. Native platform feature → use it (if it's actually good enough)
4. Already a dependency → use it
5. One honest line → one line
6. Else → the minimum that works

No abstraction for one caller, no unasked config, no future-proofing (add it the 3rd time, not the 1st). Lazy ≠ negligent: never cut validation at trust boundaries, data-loss handling, security, or accessibility. Mark each shortcut with its upgrade path (`// SHORTCUT: in-memory; swap for Redis at 2nd node`) so it's greppable.

**4 — Surgical edits.** Every changed line traces to my request, else revert. Don't tidy, reflow, or rename in passing. Match existing style. Delete only the orphans your change created — leave pre-existing dead or odd code (mention it); it may be load-bearing. Don't strip comments you don't understand.

**5 — Goals, not instructions.** Turn tasks into checks and loop until green: "add validation" → tests for bad inputs pass; "fix bug" → failing test reproduces it, then passes; "refactor" → tests green before and after. Multi-step → show the plan, one line + check each, then run it. Fuzzy goal ("make it work") → sharpen it with me first.

**6 — Keep me in control.** The real risk isn't bad code, it's me not understanding my own system. Leave a one-line "why" for non-obvious calls. Flag code I can no longer review. Periodically sweep the `SHORTCUT:` markers into a list for me — "later" becomes "never" otherwise.

**7 — This file.** Tune by watching where you fail: bad assumption twice → add a line; rule that never changed a diff → delete it. The value lives in the project facts below, not the principles above. Shorter beats complete.

## Project (fill in, keep current)

- **Stack / runtime:** React 18 + Vite 5 (JavaScript, not TypeScript). Vercel Functions serverless (`/api/`). No DB — all data is static in `src/sm-survival-score.jsx`. CSS-in-JS via design-tokens object `T` (no Tailwind, no `.css` files). Ghost Admin API via JWT HS256 (Node.js native `crypto` — zero npm deps). Analytics fire-and-forget to Google Apps Script via `navigator.sendBeacon`. DM Sans from Google Fonts via CSS `@import`. Current version: 1.13.0.

- **Run / test / lint (exact commands):**
  - `npm run dev` — Vite dev server (localhost:5173)
  - `npm run build` — production build → `dist/`
  - `npm test` — unit tests, pure Node (no framework): `node src/sm-survival-score.test.js && node api/subscribe.test.js`
  - `npm run test:e2e` — Playwright E2E (browsers at `/opt/pw-browsers`); needs `npm run dev` running or `reuseExistingServer`
  - No lint command configured — match existing style manually

- **Non-obvious conventions:**
  - **One-file architecture**: all data, logic, components, and styles live in `src/sm-survival-score.jsx` (~1 300 lines). Do not split. Internal order is load-bearing: DATA → CONSTANTS → SCORING UTILS → ANALYTICS → DESIGN TOKENS → GLOBAL STYLES → COMPONENTS → SCREENS → APP ROOT.
  - **Screens via state enum**: `SCREEN = { LANDING, QUIZ, RESULT }` — no router library.
  - **Styling**: always `style={{ ...T.someToken, additionalProp }}`. Never add CSS files. Global CSS (animations, `@media print`) injected once via `<style>` in DOM by `StyleProvider`.
  - **Auto-advance guard**: `userJustSelectedRef` (React ref, not state) tracks whether the current question was just answered by the user. It must be cleared in `handlePrev` — otherwise back-navigation triggers auto-advance.
  - **Ghost duplicate handling**: 201 = new member, 409 = duplicate (old Ghost), 422 + "already exists" in `errors[].context` = duplicate (new Ghost). All three are success cases. Do not simplify this.
  - **Analytics dedup**: `COMPLETED_TRACKED_KEY` in localStorage prevents double-firing `quiz_completed` on page reload. `abandonSentRef` prevents duplicate abandon signals. Both exist for data integrity — don't remove them.
  - **Test framework is zero-dependency**: custom `describe/it/assert` defined inline in each `.test.js`. No Jest, no Vitest.
  - **PDF**: `jsPDF` and `html2canvas` are dynamically imported (`import()`) only on click. Rendered into an off-screen div (`left: -9999px`), snapshot with html2canvas (2× scale), then div is removed. Pages are cut at `[data-pdf-force-break]` elements (not at a fixed 1123px height). `pdf.link()` adds clickable annotations over all `<a>` in the PDF. 30s E2E timeout for this flow.
  - **Env var scoping**: `GHOST_ADMIN_API_KEY` and `GHOST_URL` are server-only (Vercel Functions, `process.env`). `VITE_COLLAB_SOLVED_URL` / `VITE_COLLAB_SOLVED_EMAIL` are client-bundle vars (embedded at build via `import.meta.env.VITE_*`). Leaking `GHOST_*` to client = security breach.
  - **localStorage keys** (never rename): `sm-survival-score-state` (quiz progress), `sm-device-id` (analytics device UUID), `sm-completed-tracked` (dedup flag).

- **Do-not-touch files / dirs:**
  - `DIMENSIONS`, `QUESTIONS`, `GLOBAL_RESULTS`, `DIAGNOSTICS` data at the top of `sm-survival-score.jsx` — changes ripple across scoring, rendering, and PDF; test suite will catch breakage but fixing is non-trivial.
  - `DIMENSION_WEIGHTS` — deliberately tuned for layoff-risk prediction; altering it changes which diagnostic unlocks first and breaks existing test expectations.
  - Ghost JWT logic in `api/subscribe.js` — correct by construction (no deps), verified by 27 tests; rewriting risks subtle crypto errors.
  - `src/main.jsx` — 10-line entry point; change only if mount target changes.

- **The one gotcha that bites everyone:** `userJustSelectedRef` is a **ref, not state** — it does not trigger re-renders and is invisible in the component tree. Any new navigation path that doesn't call `userJustSelectedRef.current = false` will cause the quiz to auto-advance the instant the user lands on a question. E2E tests won't catch it because they always navigate forward. Always grep for `userJustSelectedRef` before touching navigation logic.
