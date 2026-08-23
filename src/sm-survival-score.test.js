/**
 * SM Survival Score — Test Suite
 *
 * Tests the scoring utilities, data integrity, and edge cases.
 * Run in any JS environment (Node, browser console, or test runner).
 *
 * Usage:
 *   node sm-survival-score.test.js
 *   OR import and call runAllTests()
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Import scoring utilities (inline for portability)
// These mirror the exports from sm-survival-score.jsx
// ============================================================

const DIMENSIONS = [
  { id: "visibility", name: "Visibilité de ton impact", shortName: "Visibilité" },
  { id: "proof", name: "Maîtrise des preuves", shortName: "Preuves" },
  { id: "business", name: "Langage business", shortName: "Business" },
  { id: "autonomy", name: "Autonomie de ton équipe", shortName: "Autonomie" },
  { id: "strategic", name: "Positionnement stratégique", shortName: "Stratégique" },
];

// Minimal questions structure for testing (scores only)
const QUESTIONS_STRUCTURE = [
  // visibility x4
  { dimension: "visibility", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "visibility", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "visibility", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "visibility", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  // proof x4
  { dimension: "proof", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "proof", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "proof", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "proof", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  // business x4
  { dimension: "business", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "business", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "business", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "business", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  // autonomy x4
  { dimension: "autonomy", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "autonomy", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "autonomy", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "autonomy", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  // strategic x4
  { dimension: "strategic", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "strategic", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "strategic", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
  { dimension: "strategic", answers: [{ score: 2 }, { score: 1 }, { score: 0 }] },
];

// ---- Scoring functions (mirrored from component) ----

function computeDimensionScores(answers, questions = QUESTIONS_STRUCTURE, dimensions = DIMENSIONS) {
  const scores = {};
  dimensions.forEach(d => (scores[d.id] = 0));
  questions.forEach((q, i) => {
    const sel = answers[i];
    if (sel !== null && sel !== undefined && q.answers[sel]) {
      scores[q.dimension] += q.answers[sel].score;
    }
  });
  return scores;
}

function computeGlobalScore(dimScores) {
  const total = Object.values(dimScores).reduce((a, b) => a + b, 0);
  return Math.round((total / 40) * 100);
}

// Miroir de getCategory pour les tests de logique (pas de transform JSX ici, donc pas d'import).
// Volontairement sans couleurs : elles avaient dérivé de la source (#ef4444/#f59e0b/#22c55e
// contre #c81e1e/#b45309/#006946) sans qu'aucun test ne le voie. Les couleurs réelles sont
// extraites de la source et vérifiées dans « CONTRASTE WCAG », seul endroit qui doit les connaître.
function getCategory(pct) {
  if (pct < 45) return { key: "vulnerable", label: "Vulnérable" };
  if (pct < 75) return { key: "stable", label: "Stable" };
  return { key: "irreplaceable", label: "Irremplaçable" };
}

function getDiagnosticLevel(score) {
  if (score <= 3) return "low";
  if (score <= 5) return "mid";
  return "high";
}

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function buildDimensionResults(dimScores, dimensions = DIMENSIONS) {
  return dimensions.map(d => ({
    ...d,
    score: dimScores[d.id],
    pct: Math.round((dimScores[d.id] / 8) * 100),
  }));
}

// ============================================================
// TEST FRAMEWORK (minimal, zero dependencies)
// ============================================================

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ FAIL: ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (!match) {
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Actual:   ${JSON.stringify(actual)}`);
  }
  assert(match, testName);
}

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  fn();
}

// ============================================================
// TESTS
// ============================================================

describe("DATA INTEGRITY", () => {
  assert(DIMENSIONS.length === 5, "5 dimensions defined");
  assert(QUESTIONS_STRUCTURE.length === 20, "20 questions defined");

  // Each dimension has exactly 4 questions
  DIMENSIONS.forEach(d => {
    const count = QUESTIONS_STRUCTURE.filter(q => q.dimension === d.id).length;
    assert(count === 4, `Dimension "${d.id}" has exactly 4 questions`);
  });

  // Each question has exactly 3 answers
  QUESTIONS_STRUCTURE.forEach((q, i) => {
    assert(q.answers.length === 3, `Question ${i + 1} has exactly 3 answers`);
  });

  // Each question has scores 2, 1, 0 (in order)
  QUESTIONS_STRUCTURE.forEach((q, i) => {
    const scores = q.answers.map(a => a.score);
    assertEqual(scores, [2, 1, 0], `Question ${i + 1} has scores [2, 1, 0]`);
  });
});

describe("SCORING — ALL MAX (score 0 = best answer for all)", () => {
  const answers = Array(20).fill(0); // all best answers
  const dimScores = computeDimensionScores(answers);

  assertEqual(dimScores.visibility, 8, "Visibility = 8");
  assertEqual(dimScores.proof, 8, "Proof = 8");
  assertEqual(dimScores.business, 8, "Business = 8");
  assertEqual(dimScores.autonomy, 8, "Autonomy = 8");
  assertEqual(dimScores.strategic, 8, "Strategic = 8");

  const pct = computeGlobalScore(dimScores);
  assertEqual(pct, 100, "Global score = 100%");
});

describe("SCORING — ALL MIN (score 2 = worst answer for all)", () => {
  const answers = Array(20).fill(2); // all worst answers
  const dimScores = computeDimensionScores(answers);

  assertEqual(dimScores.visibility, 0, "Visibility = 0");
  assertEqual(dimScores.proof, 0, "Proof = 0");
  assertEqual(dimScores.business, 0, "Business = 0");
  assertEqual(dimScores.autonomy, 0, "Autonomy = 0");
  assertEqual(dimScores.strategic, 0, "Strategic = 0");

  const pct = computeGlobalScore(dimScores);
  assertEqual(pct, 0, "Global score = 0%");
});

describe("SCORING — ALL MIDDLE", () => {
  const answers = Array(20).fill(1); // all middle answers
  const dimScores = computeDimensionScores(answers);

  assertEqual(dimScores.visibility, 4, "Visibility = 4");
  const pct = computeGlobalScore(dimScores);
  assertEqual(pct, 50, "Global score = 50%");
});

describe("SCORING — MIXED (dimension-specific)", () => {
  // visibility: all best (8), proof: all worst (0), rest: middle (4)
  const answers = [
    0, 0, 0, 0,  // visibility = 8
    2, 2, 2, 2,  // proof = 0
    1, 1, 1, 1,  // business = 4
    1, 1, 1, 1,  // autonomy = 4
    1, 1, 1, 1,  // strategic = 4
  ];
  const dimScores = computeDimensionScores(answers);

  assertEqual(dimScores.visibility, 8, "Visibility = 8 (all best)");
  assertEqual(dimScores.proof, 0, "Proof = 0 (all worst)");
  assertEqual(dimScores.business, 4, "Business = 4 (all middle)");

  const pct = computeGlobalScore(dimScores);
  assertEqual(pct, 50, "Global score = 50% (20/40)");
});

describe("SCORING — EDGE CASES", () => {
  // Unanswered questions (null)
  const partial = [0, 0, null, null, ...Array(16).fill(1)];
  const dimScores = computeDimensionScores(partial);
  assertEqual(dimScores.visibility, 4, "Partial answers: visibility = 4 (only 2 of 4 answered)");

  // All null
  const allNull = Array(20).fill(null);
  const allNullScores = computeDimensionScores(allNull);
  assertEqual(computeGlobalScore(allNullScores), 0, "All null answers = 0%");

  // Invalid answer index (out of bounds) — should not crash
  const invalid = [5, -1, 99, ...Array(17).fill(0)];
  let crashed = false;
  try {
    computeDimensionScores(invalid);
  } catch (e) {
    crashed = true;
  }
  assert(!crashed, "Invalid answer indices don't crash");
});

describe("CATEGORY BOUNDARIES", () => {
  // Exact boundaries
  assertEqual(getCategory(0).key, "vulnerable", "0% = vulnerable");
  assertEqual(getCategory(39).key, "vulnerable", "39% = vulnerable");
  assertEqual(getCategory(45).key, "stable", "45% = stable (boundary)");
  assertEqual(getCategory(69).key, "stable", "69% = stable");
  assertEqual(getCategory(75).key, "irreplaceable", "75% = irreplaceable (boundary)");
  assertEqual(getCategory(100).key, "irreplaceable", "100% = irreplaceable");

  // Labels in French
  assertEqual(getCategory(20).label, "Vulnérable", "Vulnerable label is French");
  assertEqual(getCategory(50).label, "Stable", "Stable label");
  assertEqual(getCategory(85).label, "Irremplaçable", "Irreplaceable label is French");
});

describe("DIAGNOSTIC LEVELS", () => {
  // Score 0-3 = low
  assertEqual(getDiagnosticLevel(0), "low", "Score 0 = low");
  assertEqual(getDiagnosticLevel(3), "low", "Score 3 = low (boundary)");

  // Score 4-5 = mid
  assertEqual(getDiagnosticLevel(4), "mid", "Score 4 = mid (boundary)");
  assertEqual(getDiagnosticLevel(5), "mid", "Score 5 = mid");

  // Score 6-8 = high
  assertEqual(getDiagnosticLevel(6), "high", "Score 6 = high (boundary)");
  assertEqual(getDiagnosticLevel(8), "high", "Score 8 = high");
});

describe("DIAGNOSTIC LEVEL MAPPING TO CATEGORIES", () => {
  // Verify diagnostic levels align with PRD thresholds
  // low (0-3/8 = 0-37.5%) → always maps to vulnerable or low-stable
  // mid (4-5/8 = 50-62.5%) → maps to stable
  // high (6-8/8 = 75-100%) → maps to irreplaceable

  const lowPct = Math.round((3 / 8) * 100);
  assert(getCategory(lowPct).key === "vulnerable" || getCategory(lowPct).key === "stable", "Low diagnostic score maps to vulnerable/stable category");

  const midPct = Math.round((5 / 8) * 100);
  assertEqual(getCategory(midPct).key, "stable", "Mid diagnostic score (5/8=63%) maps to stable");

  const highPct = Math.round((6 / 8) * 100);
  assertEqual(getCategory(highPct).key, "irreplaceable", "High diagnostic score (6/8=75%) maps to irreplaceable");
});

describe("EMAIL VALIDATION", () => {
  assert(!isValidEmail(""), "Empty string is invalid");
  assert(!isValidEmail("notanemail"), "No @ is invalid");
  assert(!isValidEmail("@"), "Just @ is invalid");
  assert(!isValidEmail("test@"), "No domain is invalid");
  assert(isValidEmail("test@example.com"), "Valid email passes");
  assert(isValidEmail("a@b.c"), "Minimal valid email passes");
  assert(!isValidEmail(null), "null is invalid");
  assert(!isValidEmail(undefined), "undefined is invalid");
  assert(!isValidEmail(42), "number is invalid");
});

describe("SCORING MATH — PERCENTAGE ROUNDING", () => {
  // 1/40 = 2.5% → rounds to 3
  const scores1 = { visibility: 1, proof: 0, business: 0, autonomy: 0, strategic: 0 };
  assertEqual(computeGlobalScore(scores1), 3, "1/40 rounds to 3%");

  // 15/40 = 37.5% → rounds to 38
  const scores15 = { visibility: 3, proof: 3, business: 3, autonomy: 3, strategic: 3 };
  assertEqual(computeGlobalScore(scores15), 38, "15/40 rounds to 38%");

  // 16/40 = 40% → exactly 40
  const scores16 = { visibility: 4, proof: 4, business: 4, autonomy: 4, strategic: 0 };
  assertEqual(computeGlobalScore(scores16), 40, "16/40 = exactly 40%");
});

describe("BUILD DIMENSION RESULTS", () => {
  const allZero = { visibility: 0, proof: 0, business: 0, autonomy: 0, strategic: 0 };
  const allMax  = { visibility: 8, proof: 8, business: 8, autonomy: 8, strategic: 8 };
  const mixed   = { visibility: 4, proof: 3, business: 5, autonomy: 0, strategic: 8 };

  const zeroResults = buildDimensionResults(allZero);
  assert(zeroResults.length === 5, "Returns one entry per dimension");
  zeroResults.forEach(d => {
    assert(d.score === 0, `${d.id}: score=0 when all zeros`);
    assert(d.pct === 0, `${d.id}: pct=0 when all zeros`);
  });

  const maxResults = buildDimensionResults(allMax);
  maxResults.forEach(d => {
    assert(d.score === 8, `${d.id}: score=8 at max`);
    assert(d.pct === 100, `${d.id}: pct=100 at max`);
  });

  const mixedResults = buildDimensionResults(mixed);
  assertEqual(mixedResults.find(d => d.id === "visibility").pct, 50, "4/8 → pct=50");
  assertEqual(mixedResults.find(d => d.id === "proof").pct, 38, "3/8 → pct=38 (arrondi)");
  assertEqual(mixedResults.find(d => d.id === "business").pct, 63, "5/8 → pct=63 (arrondi)");

  const first = buildDimensionResults(allMax)[0];
  assert(first.id === "visibility" && first.name === "Visibilité de ton impact" && first.shortName === "Visibilité", "Métadonnées dimension préservées");
});

describe("PERSONA SCENARIOS (Karim/Sophie)", () => {
  // Scenario: SM débutant vulnérable — tout en bas
  const vulnerable = Array(20).fill(2);
  const vulScores = computeDimensionScores(vulnerable);
  const vulPct = computeGlobalScore(vulScores);
  assertEqual(getCategory(vulPct).key, "vulnerable", "All-worst scenario = vulnerable");

  // Scenario: SM moyen — réponses moyennes partout
  const stable = Array(20).fill(1);
  const stabScores = computeDimensionScores(stable);
  const stabPct = computeGlobalScore(stabScores);
  assertEqual(getCategory(stabPct).key, "stable", "All-middle scenario = stable (50%)");

  // Scenario: SM fort visible mais faible en business
  const mixed = [
    0, 0, 0, 0,  // visibility = 8 (strong)
    0, 0, 0, 0,  // proof = 8 (strong)
    2, 2, 2, 2,  // business = 0 (weak!)
    0, 0, 0, 0,  // autonomy = 8 (strong)
    0, 0, 0, 0,  // strategic = 8 (strong)
  ];
  const mixedScores = computeDimensionScores(mixed);
  const mixedPct = computeGlobalScore(mixedScores);
  assertEqual(mixedPct, 80, "Strong everywhere except business = 80%");
  assertEqual(getCategory(mixedPct).key, "irreplaceable", "80% = irreplaceable");
  assertEqual(mixedScores.business, 0, "Business dimension exposed as weakness");
  assertEqual(getDiagnosticLevel(mixedScores.business), "low", "Business gets low diagnostic");
});

// ============================================================
// BUILD ABANDON PAYLOAD
// ============================================================

// Mirrors SCREEN constant and buildAbandonPayload from sm-survival-score.jsx
const SCREEN = { LANDING: "landing", QUIZ: "quiz", RESULT: "result" };

function buildAbandonPayload(screen, currentQ, answers, questions = QUESTIONS_STRUCTURE) {
  if (screen !== SCREEN.QUIZ) return null;
  return {
    questionIndex: currentQ,
    questionNumber: currentQ + 1,
    dimension: questions[currentQ]?.dimension ?? null,
    answersGiven: answers.filter(a => a !== null).length,
  };
}

describe("buildAbandonPayload", () => {
  const emptyAnswers = Array(20).fill(null);

  assert(buildAbandonPayload(SCREEN.LANDING, 0, emptyAnswers) === null,
    "Returns null on landing screen");

  assert(buildAbandonPayload(SCREEN.RESULT, 19, emptyAnswers) === null,
    "Returns null on result screen");

  const p0 = buildAbandonPayload(SCREEN.QUIZ, 0, emptyAnswers);
  assert(p0 !== null, "Returns payload on quiz screen");
  assertEqual(p0.questionIndex, 0, "Q1: questionIndex is 0-based");
  assertEqual(p0.questionNumber, 1, "Q1: questionNumber is 1-based");
  assertEqual(p0.dimension, "visibility", "Q1: dimension is visibility");
  assertEqual(p0.answersGiven, 0, "Q1: 0 answers given on empty quiz");

  // Q17 (index 16) — identifiée comme potentiellement bloquante dans la spec
  const p16 = buildAbandonPayload(SCREEN.QUIZ, 16, emptyAnswers);
  assertEqual(p16.questionIndex, 16, "Q17: questionIndex is 16");
  assertEqual(p16.questionNumber, 17, "Q17: questionNumber is 17");
  assertEqual(p16.dimension, "strategic", "Q17: dimension is strategic");

  // Last question (index 19)
  const p19 = buildAbandonPayload(SCREEN.QUIZ, 19, emptyAnswers);
  assertEqual(p19.questionIndex, 19, "Q20: questionIndex is 19");
  assertEqual(p19.questionNumber, 20, "Q20: questionNumber is 20");
  assertEqual(p19.dimension, "strategic", "Q20: dimension is strategic");

  // answersGiven counts non-null entries
  const partial = [...emptyAnswers];
  partial[0] = 1; partial[3] = 0; partial[7] = 2; partial[11] = 1; partial[15] = 0;
  const pPartial = buildAbandonPayload(SCREEN.QUIZ, 8, partial);
  assertEqual(pPartial.answersGiven, 5, "answersGiven counts only non-null answers");

  // All answers given
  const full = Array(20).fill(0);
  const pFull = buildAbandonPayload(SCREEN.QUIZ, 10, full);
  assertEqual(pFull.answersGiven, 20, "answersGiven = 20 when all answered");

  // Out-of-bounds index returns null dimension
  const pOob = buildAbandonPayload(SCREEN.QUIZ, 99, emptyAnswers);
  assertEqual(pOob.dimension, null, "dimension is null for out-of-bounds index");
});

// ============================================================
// ANALYTICS ENV DETECTION
// ============================================================

// Mirrors detectAnalyticsEnv from sm-survival-score.jsx
function detectAnalyticsEnv(hostname, isDev) {
  if (isDev) return "development";
  if (hostname && hostname.endsWith(".vercel.app")) return "preview";
  return "production";
}

describe("detectAnalyticsEnv", () => {
  assertEqual(detectAnalyticsEnv("localhost", true), "development",
    "npm run dev is always development, regardless of hostname");

  assertEqual(detectAnalyticsEnv("sm-survival-score-git-claude-revision-32a917-pcdenants-projects.vercel.app", false),
    "preview", "Vercel preview deployment hostname is preview");

  assertEqual(detectAnalyticsEnv("smsurvivalscore.com", false), "production",
    "Custom production domain is production");

  assertEqual(detectAnalyticsEnv("", false), "production",
    "Empty/unknown hostname falls back to production");
});

// ============================================================
// WORDING INTEGRITY v1.2 (complete — all 14 questions)
// Reads sm-survival-score.jsx as raw text and checks exact strings.
// ============================================================

describe("WORDING INTEGRITY v1.2 — strings applied", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const expected = [
    // Batch 1 (PR #7)
    "Ces trente derniers jours, as-tu communiqué un résultat chiffré à ton manager ?",
    "J'ai communiqué des résultats, mais rien de chiffré",
    "En dehors des réunions, ton manager pourrait citer de mémoire une contribution concrète de ta part ce trimestre ?",
    // "Oui, j'ai au moins un allié..." et "Je l'utilise pour diagnostiquer..." : tirets cadratins
    // retirés en v1.4, voir "WORDING INTEGRITY v1.4" ci-dessous.
    "Pourrais-tu montrer à ton manager un avant/après chiffré qui prouve l'impact d'une de tes actions ?",
    // "Rarement — j'apprends..." : tiret cadratin retiré en v1.4.
    // Batch 2 (gap changes)
    // "J'ai une réponse précise..." et "Un chiffre ou un fait..." : tirets cadratins retirés en v1.4.
    "Une bonne raison, mais rien à montrer si on avait insisté",
    // "Risque, coût, délai, prédictibilité..." : tiret cadratin retiré en v1.4.
    "Un mix : je traduis parfois en termes business, parfois je reste en mode Scrum",
    // "Le vocabulaire de mon rôle..." et "L'équipe tourne..." : tirets cadratins retirés en v1.4.
    "Ça ralentit. Certaines choses tombent",
    "Les événements sautent ou il faut un back-up",
    // "Oui — et cette personne..." et "Oui, c'est la norme..." : tirets cadratins retirés en v1.4.
    "J'ai commencé, mais c'est pas encore ancré",
    "Il citerait des résultats concrets ou des risques que tu as évités",
    // "Il décrirait ton rôle..." et "On mesurerait une perte concrète..." : tirets cadratins retirés en v1.4.
    "On sentirait un vide, mais personne ne pourrait le chiffrer",
    // Q20 fix
    "Si ton poste disparaissait demain, quelle serait la réaction dans ton organisation ?",
    // "Ça passerait probablement inaperçu..." : tiret cadratin retiré en v1.4.
  ];

  expected.forEach(str => {
    assert(src.includes(str), `PRESENT: "${str.slice(0, 60)}..."`);
  });
});

describe("WORDING INTEGRITY v1.2 — old strings removed", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const removed = [
    // Batch 1 (PR #7)
    "Dans le dernier mois, as-tu communiqué à ton manager un résultat visible et chiffré de tes actions en tant que SM ?",
    "J'ai communiqué des choses, mais rien de chiffré",
    "Mis à part la facilitation des réunions, ton manager pourrait citer de mémoire une contribution concrète que tu as faite ce trimestre ?",
    "Oui, j'ai au moins un allié qui tient à moi spécifiquement",
    "J'en tire des signaux pour suivre la santé de mon équipe et agir",
    "Pourrais-tu montrer à ton manager un avant/après chiffré qui prouve qu'une de tes actions a amélioré quelque chose ?",
    "Jamais, je suis mis devant le fait accompli",
    // Batch 2 (gap changes)
    "J'ai une réponse claire et concrète",
    "Des données ou des faits observables",
    "Mon expérience et mon instinct",
    "Risque, coût, délai, prédictibilité\"",
    "Un mix de Scrum et de business, selon le contexte",
    "Vélocité, sprint goal, impediments, backlog",
    "L'équipe tourne normalement",
    "Ça ralentit, certaines choses tombent",
    "C'est le chaos, les événements sautent",
    "L'équipe s'en charge elle-même",
    "Un collègue prend le relais",
    "Oui, c'est la norme\"",
    "En parlant de résultats ou de performance d'équipe",
    "« C'est notre Scrum Master, il gère les cérémonies Scrum »",
    "Faible — ma valeur est démontrée",
    "Moyen — ça dépendrait du contexte",
    // Q20 fix
    "Si ton entreprise annonçait une réduction de coûts demain, comment tu classerais le risque pour ton poste ?",
    "Élevé — je serais probablement sur la liste",
  ];

  removed.forEach(str => {
    assert(!src.includes(str), `REMOVED: "${str.slice(0, 60)}..."`);
  });
});

// ============================================================
// WORDING INTEGRITY v1.4 (tirets cadratins retirés des réponses du quiz —
// voix éditoriale : ponctuation seule, aucun changement de sens ni de score)
// ============================================================

describe("WORDING INTEGRITY v1.4 — em dash removal applied", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const expected = [
    "J'ai une réponse précise (avec un chiffre ou un exemple concret derrière)",
    "toi (pas juste pour garder un SM dans l'équipe) ?",
    "Oui, j'ai au moins un allié qui tient à moi (pas juste au rôle)",
    "Je l'utilise pour diagnostiquer ce qui bloque, et décider quoi faire",
    "Je ne l'utilise pas comme outil de diagnostic : je m'appuie sur ce que j'observe en réunion",
    "Un chiffre ou un fait : j'aurais pu me défendre si on m'avait poussé",
    "Risque, coût, délai, prédictibilité (avec des chiffres pour illustrer)",
    "Le vocabulaire de mon rôle (sprint, backlog, rétro), je traduis rarement",
    "Rarement : j'apprends la décision en même temps que tout le monde",
    "L'équipe tourne, et je peux expliquer comment j'ai construit ça",
    "Oui, et cette personne l'a déjà fait sans moi",
    "Non : je facilite tout moi-même",
    "Oui, c'est la norme : j'ai activement construit ça",
    "Il décrirait ton rôle (facilitation, cérémonies Scrum), sans l'accrocher à aucun résultat",
    "Avant la décision : on me consulte",
    "Après la décision : on m'informe en même temps que tout le monde",
    "(pas \\\"faciliter les retros\\\" : un résultat)",
    "On mesurerait une perte concrète : une livraison ralentie, un risque non géré",
    "Ça passerait probablement inaperçu : quelqu'un absorberait le rôle rapidement",
  ];

  expected.forEach(str => {
    assert(src.includes(str), `PRESENT: "${str.slice(0, 60)}..."`);
  });
});

describe("WORDING INTEGRITY v1.4 — old em dash strings removed", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const removed = [
    "J'ai une réponse précise — avec un chiffre ou un exemple concret derrière",
    "toi — pas juste pour garder un SM dans l'équipe ?",
    "Oui, j'ai au moins un allié qui tient à moi — pas juste au rôle",
    "Je l'utilise pour diagnostiquer ce qui bloque — et décider quoi faire",
    "Je ne l'utilise pas comme outil de diagnostic — je m'appuie sur ce que j'observe en réunion",
    "Un chiffre ou un fait — j'aurais pu me défendre si on m'avait poussé",
    "Risque, coût, délai, prédictibilité — avec des chiffres pour illustrer",
    "Le vocabulaire de mon rôle (sprint, backlog, rétro) — je traduis rarement",
    "Rarement — j'apprends la décision en même temps que tout le monde",
    "L'équipe tourne — et je peux expliquer comment j'ai construit ça",
    "Oui — et cette personne l'a déjà fait sans moi",
    "Non — je facilite tout moi-même",
    "Oui, c'est la norme — j'ai activement construit ça",
    "Il décrirait ton rôle — facilitation, cérémonies Scrum — sans l'accrocher à aucun résultat",
    "Avant la décision — on me consulte",
    "Après la décision — on m'informe en même temps que tout le monde",
    "(pas \\\"faciliter les retros\\\" — un résultat)",
    "On mesurerait une perte concrète — une livraison ralentie, un risque non géré",
    "Ça passerait probablement inaperçu — quelqu'un absorberait le rôle rapidement",
  ];

  removed.forEach(str => {
    assert(!src.includes(str), `REMOVED: "${str.slice(0, 60)}..."`);
  });
});

// ============================================================
// WORDING INTEGRITY v1.3 (textes globaux — SPEC P1)
// ============================================================

describe("WORDING INTEGRITY v1.3 — global texts applied", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const expected = [
    "La question n'est pas si tu mérites ce poste.",
    "Avec ce score, probablement non.",
    "Les rôles agile qui ont été coupés chez Capital One",
    "La matière est souvent là. C'est la traduction qui manque.",
    "Sauf que « stable » a une durée de validité.",
    "quelqu'un doit défendre ton poste en 5 minutes",
    "La plupart des SMs qui font ce test n'arrivent pas ici.",
    "Ce qui te rend irremplaçable aujourd'hui ne te le reste pas automatiquement.",
    "Le genre de trou qui ne se voit pas tant qu'on ne le cherche pas activement.",
  ];

  expected.forEach(str => {
    assert(src.includes(str), `PRESENT: "${str.slice(0, 60)}..."`);
  });
});

describe("WORDING INTEGRITY v1.3 — old global texts removed", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const removed = [
    "Soyons clairs. Si quelqu'un dans ta direction",
    "Ton travail est invisible. Tes preuves n'existent pas.",
    "les coupes chez Fidelity, les banques UK",
    "Chaque zone de vulnérabilité ci-dessous peut se corriger.",
    "Ton management sait à peu près ce que tu fais",
    "Ton impact est visible, tes preuves existent",
    "Tu tiens le coup. Mais tu as des angles morts.",
    "Tu es bien positionné. Ne lâche rien.",
  ];

  removed.forEach(str => {
    assert(!src.includes(str), `REMOVED: "${str.slice(0, 60)}..."`);
  });
});

// ============================================================
// ALGORITHME PONDÉRÉ — getPriorityDimension
// ============================================================

// ─── Miroir des fonctions depuis sm-survival-score.jsx ─────────────────────

const DIMENSION_WEIGHTS = {
  visibility: 5,
  strategic: 4,
  proof: 3,
  business: 2,
  autonomy: 1,
};

const DIMENSIONS_BY_WEIGHT_DESC = ['visibility', 'strategic', 'proof', 'business', 'autonomy'];

function computePriorityScore(scorePct, dimId) {
  return (1 - scorePct / 100) * DIMENSION_WEIGHTS[dimId];
}

function getPriorityDimension(dimensionScoresPct) {
  let maxPs = -1;
  let priorityId = null;
  for (const id of DIMENSIONS_BY_WEIGHT_DESC) {
    const ps = computePriorityScore(dimensionScoresPct[id], id);
    if (ps > maxPs) { maxPs = ps; priorityId = id; }
  }
  return priorityId;
}

function getOrderedDimensions(dimensionScoresPct) {
  return [...DIMENSIONS_BY_WEIGHT_DESC]
    .map(id => ({ id, ps: computePriorityScore(dimensionScoresPct[id], id) }))
    .sort((a, b) => b.ps !== a.ps ? b.ps - a.ps : DIMENSION_WEIGHTS[b.id] - DIMENSION_WEIGHTS[a.id])
    .map(({ id }) => id);
}

// ───────────────────────────────────────────────────────────────────────────

describe("getPriorityDimension", () => {
  // Cas clé de la SPEC : autonomy=0% ne doit pas gagner face à visibility=40%
  assertEqual(
    getPriorityDimension({ visibility: 40, proof: 60, business: 70, autonomy: 0, strategic: 60 }),
    "visibility",
    "autonomy=0%, visibility=40% → visibility gagne (poids survie > score brut)"
  );

  assertEqual(
    getPriorityDimension({ visibility: 0, proof: 0, business: 0, autonomy: 0, strategic: 0 }),
    "visibility",
    "tous à 0% → visibility (poids maximal)"
  );

  assertEqual(
    getPriorityDimension({ visibility: 100, proof: 75, business: 80, autonomy: 50, strategic: 0 }),
    "strategic",
    "visibility=100%, strategic=0% → strategic"
  );

  // Tie-break : visibility=50% → ps=(0.5)×5=2.5 | strategic=37.5% → ps=(0.625)×4=2.5
  assertEqual(
    getPriorityDimension({ visibility: 50, proof: 80, business: 90, autonomy: 80, strategic: 37.5 }),
    "visibility",
    "tie-break : ps égal à 2.5 pour visibility et strategic → visibility gagne (poids 5 > 4)"
  );

  // Profil avancé : visibility=80%: ps=1.0 | strategic=75%: ps=1.0 | proof=20%: ps=2.4
  assertEqual(
    getPriorityDimension({ visibility: 80, proof: 20, business: 75, autonomy: 0, strategic: 75 }),
    "proof",
    "profil avancé (visibility/strategic forts, proof=20%) → proof prioritaire"
  );

  assertEqual(
    getPriorityDimension({ visibility: 100, proof: 100, business: 100, autonomy: 100, strategic: 100 }),
    "visibility",
    "tous à 100% → visibility (tous ps=0, visibility en tête par ordre de parcours)"
  );
});

// ============================================================
// ALGORITHME PONDÉRÉ — getOrderedDimensions
// ============================================================

describe("getOrderedDimensions", () => {
  assert(
    getOrderedDimensions({ visibility: 50, proof: 50, business: 50, autonomy: 50, strategic: 50 }).length === 5,
    "retourne 5 dimensions"
  );

  const scores1 = { visibility: 40, proof: 60, business: 70, autonomy: 0, strategic: 55 };
  assert(
    getOrderedDimensions(scores1)[0] === getPriorityDimension(scores1),
    "premier élément = getPriorityDimension()"
  );

  // visibility/strategic/proof/business=100% → ps=0. autonomy=0% → ps=1.
  // Ordre : autonomy(ps=1), puis tie-break décroissant par poids parmi ps=0
  const scores2 = { visibility: 100, proof: 100, business: 100, autonomy: 0, strategic: 100 };
  const ordered2 = getOrderedDimensions(scores2);
  assertEqual(ordered2[0], "autonomy", "autonomy seule dimension non résolue → première");
  assertEqual(ordered2[4], "business", "tie-break en bas : poids le plus faible (business=2) → dernier");
});

// ============================================================
// WORDING INTEGRITY — PrioritySignal texts
// ============================================================

describe("WORDING INTEGRITY — PrioritySignal texts applied", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const expected = [
    "Ton angle mort le plus urgent : ce que ton management retient de toi.",
    "Tant que cette dimension reste faible, le reste ne protège pas ton poste.",
    "Ton angle mort le plus urgent : comment tu es perçu.",
    "la perception de ton rôle s'est figée à un niveau trop bas.",
    "Ton angle mort le plus urgent : tes preuves.",
    "Ce trou-là, il se referme. Mais pas tout seul.",
    "Ton angle mort le plus urgent : ton langage.",
    "C'est la dernière étape, et souvent la plus manquée.",
    "Ton angle mort le plus urgent : l'autonomie de ton équipe.",
    "perçu comme une dépendance, pas comme une valeur.",
  ];

  expected.forEach(str => {
    assert(src.includes(str), `PRESENT: "${str.slice(0, 70)}"`);
  });
});

// ============================================================
// WORDING INTEGRITY — variante « dimension déjà solide »
//
// PrioritySignal affichait « tant que cette dimension reste faible » même au-dessus
// d'une carte « Solide — 8/8 ». Ces tests vérifient que la variante existe pour les
// 5 dimensions et que les deux rendus (écran + PDF) passent par le même sélecteur.
// ============================================================

describe("WORDING INTEGRITY — SIGNAL_TEXTS_HIGH", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  const highBlock = src.slice(src.indexOf("const SIGNAL_TEXTS_HIGH"), src.indexOf("export function getSignalText"));
  assert(highBlock.length > 0, "PRESENT: const SIGNAL_TEXTS_HIGH");

  ["visibility", "strategic", "proof", "business", "autonomy"].forEach(dim => {
    assert(new RegExp(`\\b${dim}:\\s*\\{`).test(highBlock), `SIGNAL_TEXTS_HIGH couvre la dimension ${dim}`);
  });

  const titleCount = (highBlock.match(/title:/g) || []).length;
  const bodyCount = (highBlock.match(/body:/g) || []).length;
  assertEqual(titleCount, 5, "SIGNAL_TEXTS_HIGH a 5 titres");
  assertEqual(bodyCount, 5, "SIGNAL_TEXTS_HIGH a 5 corps de texte");

  // La variante ne doit pas réutiliser le vocabulaire « angle mort / reste faible »
  assert(!/angle mort/.test(highBlock), "SIGNAL_TEXTS_HIGH n'annonce pas un « angle mort »");
  assert(!/reste faible/.test(highBlock), "SIGNAL_TEXTS_HIGH ne dit pas « reste faible »");

  // Les deux rendus passent par le sélecteur, sinon le PDF peut se contredire seul
  assert(src.includes("getSignalText(priorityDimId, level)"), "PrioritySignal utilise getSignalText");
  assert(src.includes("getSignalText(priorityDimId, priorityLevel)"), "PDFDocument utilise getSignalText");
  assert(!/const signal = SIGNAL_TEXTS\[/.test(src), "ABSENT: accès direct à SIGNAL_TEXTS hors du sélecteur");
  assert(src.includes("level={getDiagnosticLevel(priorityDimResult.score)}"), "PRESENT: le niveau est passé à PrioritySignal");
});

// ============================================================
// UNLOCK — le rapport reste accessible, le modal reste pilotable au clavier
// ============================================================

describe("UNLOCK — accès persistant et accessibilité du modal", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  // generatePDF n'était appelable que depuis le modal : le fermer perdait le rapport
  const pdfCallSites = (src.match(/await generatePDF\(pdfProps\)/g) || []).length;
  assertEqual(pdfCallSites, 2, "generatePDF est atteignable depuis le modal ET la page");
  assert(src.includes("Mon rapport (PDF)"), "PRESENT: bouton PDF persistant après déverrouillage");
  assert(src.includes("unlocked && ("), "PRESENT: le bouton PDF persistant est conditionné à unlocked");

  // Le libellé accessible doit rester distinct de celui du modal, sinon le test e2e
  // getByRole(/Télécharger mon rapport/) matche deux boutons et casse en mode strict
  assert(!src.includes('aria-label="Télécharger mon rapport'), "le bouton persistant n'entre pas en collision avec le libellé du modal");

  assert(src.includes('e.key === "Escape"'), "PRESENT: fermeture du modal par Escape");
  assert(src.includes('aria-label="Fermer"'), "PRESENT: bouton de fermeture visible");
  // `previouslyFocused = document.activeElement` ne pouvait pas marcher : setUnlocked et
  // setShowModal partent dans le même commit, donc le bouton qui avait le focus est déjà
  // démonté quand l'effet le lit — on capturait <body>. Le parent passe donc une cible qui survit.
  assert(!src.includes("previouslyFocused"), "ABSENT: capture d'activeElement déjà démonté");
  assert(src.includes("onRestoreFocus"), "PRESENT: restauration du focus vers une cible qui survit");
  assert(src.includes("unlockedNoticeRef.current?.focus()"), "PRESENT: le focus revient sur la confirmation");
  assert(src.includes("headingRef.current?.focus()"), "PRESENT: focus déplacé dans le modal à l'ouverture");
  assert(src.includes('e.key !== "Tab"'), "PRESENT: piège à focus sur Tab");

  // L'ancre pointait vers #unlock-form, supprimé du DOM une fois débloqué
  assert(src.includes("unlocked && rawCardArticle?.cta ? null : rawCardArticle"),
    "PRESENT: la CTA d'abonnement disparaît une fois débloqué (ancre morte)");
});

// ============================================================
// SIDE-TAB — bordures de sévérité supprimées
//
// Le badge de niveau (« À renforcer — 4/8 », texte coloré sur fond teinté) encode
// déjà la sévérité sur chaque carte : la bordure gauche colorée en était une
// seconde copie. Ce test épingle la décision pour que le motif ne revienne pas.
// ============================================================

describe("SIDE-TAB — plus de bordure latérale de sévérité", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  assert(!/borderLeft/.test(src), "ABSENT: borderLeft (les 4 bordures side-tab sont supprimées)");

  // Le badge doit toujours porter la couleur de catégorie, sinon on a perdu l'info
  assert(/color: cat\.color, padding/.test(src), "PRESENT: le badge de carte porte toujours cat.color");
  assert(/background: dimCategory\.color/.test(src), "PRESENT: les barres portent toujours la couleur de catégorie");
});

// ============================================================
// CONSENTEMENT — ce à quoi on s'abonne est dit AVANT de soumettre
// ============================================================

describe("CONSENTEMENT — mention sous le champ email", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  const form = src.slice(src.indexOf("function GhostSignupForm"), src.indexOf("function UnlockModal"));

  assert(form.includes("Un email par semaine. Désabonnement en un clic."),
    "PRESENT: fréquence + désabonnement, dans le formulaire lui-même");

  // Composite la couleur sur T.vert et vérifie AA. rgba(255,255,255,.7) échoue (4.17:1),
  // .8 passe (4.94:1) — le test empêche de recopier le .733 voisin qui échoue déjà.
  const alphaMatch = form.match(/color: "rgba\(255,255,255,\.(\d+)\)"/);
  assert(alphaMatch, "PRESENT: la mention utilise une couleur rgba explicite");
  const alpha = Number(`0.${alphaMatch[1]}`);
  const vert = [0x00, 0x69, 0x46];
  const composited = "#" + vert.map(c => Math.round(255 * alpha + c * (1 - alpha)).toString(16).padStart(2, "0")).join("");
  const ratio = contrastRatio(composited, "#006946");
  assert(ratio >= 4.5, `mention de consentement: ${composited} sur T.vert = ${ratio.toFixed(2)}:1 (≥ 4.5:1 requis)`);
});

// ============================================================
// COMPOSITION — la sévérité se lit sans lire les pastilles
//
// Trois critiques ont relevé que cinq cartes empilées se lisaient comme cinq bandes
// identiques : la sévérité ne vivait que dans une pastille de 11px. Elle passe dans la
// composition (rang, traitement de la carte prioritaire) et dans un classement unique
// partagé par les barres, le dossier de cartes et le PDF.
// ============================================================

describe("COMPOSITION — rang et classement unique", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  const resultScreen = src.slice(src.indexOf("function ResultScreen"), src.indexOf("APP ROOT"));

  // Un seul classement : les barres suivaient DIMENSIONS (ordre éditorial fixe) pendant que
  // le dossier suivait la priorité pondérée — deux ordres pour les mêmes 5 dimensions.
  assert(resultScreen.includes("orderedDimResults.map((dim, i)"), "les barres suivent le classement pondéré");
  assert(!resultScreen.includes("dimensionResults.map((dim, i)"), "ABSENT: ancien ordre éditorial des barres");
  assert(resultScreen.includes("isPriority") && resultScreen.includes("priorité"),
    "PRESENT: la dimension prioritaire est marquée dans les barres (le PDF le faisait déjà, pas l'écran)");

  // Le rang doit atteindre les cartes verrouillées aussi, sinon le classement disparaît
  // juste avant le formulaire — là où il sert d'argument.
  assert(/rank=\{1\}/.test(resultScreen), "carte prioritaire: rank=1");
  assert(/rank=\{i \+ 2\}/.test(resultScreen), "cartes suivantes: rang continu");
  assert((resultScreen.match(/rank=\{i \+ 2\}/g) || []).length === 2,
    "le rang est passé aux cartes déverrouillées ET verrouillées");

  const card = src.slice(src.indexOf("function DiagnosticCard"), src.indexOf("function LockedDiagnosticCard"));
  assert(card.includes("Priorité 1 : commence ici"), "PRESENT: en-tête de la carte prioritaire");
  assert(card.includes("{rank ?? \"1\"}"), "le disque numéroté porte le rang réel");
  assert(!/>1<\/div>/.test(card), "ABSENT: disque « 1 » codé en dur sur les cinq cartes");
});

// ============================================================
// STRUCTURE DES TITRES — h1 → h2 → h3, sans saut
// ============================================================

describe("A11Y — hiérarchie des titres de l'écran résultat", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  const resultScreen = src.slice(src.indexOf("function ResultScreen"), src.indexOf("APP ROOT"));

  assert(/<h1 aria-label={`Score : \${globalScore} sur 100`}/.test(resultScreen),
    "le score porte le h1 (il était en <div>, jamais annoncé comme titre)");
  // « Ton profil » (le radar) a été retiré de l'écran : il rendait les mêmes 5 chiffres que
  // les barres, en moins lisible. Il subsiste dans le PDF et la carte de score.
  assert(!resultScreen.includes("RadarChart"), "ABSENT: radar à l'écran (doublon des barres)");
  ["Par dimension", "Diagnostic par dimension"].forEach(label => {
    assert(new RegExp(`<h2[^>]*>${label}</h2>`).test(resultScreen), `section « ${label} » en h2`);
  });
  assert(!/<h4/.test(src), "ABSENT: h4 (les titres de carte sont passés en h3)");
});

// ============================================================
// STORAGE UTILITIES
// ============================================================

// Mirror of storage functions from sm-survival-score.jsx for Node.js testing
const STORAGE_KEY_TEST = "sm-survival-score-state";
const VALID_SCREENS_TEST = ["landing", "quiz", "result"];
const QUESTIONS_COUNT_TEST = 20;

function isValidQuizStateTest(state) {
  if (!state || typeof state !== "object") return false;
  if (!Array.isArray(state.answers) || state.answers.length !== QUESTIONS_COUNT_TEST) return false;
  if (!state.answers.every(a => a === null || a === 0 || a === 1 || a === 2)) return false;
  if (typeof state.currentQ !== "number" || state.currentQ < 0 || state.currentQ >= QUESTIONS_COUNT_TEST) return false;
  if (!VALID_SCREENS_TEST.includes(state.screen)) return false;
  return true;
}

function saveQuizStateTest(state) {
  try { localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(state)); } catch (_) {}
}

function loadQuizStateTest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidQuizStateTest(parsed)) return null;
    return parsed;
  } catch (_) { return null; }
}

function clearQuizStateTest() {
  try { localStorage.removeItem(STORAGE_KEY_TEST); } catch (_) {}
}

function makeMockLocalStorage() {
  const store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
}

const freshAnswers = () => Array(QUESTIONS_COUNT_TEST).fill(null);
const partialAnswers = () => { const a = freshAnswers(); a[0] = 0; a[1] = 2; a[2] = 1; a[3] = 0; a[4] = 1; return a; };

describe("STORAGE UTILITIES", () => {
  // Test 1: returns null when storage is empty
  global.localStorage = makeMockLocalStorage();
  assert(loadQuizStateTest() === null, "loadQuizState returns null when storage empty");

  // Test 2: round-trip — save then load returns identical state
  const stateToSave = { answers: partialAnswers(), currentQ: 5, screen: "quiz" };
  global.localStorage = makeMockLocalStorage();
  saveQuizStateTest(stateToSave);
  const loaded = loadQuizStateTest();
  assertEqual(loaded, stateToSave, "round-trip: saveQuizState then loadQuizState returns identical state");

  // Test 3: clearQuizState removes the key
  global.localStorage = makeMockLocalStorage();
  saveQuizStateTest({ answers: freshAnswers(), currentQ: 0, screen: "landing" });
  clearQuizStateTest();
  assert(loadQuizStateTest() === null, "clearQuizState removes stored state");

  // Test 4: corrupted JSON is rejected
  global.localStorage = makeMockLocalStorage();
  global.localStorage.setItem(STORAGE_KEY_TEST, "not-valid-json{{{");
  assert(loadQuizStateTest() === null, "loadQuizState returns null for corrupted JSON");

  // Test 5: wrong answers length is rejected
  global.localStorage = makeMockLocalStorage();
  const tooShort = { answers: [0, 1, 2], currentQ: 0, screen: "quiz" };
  global.localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(tooShort));
  assert(loadQuizStateTest() === null, "loadQuizState returns null when answers array has wrong length");

  // Test 6: invalid answer value (3) is rejected
  global.localStorage = makeMockLocalStorage();
  const badAnswers = freshAnswers(); badAnswers[0] = 3;
  const badAnswerState = { answers: badAnswers, currentQ: 0, screen: "quiz" };
  global.localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(badAnswerState));
  assert(loadQuizStateTest() === null, "loadQuizState returns null when answers contain invalid value (3)");

  // Test 7: out-of-bounds currentQ is rejected
  global.localStorage = makeMockLocalStorage();
  const badQ = { answers: freshAnswers(), currentQ: 99, screen: "quiz" };
  global.localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(badQ));
  assert(loadQuizStateTest() === null, "loadQuizState returns null when currentQ is out of bounds");

  // Test 8: invalid screen value is rejected
  global.localStorage = makeMockLocalStorage();
  const badScreen = { answers: freshAnswers(), currentQ: 0, screen: "unknown" };
  global.localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(badScreen));
  assert(loadQuizStateTest() === null, "loadQuizState returns null when screen value is invalid");

  // Test 9: saveQuizState does not throw when localStorage throws
  global.localStorage = { setItem: () => { throw new Error("QuotaExceededError"); }, getItem: () => null, removeItem: () => {} };
  let threw = false;
  try { saveQuizStateTest({ answers: freshAnswers(), currentQ: 0, screen: "landing" }); } catch (_) { threw = true; }
  assert(!threw, "saveQuizState does not throw when localStorage throws");

  // Test 10: valid partial-progress state (quiz mid-way) is accepted
  global.localStorage = makeMockLocalStorage();
  const midState = { answers: partialAnswers(), currentQ: 5, screen: "quiz" };
  saveQuizStateTest(midState);
  const midLoaded = loadQuizStateTest();
  assert(midLoaded !== null && midLoaded.currentQ === 5 && midLoaded.screen === "quiz", "loadQuizState correctly restores mid-quiz state");
});

// ============================================================
// FORM MIGRATION — Kit → Ghost
// ============================================================

describe("MODAL UNLOCK — wording integrity", () => {
  const srcJsx = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  assert(srcJsx.includes("Diagnostics déverrouillés"),       "PRESENT: modal title");
  assert(srcJsx.includes("Vérifie aussi tes spams"),         "PRESENT: spam warning");
  assert(srcJsx.includes("Télécharger mon rapport"),         "PRESENT: PDF button");
  assert(srcJsx.includes("Voir mes résultats"),              "PRESENT: close button");
  assert(!srcJsx.includes("C'est débloqué. Tu recevras"),   "REMOVED: old banner text");
});

describe("FORM MIGRATION — Kit → Ghost", () => {
  const srcJsx = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  assert(!srcJsx.includes("da72eeaa73"),                   "REMOVED: Kit embed UID da72eeaa73");
  assert(!srcJsx.includes("collaboration-solved.kit.com"), "REMOVED: Kit embed script URL");
  assert(!srcJsx.includes("useKitFormUnlock"),             "REMOVED: useKitFormUnlock hook");
  assert(srcJsx.includes("GhostSignupForm"),               "PRESENT: GhostSignupForm component");
  assert(srcJsx.includes("/api/subscribe"),                "PRESENT: /api/subscribe fetch");
});

// ============================================================
// CHAPTER NAVIGATION — logique isChapterEnd / handleNext
// ============================================================

describe("CHAPTER NAVIGATION — isChapterEnd logic", () => {
  const QS_PER_DIM = 4;
  const TOTAL = 20;

  function isChapterEnd(currentQ) {
    const isLast = currentQ === TOTAL - 1;
    return (currentQ + 1) % QS_PER_DIM === 0 && !isLast;
  }

  function completedDimIndexFn(currentQ) {
    return Math.floor(currentQ / QS_PER_DIM);
  }

  // Les 4 indices qui terminent une dimension (sans être le dernier Q)
  assert(isChapterEnd(3),  "Q4  (idx 3)  → fin dim Visibilité  → chapter reveal");
  assert(isChapterEnd(7),  "Q8  (idx 7)  → fin dim Preuves     → chapter reveal");
  assert(isChapterEnd(11), "Q12 (idx 11) → fin dim Business    → chapter reveal");
  assert(isChapterEnd(15), "Q16 (idx 15) → fin dim Autonomie   → chapter reveal");

  // Q20 est la fin d'une dimension ET la dernière question → pas de reveal
  assert(!isChapterEnd(19), "Q20 (idx 19) → dernier Q → pas de chapter reveal, direct résultats");

  // Questions intermédiaires → pas de reveal
  assert(!isChapterEnd(0),  "Q1  (idx 0)  → milieu de dim → pas de reveal");
  assert(!isChapterEnd(4),  "Q5  (idx 4)  → début dim 2  → pas de reveal");
  assert(!isChapterEnd(9),  "Q10 (idx 9)  → milieu de dim → pas de reveal");
  assert(!isChapterEnd(16), "Q17 (idx 16) → début dim 5  → pas de reveal");

  // completedDimIndex identifie correctement la dim terminée
  assertEqual(completedDimIndexFn(3),  0, "Q4  → complète dim 0 (Visibilité)");
  assertEqual(completedDimIndexFn(7),  1, "Q8  → complète dim 1 (Preuves)");
  assertEqual(completedDimIndexFn(11), 2, "Q12 → complète dim 2 (Business)");
  assertEqual(completedDimIndexFn(15), 3, "Q16 → complète dim 3 (Autonomie)");

  // nextDimIndex est toujours completedDimIndex + 1 (pas de out-of-bounds sur Q4/Q8/Q12/Q16)
  [3, 7, 11, 15].forEach(q => {
    const completed = completedDimIndexFn(q);
    assert(completed + 1 < 5, `Q${q + 1} → nextDimIndex ${completed + 1} est dans les bounds (< 5 dims)`);
  });
});

describe("CHAPTER NAVIGATION — lettres réponses A/B/C", () => {
  const ANSWER_LETTERS_TEST = ["A", "B", "C"];
  assertEqual(ANSWER_LETTERS_TEST[0], "A", "index 0 → lettre A");
  assertEqual(ANSWER_LETTERS_TEST[1], "B", "index 1 → lettre B");
  assertEqual(ANSWER_LETTERS_TEST[2], "C", "index 2 → lettre C");
  assertEqual(ANSWER_LETTERS_TEST.length, 3, "exactement 3 lettres pour 3 réponses");

  // Raccourcis clavier : mapping touche → index
  const keyToIndex = (key) => ANSWER_LETTERS_TEST.indexOf(key.toUpperCase());
  assertEqual(keyToIndex("a"), 0, "touche 'a' → index 0");
  assertEqual(keyToIndex("B"), 1, "touche 'B' → index 1");
  assertEqual(keyToIndex("c"), 2, "touche 'c' → index 2");
  assertEqual(keyToIndex("D"), -1, "touche 'D' → -1 (non mappé)");
  assertEqual(keyToIndex(" "), -1, "espace → -1 (non mappé)");
  assertEqual(keyToIndex("Enter"), -1, "Enter → -1 (non mappé)");
});

describe("SOURCE INTEGRITY — nouveaux composants UX", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  assert(src.includes("ChapterRevealScreen"),   "PRESENT: composant ChapterRevealScreen");
  assert(src.includes("Dimension complète"),    "PRESENT: texte chapter reveal 'Dimension complète'");
  assert(src.includes("Clique pour continuer"), "PRESENT: texte hint 'Clique pour continuer'");
  assert(src.includes("answerPulse"),           "PRESENT: @keyframes answerPulse");
  assert(src.includes("countdown"),             "PRESENT: @keyframes countdown");
  assert(src.includes("ANSWER_LETTERS"),        "PRESENT: constante ANSWER_LETTERS (badges A/B/C)");
  assert(src.includes("chapterReveal"),         "PRESENT: état chapterReveal dans SMSurvivalScore");
  assert(src.includes("handleChapterRevealDone"), "PRESENT: handler handleChapterRevealDone");
  assert(src.includes("isChapterEnd"),          "PRESENT: logique isChapterEnd dans handleNext");
  assert(src.includes("userJustSelectedRef"),   "PRESENT: ref userJustSelectedRef (anti-faux-avance)");
  assert(src.includes("Se déplace automatiquement"), "PRESENT: hint auto-advance Q1");
  assert(src.includes("Raccourcis clavier"),    "PRESENT: texte hint raccourcis clavier");
  assert(src.includes("data-testid=\"chapter-reveal\""), "PRESENT: data-testid sur ChapterRevealScreen");

  // Vérifier que les anciens boutons "Suivant" / "Voir mon résultat" ne sont plus dans QuestionScreen
  // (ils peuvent exister ailleurs, on vérifie leur absence dans la zone QuestionScreen)
  assert(!src.includes("Question suivante"),  "REMOVED: aria-label 'Question suivante' (remplacé par auto-advance)");
  assert(!src.includes("Voir mon résultat"), "REMOVED: texte 'Voir mon résultat' (remplacé par auto-advance)");
});

// ============================================================
// UI CHANGES v2.0 — source integrity
// ============================================================

describe("UI CHANGES v2.0 — source integrity", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  // Changement 3 — PrioritySignal brand colors
  assert(!src.includes("'#1a1a2e'"), "REMOVED: backgroundColor #1a1a2e (PrioritySignal off-brand)");
  // Le super-label « ⚡ Signal prioritaire » a été retiré de l'écran (distill, PR #45) mais reste
  // dans le PDF. L'assertion pleine-source passait donc pour la mauvaise raison : elle était
  // satisfaite par PDFDocument alors qu'elle prétendait vérifier PrioritySignal. On cible chacun.
  const prioritySignalSrc = src.slice(src.indexOf("function PrioritySignal"), src.indexOf("function BentoCard"));
  const pdfDocumentSrc = src.slice(src.indexOf("function PDFDocument"), src.indexOf("function buildRadarPolygon"));
  assert(!prioritySignalSrc.includes("⚡ Signal prioritaire"), "ABSENT: super-label retiré de PrioritySignal (écran)");
  assert(pdfDocumentSrc.includes("⚡ Signal prioritaire"), "PRESENT: super-label conservé dans le PDF");

  // Changement 4 — DiagnosticCard hiérarchie inversée
  assert(src.includes("Lire l'analyse complète"), "PRESENT: expander text DiagnosticCard");
  assert(src.includes("Action cette semaine"), "PRESENT: action label DiagnosticCard");
  assert(src.includes("IconClock") && src.includes("5 minutes"), "PRESENT: time estimate DiagnosticCard");

  // Changement 5 — LockedDiagnosticCard score visible
  assert(!src.includes("blur(6px)"), "REMOVED: blur(6px) locked cards");
  assert(!src.includes("Lorem ipsum"), "REMOVED: Lorem ipsum placeholder");
  assert(src.includes("Voir le diagnostic →"), "PRESENT: CTA locked card");
  assert(src.includes("IconUnlock") && src.includes("Analyse + action concrète"), "PRESENT: hint locked card");

  // Changement 6 — Unlock form personnalisé
  assert(src.includes("4 diagnostics verrouillés"), "PRESENT: unlock form label count");
  assert(src.includes("displayLockedDim"), "PRESENT: variable personnalisation displayLockedDim");
  assert(src.includes("setFocusedLockedDim"), "PRESENT: unlock form suit la carte cliquée");

  // Changement 7 — Responsive bars shortName
  assert(src.includes("dim.shortName"), "PRESENT: dim.shortName dans bars card");
});

// ============================================================
// ANALYTICS — nouvelles fonctionnalités
// ============================================================

function generateUUIDTest() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

describe("ANALYTICS — generateUUID (fallback)", () => {
  const id1 = generateUUIDTest();
  const id2 = generateUUIDTest();
  assert(typeof id1 === "string" && id1.length === 36, "UUID est une string de 36 caractères");
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id1), "UUID respecte le format RFC4122 v4");
  assert(id1 !== id2, "generateUUID retourne des valeurs uniques");
});

describe("ANALYTICS — getOrCreateDeviceId", () => {
  const DEVICE_ID_KEY_TEST = "sm-device-id";

  function getOrCreateDeviceIdTest(storage) {
    try {
      let id = storage.getItem(DEVICE_ID_KEY_TEST);
      if (!id) { id = generateUUIDTest(); storage.setItem(DEVICE_ID_KEY_TEST, id); }
      return id;
    } catch (_) { return "unknown"; }
  }

  const storage = makeMockLocalStorage();
  const id1 = getOrCreateDeviceIdTest(storage);
  assert(typeof id1 === "string" && id1.length > 0, "crée un deviceId non-vide");

  const id2 = getOrCreateDeviceIdTest(storage);
  assert(id1 === id2, "retourne le même deviceId sur les appels suivants (persistance)");

  const badStorage = { getItem: () => { throw new Error("denied"); }, setItem: () => {}, removeItem: () => {} };
  assert(getOrCreateDeviceIdTest(badStorage) === "unknown", "retourne 'unknown' si localStorage inaccessible");
});

describe("ANALYTICS — sessionId persistence + clearQuizState étendu", () => {
  const COMPLETED_TRACKED_KEY_TEST = "sm-quiz-completed-tracked";

  function clearQuizStateExtendedTest(storage) {
    try {
      storage.removeItem(STORAGE_KEY_TEST);
      storage.removeItem(COMPLETED_TRACKED_KEY_TEST);
    } catch (_) {}
  }

  // Round-trip avec sessionId
  global.localStorage = makeMockLocalStorage();
  const stateWithSession = { answers: partialAnswers(), currentQ: 3, screen: "quiz", sessionId: "test-uuid-abc" };
  saveQuizStateTest(stateWithSession);
  const loadedWithSession = loadQuizStateTest();
  assertEqual(loadedWithSession.sessionId, "test-uuid-abc", "loadQuizState préserve le champ sessionId");

  // Backward compat — ancien state sans sessionId charge correctement
  global.localStorage = makeMockLocalStorage();
  const oldState = { answers: partialAnswers(), currentQ: 3, screen: "quiz" };
  saveQuizStateTest(oldState);
  const loadedOld = loadQuizStateTest();
  assert(loadedOld !== null, "ancien state sans sessionId charge toujours (backward compat)");
  assert(loadedOld.sessionId === undefined, "sessionId absent dans ancien state = undefined");

  // clearQuizState étendu efface COMPLETED_TRACKED_KEY
  global.localStorage = makeMockLocalStorage();
  saveQuizStateTest({ answers: freshAnswers(), currentQ: 0, screen: "landing" });
  global.localStorage.setItem(COMPLETED_TRACKED_KEY_TEST, "1");
  clearQuizStateExtendedTest(global.localStorage);
  assert(global.localStorage.getItem(COMPLETED_TRACKED_KEY_TEST) === null,
    "clearQuizState efface COMPLETED_TRACKED_KEY");
  assert(loadQuizStateTest() === null, "clearQuizState efface toujours le quiz state");
});

describe("ANALYTICS — source integrity", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");

  assert(src.includes("DEVICE_ID_KEY"), "PRESENT: constante DEVICE_ID_KEY");
  assert(src.includes("COMPLETED_TRACKED_KEY"), "PRESENT: constante COMPLETED_TRACKED_KEY");
  assert(src.includes("generateUUID"), "PRESENT: fonction generateUUID");
  assert(src.includes("getOrCreateDeviceId"), "PRESENT: fonction getOrCreateDeviceId");
  assert(src.includes("const DEVICE_ID = getOrCreateDeviceId()"), "PRESENT: DEVICE_ID module-level");
  assert(src.includes("deviceId: DEVICE_ID"), "PRESENT: deviceId injecté dans trackEvent");
  assert(src.includes("abandonSentRef"), "PRESENT: abandonSentRef dedup guard");
  assert(src.includes("pageshow"), "PRESENT: listener pageshow pour reset bfcache");
  assert(src.includes("quiz_resumed"), "PRESENT: event quiz_resumed pour refresh detection");
  assert(src.includes("loadQuizState()?.sessionId"), "PRESENT: sessionId restauré depuis localStorage");
  assert(src.includes("{ ...payload, sessionId }"), "PRESENT: sessionId spread dans quiz_abandoned");
  assert(src.includes("localStorage.removeItem(COMPLETED_TRACKED_KEY)"),
    "PRESENT: clearQuizState efface COMPLETED_TRACKED_KEY");
});

// ============================================================
// CONTRASTE WCAG — les couleurs de catégorie, mesurées sur la vraie source
//
// PRODUCT.md promet « WCAG AA vérifié sur toutes les combinaisons fond/texte ».
// Ces tests rendent la promesse exécutable : un token assombri pour passer AA
// sur fond clair a déjà cassé le score du héros sur fond vert sans rien casser
// dans la suite. Les ratios sont recalculés depuis le fichier source, pas copiés.
// ============================================================

function relativeLuminance(hex) {
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.replace("#", "").substr(i, 2), 16) / 255);
  const f = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(hexA, hexB) {
  const [hi, lo] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

describe("CONTRASTE WCAG — couleurs de catégorie", () => {
  const src = readFileSync(join(__dirname, "sm-survival-score.jsx"), "utf8");
  // getCategory() référence les tokens T.statut* (PR3) plutôt que des hex en dur —
  // on les extrait du bloc DESIGN TOKENS, seul endroit où ces hex existent encore
  // littéralement. Zéro-dépendance oblige (pas de transform JSX pour `node`), on ne
  // peut pas importer/appeler getCategory() directement : le fichier source est du JSX.
  const extractHex = (tokenName) => {
    const m = src.match(new RegExp(`\\b${tokenName}:\\s*"(#[0-9a-fA-F]{6})"`));
    if (!m) throw new Error(`Token T.${tokenName} introuvable dans la source`);
    return m[1];
  };
  const VERT = extractHex("vert"); // T.vert — fond du héros et de la carte de score

  // Sanity check du calcul lui-même, sur des paires connues
  assert(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.01, "contrastRatio: noir/blanc = 21:1");
  assert(Math.abs(contrastRatio("#ffffff", "#ffffff") - 1) < 0.01, "contrastRatio: blanc/blanc = 1:1");

  const categories = [
    { key: "vulnerable", color: extractHex("statutRisque"), onDark: extractHex("statutRisqueOnDark"), bg: extractHex("statutRisqueBg") },
    { key: "stable", color: extractHex("statutStable"), onDark: extractHex("statutStableOnDark"), bg: extractHex("statutStableBg") },
    { key: "irreplaceable", color: extractHex("statutSain"), onDark: extractHex("statutSainOnDark"), bg: extractHex("statutSainBg") },
  ];

  assertEqual(categories.length, 3, "getCategory expose 3 catégories avec color + onDark + bg");

  categories.forEach(c => {
    // onDark porte le score du héros (clamp(64px,…) poids 900) et de la carte de
    // score (240px) sur T.vert → « large text », seuil AA = 3:1
    const onVert = contrastRatio(c.onDark, VERT);
    assert(onVert >= 3, `${c.key}: onDark ${c.onDark} sur T.vert = ${onVert.toFixed(2)}:1 (≥ 3:1 requis)`);

    // color porte le texte des badges sur bg, et le blanc du badge du héros → 4.5:1
    const onBg = contrastRatio(c.color, c.bg);
    assert(onBg >= 4.5, `${c.key}: color ${c.color} sur bg ${c.bg} = ${onBg.toFixed(2)}:1 (≥ 4.5:1 requis)`);
  });

  // Le bug d'origine : réutiliser `color` (calibré fond clair) sur le fond vert.
  // Si quelqu'un le refait, ce test tombe avant la revue. Seuil 4.5 (pas 3) : onDark
  // sert aussi de fond de badge avec T.text par-dessus (voir commentaire sur
  // T.statutRisqueOnDark) — sur l'encre plus sombre qu'avant, `color` peut désormais
  // dépasser le seuil 3:1 « grand texte » par coïncidence, mais reste sous 4.5:1.
  const stable = categories.find(c => c.key === "stable");
  assert(contrastRatio(stable.color, VERT) < 4.5,
    "régression connue: le token `color` de stable échoue bien sur T.vert (d'où l'existence de onDark)");
  assert(!/color:\s*category\.key === "irreplaceable" \? T\.jaune : category\.color/.test(src),
    "ABSENT: ancien ternaire qui posait category.color sur le héros vert");
});

// ============================================================
// RESULTS
// ============================================================

console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log("=".repeat(50));

if (typeof process !== "undefined") {
  process.exit(failed > 0 ? 1 : 0);
}
