# CLAUDE.md
# Read this file entirely before any action. If this file conflicts with session instructions → this file wins.

---

## 1. PROJECT

**Name:** SM Survival Score
**Purpose:** Diagnostic interactif pour Scrum Masters — mesurer la solidité de leur rôle face aux réductions d'effectifs et générer un plan d'action personnalisé.
**Status:** [ ] Exploration · [ ] MVP · [x] Production
**Owner:** Pierre-Cyril Denant

**Stack:**
- Frontend: React 18 + Vite 5 (JavaScript, pas TypeScript)
- Backend: Vercel Functions (serverless)
- DB: Aucune — données statiques dans le code source
- Styling: CSS inline avec design tokens (objet `T`) — pas de Tailwind
- Deploy: Vercel

**Key decisions:**
- Un seul fichier composant (`src/sm-survival-score.jsx`) — pas de split en sous-composants séparés
- Zéro routing — navigation gérée par état `screen` (landing / quiz / result)
- Logique de scoring exportée comme fonctions pures testables sans React
- Styles 100% inline via tokens centralisés — pas de fichier CSS
- Kit (ConvertKit) intégré via script embed côté client + serverless function `/api/subscribe` côté serveur
- Analytics fire-and-forget via `navigator.sendBeacon` vers Google Apps Script

---

## 2. BEHAVIOR — CORE RULES

### Think before coding
- State assumptions explicitly. If uncertain → ask before implementing.
- If multiple interpretations exist → present them, don't pick silently.
- If simpler approach exists → say so and push back.
- If something is unclear → stop, name what's confusing, ask.

### Simplicity first
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" that wasn't requested.
- If you write 200 lines and it could be 50 → rewrite it.

### Surgical changes
- Touch only what you must. Don't "improve" adjacent code.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Remove only imports/variables YOUR changes made unused — not pre-existing dead code.
- Every changed line must trace directly to the request.

### Goal-driven execution
- Transform tasks into verifiable goals before starting.
- For multi-step tasks, state a brief plan with verify steps:
  ```
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  ```
- Loop until verified. Don't report done before checking.

---

## 3. HARD CONSTRAINTS — NEVER DO

- Add libraries without explicit approval (explain need first, then wait)
- Write code that passes tests but bypasses intent
- Leave `TODO`, `FIXME`, or `console.log` in production paths
- Generate, suggest, or reference secrets/tokens/credentials
- Modify `.env` files or include sensitive values anywhere
- Ask clarifying questions after mistakes — ask before implementing

---

## 4. CODE STANDARDS

**TypeScript:** `strict: true`, zero `any` (use `unknown`), explicit return types, interfaces for public objects.

**Functions:** One responsibility, max 20 lines, max 3 params (use object if more), verb names (`getUserById`), early return over nested if/else.

**Naming:** `camelCase` vars/functions · `PascalCase` components · `UPPER_SNAKE_CASE` constants · `kebab-case.ts` files · `MyComponent.tsx` components.

**Comments:** Comment the WHY, never the WHAT. Code must be readable without comments. JSDoc on all exported public functions.

**Error handling:** Never empty `catch`. Log errors with context. Return explicit error types, not `null`. Use Result pattern or Error subclasses for business errors.

**React:** Functional components only. Props typed with explicit interface. Extract business logic into custom hooks. Ternary for conditional render (not `&&` — risk of `0` rendered).

**State:** `useState` local · `useReducer` for 3+ related fields · Context for truly global data only.

**API routes:** Handler = orchestration only. Business logic in services/. DB access in repositories/. Validate all inputs with Zod at route boundary.

---

## 5. SECURITY — NON-NEGOTIABLE

- Zero secrets in code — always via `process.env`, accessed through typed config module
- `.env` always in `.gitignore` — `.env.example` updated on every new variable
- Never log PII (emails, passwords, tokens) — mask in logs
- Parameterized queries only — never SQL built by concatenation
- Sanitize all user inputs before persistence
- bcrypt min cost 12 for passwords · JWT: 15min access / 7d refresh
- Cookies: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- Flag any security concern immediately, even if not asked

---

## 6. APPROVED LIBS — don't replace without discussion

| Usage | Lib |
|---|---|
| Charts | recharts (déjà en production) |
| HTTP client | native fetch |
| Tests | Node.js vanilla (zéro dépendances — intentionnel) |
| Fonts | Google Fonts (DM Sans, via CSS @import) |

**Libs actuellement installées :** react, react-dom, recharts, @vitejs/plugin-react, vite

**Avant d'ajouter une lib :** Est-ce que ça peut se faire nativement en < 20 lignes ? Repo actif (< 6 mois) ? Licence MIT/Apache 2.0 ? Si oui → propose, attends l'approbation.

---

## 7. GIT

**Commit format (Conventional Commits):**
```
feat: add user authentication
fix: resolve token expiration edge case
refactor: extract validation to separate module
test: add coverage for auth service
docs: update API endpoint documentation
```

**Pre-commit gate:** lint passes · typecheck passes · related tests pass · no `console.log` · no `.env` included.

**Branches:** `main` (production, protected) · `dev` (integration) · `feat/[name]` · `fix/[name]`

---

## 8. ARCHITECTURE

```
/
├── src/
│   ├── main.jsx                  # Point d'entrée React (monte SMSurvivalScore)
│   └── sm-survival-score.jsx     # Tout : données, logique, composants, styles
├── api/
│   └── subscribe.js              # Vercel Function : POST email → Kit API
├── index.html                    # Shell HTML (lang="fr", meta SEO)
├── vite.config.js
├── package.json
├── .env.example                  # Variables requises : KIT_API_KEY, KIT_FORM_ID
├── README.md
├── CHANGELOG.md
└── ARCHITECTURE.md               # Détail technique (flux, composants, API)
```

**Fichier central :** `src/sm-survival-score.jsx` contient dans l'ordre :
1. DATA (DIMENSIONS, QUESTIONS, GLOBAL_RESULTS, DIAGNOSTICS)
2. SCORING UTILITIES (fonctions pures exportées)
3. ANALYTICS (trackEvent via sendBeacon)
4. DESIGN TOKENS (objet T)
5. GLOBAL STYLES (StyleProvider)
6. COMPOSANTS (BentoCard, DiagnosticCard, LockedDiagnosticCard, ProgressBar)
7. SCREENS (LandingScreen, QuestionScreen, ResultScreen)
8. APP ROOT (SMSurvivalScore — état global, navigation)

*Updated: 2026-05-10*
