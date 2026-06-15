import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// ============================================================
// DATA
// ============================================================

const DIMENSIONS = [
  {
    id: "visibility",
    name: "Visibilité de ton impact",
    shortName: "Visibilité",
    diagnostics: {
      low: { text: "Ton management ne voit pas ce que tu fais. Personne ne le sait. Et dans une réorg, ce qui est invisible est le premier coupé. Chez Capital One, l'entreprise a reconnu que le travail des rôles agile était « critique ». Elle les a éliminés quand même. Plus de 1 100 postes.", action: "Cette semaine, envoie un message de 3 lignes à ton manager avec UN résultat concret de ton dernier sprint. Pas un statut. Un résultat." },
      mid: { text: "Ton manager sait vaguement que tu fais du bon travail. Sauf que « vaguement » ne pèse rien quand quelqu'un demande « on coupe quoi ? ». Pas en danger immédiat, mais pas de filet non plus si le vent tourne.", action: "Prends ta contribution la plus significative du mois et reformule-la en une phrase que ton VP comprendrait sans contexte. Si tu n'y arrives pas, c'est ta zone de travail." },
      high: { text: "Ton impact est visible. Ton management sait ce que tu apportes et pourrait le défendre. Bonne base. Mais la visibilité, ça ne se stocke pas. Ça se renouvelle chaque trimestre.", action: "Est-ce que tu pourrais documenter tes 3 contributions majeures du trimestre en format avant/après chiffré ? Si oui, tu as un dossier. Si non, tu as un objectif." },
    },
  },
  {
    id: "proof",
    name: "Maîtrise des preuves",
    shortName: "Preuves",
    diagnostics: {
      low: { text: "Tu n'as pas de données pour appuyer ce que tu fais. Quand quelqu'un te demande « c'est quoi ta valeur ajoutée ? », tu réponds avec des mots. Les mots se discutent. Les chiffres, non. Et les entreprises ne gardent pas les gens qui n'ont que des mots.", action: "Ouvre Jira (ou ton équivalent) et note deux chiffres : le nombre d'items livrés ce sprint et le nombre du sprint précédent. C'est ta première donnée. Pas besoin de plus pour commencer." },
      mid: { text: "Tu as des réflexes data, mais c'est pas encore un système. Tu regardes Jira de temps en temps, tu sais à peu près ce qui se passe. Si on te demandait de prouver une amélioration, par contre, tu devrais fouiller. Tu vois les problèmes mais tu ne peux pas les documenter quand ça compte.", action: "Choisis UNE métrique simple (items livrés, ou nombre de blocages résolus) et suis-la chaque sprint pendant un mois. Au bout de 4 sprints, tu as une tendance. Une tendance, c'est une preuve." },
      high: { text: "Tu sais utiliser tes données pour poser un diagnostic et appuyer tes actions. La majorité des SM n'en sont pas là. La question : est-ce que ces données arrivent jusqu'à ton management, ou est-ce qu'elles restent dans ta tête ?", action: "Prends ton meilleur avant/après chiffré et transforme-le en un mini-cas de 5 lignes. Si ton manager peut le lire et comprendre l'impact en 30 secondes, t'as un asset réutilisable." },
    },
  },
  {
    id: "business",
    name: "Langage business",
    shortName: "Business",
    diagnostics: {
      low: { text: "Tu parles Scrum à des gens qui parlent business. Tu dis « sprint goal » quand ils veulent entendre « engagement tenu ». Tu dis « impediment » quand ils veulent entendre « risque maîtrisé ». C'est pas un problème de compétence, c'est un problème de traduction. Et quand ton VP ne comprend pas ce que tu dis, il conclut que ce que tu fais n'a pas de valeur.", action: "Prends la dernière phrase que tu as dite en jargon Scrum à ton manager et réécris-la en termes de coût, risque ou délai. Une seule phrase. Entraîne-toi sur celle-là." },
      mid: { text: "Tu commences à parler le bon langage, mais c'est pas encore un réflexe. Tu switches entre Scrum et business selon le contexte, et parfois tu te trompes de registre. Ton manager retient les moments où tu as parlé « sprint velocity ». Pas ceux où tu as parlé « prédictibilité de livraison ».", action: "Avant ta prochaine réunion avec le management, prépare une phrase. Une seule. Qui traduit un résultat d'équipe en impact business. Pas improviser. Préparer." },
      high: { text: "Tu parles le langage de ceux qui décident. Rare chez les SM. La plupart restent enfermés dans le vocabulaire Scrum. Ton management te comprend, et ça change tout dans ta capacité à influencer.", action: "Est-ce que tu pourrais chiffrer le coût d'une semaine de retard pour ton équipe ? Si oui, tu as un argument que même un CFO écoute. Si non, c'est ta prochaine étape." },
    },
  },
  {
    id: "autonomy",
    name: "Autonomie de ton équipe",
    shortName: "Autonomie",
    diagnostics: {
      low: { text: "Ton équipe dépend de toi pour fonctionner. Si tu pars, les événements sautent, les problèmes s'accumulent, personne ne prend le relais. Ça rassure à court terme. Tu te sens utile. Mais une équipe dépendante, c'est un SM qui n'a pas fait son vrai travail. Et un management qui le voit se dit « il est devenu un goulot ».", action: "Choisis UN événement Scrum cette semaine et demande à quelqu'un de l'équipe de le faciliter. Toi, tu observes." },
      mid: { text: "Ton équipe se débrouille à peu près sans toi, mais c'est fragile. Les réflexes ne sont pas ancrés. Ça tient parce que tu es là en filet de sécurité. Le piège : l'équipe fonctionne, personne ne sait que c'est grâce à toi. Et si personne ne le sait, tu es remplaçable.", action: "Identifie une chose que ton équipe fait maintenant qu'elle ne faisait pas il y a 6 mois. Formule-la en une phrase. C'est le début de ton narratif d'autonomie." },
      high: { text: "Ton équipe est autonome et tu sais raconter pourquoi. Tu as créé quelque chose qui tourne, et tu peux le prouver. Maintenant, faut pas te reposer dessus. L'autonomie, ça s'entretient.", action: "Est-ce que tu as documenté le chemin ? « L'équipe était à X, elle est maintenant à Y, voilà ce que j'ai fait. » Si ce récit existe quelque part, tu as un asset. Si c'est juste dans ta tête, ça reste invisible." },
    },
  },
  {
    id: "strategic",
    name: "Positionnement stratégique",
    shortName: "Stratégique",
    diagnostics: {
      low: { text: "Tu es perçu comme un facilitateur de cérémonies. Ton manager te présente comme « celui qui gère les rituels Scrum », tu n'es pas consulté avant les décisions, et tu n'as pas d'objectif lié à un résultat business. Position la plus exposée possible. Dans la tête de ceux qui décident, tu es un coût opérationnel. Et les coûts opérationnels, ça se coupe.", action: "Demande à ton manager un objectif mesurable pour le prochain trimestre. Pas « améliorer l'agilité de l'équipe ». Un résultat : réduire les délais, améliorer la prédictibilité. Si ton manager ne sait pas quoi te donner, c'est un signal en soi." },
      mid: { text: "Tu n'es pas dans la case « animateur de réunions », mais tu n'es pas non plus dans la pièce quand les vraies décisions se prennent. Zone grise. Utile mais pas indispensable. Cette zone est confortable, sauf que c'est exactement là que le couperet tombe en premier. Personne ne te vise, mais personne ne te protège.", action: "Demande à ton manager quelles sont les prochaines décisions stratégiques qui vont affecter ton équipe (roadmap, réorg, changement de priorités). Puis propose-lui un point de vue chiffré avant que la décision soit prise. Le simple fait de poser la question change ta position." },
      high: { text: "Ton management te consulte, tu as des objectifs mesurables, et on te présente en parlant de résultats. T'es pas un rôle qu'on questionne. T'es une personne qu'on veut garder.", action: "Est-ce que tu pourrais former un autre SM à atteindre cette position ? Si oui, tu es en train de passer de SM irremplaçable à leader qui multiplie l'impact." },
    },
  },
];

const QUESTIONS = [
  { dimension: "visibility", text: "Tu montes dans l'ascenseur. Ton VP entre. Il te demande : « Alors, tu apportes quoi à l'équipe en ce moment ? » Tu as 30 secondes.", answers: [{ text: "J'ai une réponse précise — avec un chiffre ou un exemple concret derrière", score: 2 }, { text: "Je me débrouillerais, mais ce serait flou", score: 1 }, { text: "Je bafouillerais sûrement", score: 0 }] },
  { dimension: "visibility", text: "Ces trente derniers jours, as-tu communiqué un résultat chiffré à ton manager ?", answers: [{ text: "Oui, au moins une fois", score: 2 }, { text: "J'ai communiqué des résultats, mais rien de chiffré", score: 1 }, { text: "Non", score: 0 }] },
  { dimension: "visibility", text: "En dehors des réunions, ton manager pourrait citer de mémoire une contribution concrète de ta part ce trimestre ?", answers: [{ text: "Oui, sans hésiter", score: 2 }, { text: "Peut-être, mais j'en doute", score: 1 }, { text: "Probablement pas", score: 0 }] },
  { dimension: "visibility", text: "Si ton poste était supprimé demain, est-ce que quelqu'un dans le management se battrait pour te garder, toi — pas juste pour garder un SM dans l'équipe ?", answers: [{ text: "Oui, j'ai au moins un allié qui tient à moi — pas juste au rôle", score: 2 }, { text: "Je ne sais pas", score: 1 }, { text: "Probablement pas", score: 0 }] },
  { dimension: "proof", text: "Si on te demande combien d'items ton équipe livre en moyenne par sprint, tu connais le chiffre ?", answers: [{ text: "Oui, de tête", score: 2 }, { text: "À peu près", score: 1 }, { text: "Non", score: 0 }] },
  { dimension: "proof", text: "Tu as accès à Jira (ou équivalent). Qu'est-ce que tu en fais ?", answers: [{ text: "Je l'utilise pour diagnostiquer ce qui bloque — et décider quoi faire", score: 2 }, { text: "Je mets à jour les tickets et je sors des rapports quand on me le demande", score: 1 }, { text: "Je ne l'utilise pas comme outil de diagnostic — je m'appuie sur ce que j'observe en réunion", score: 0 }] },
  { dimension: "proof", text: "Pourrais-tu montrer à ton manager un avant/après chiffré qui prouve l'impact d'une de tes actions ?", answers: [{ text: "Oui, j'ai au moins un exemple concret", score: 2 }, { text: "Je pourrais probablement en construire un, mais je ne l'ai pas fait", score: 1 }, { text: "Non, je n'aurais rien à montrer", score: 0 }] },
  { dimension: "proof", text: "La dernière fois que tu as proposé un changement à ton équipe ou à ton manager, tu avais quoi dans les mains ?", answers: [{ text: "Un chiffre ou un fait — j'aurais pu me défendre si on m'avait poussé", score: 2 }, { text: "Une bonne raison, mais rien à montrer si on avait insisté", score: 1 }, { text: "Surtout l'intuition que c'était la bonne direction", score: 0 }] },
  { dimension: "business", text: "Quand tu parles à ton manager ou à un directeur, tu utilises quel vocabulaire ?", answers: [{ text: "Risque, coût, délai, prédictibilité — avec des chiffres pour illustrer", score: 2 }, { text: "Un mix : je traduis parfois en termes business, parfois je reste en mode Scrum", score: 1 }, { text: "Le vocabulaire de mon rôle (sprint, backlog, rétro) — je traduis rarement", score: 0 }] },
  { dimension: "business", text: "As-tu déjà traduit un problème d'équipe en impact business ? (retard = coût, blocage = risque, turnover = perte de vélocité)", answers: [{ text: "Oui, je l'ai fait et communiqué", score: 2 }, { text: "J'y ai pensé mais je ne l'ai pas formalisé", score: 1 }, { text: "Non, je ne saurais pas comment m'y prendre", score: 0 }] },
  { dimension: "business", text: "Sais-tu combien coûte une semaine de retard pour ton équipe ?", answers: [{ text: "Oui, j'ai un ordre de grandeur", score: 2 }, { text: "Je pourrais le calculer si on me le demandait", score: 1 }, { text: "Non, et je ne sais pas comment le calculer", score: 0 }] },
  { dimension: "business", text: "Ton management te consulte avant de prendre des décisions qui affectent ton équipe ?", answers: [{ text: "Oui, régulièrement", score: 2 }, { text: "Parfois, quand ils y pensent", score: 1 }, { text: "Rarement — j'apprends la décision en même temps que tout le monde", score: 0 }] },
  { dimension: "autonomy", text: "Si tu pars en vacances 2 semaines, que se passe-t-il ?", answers: [{ text: "L'équipe tourne — et je peux expliquer comment j'ai construit ça", score: 2 }, { text: "Ça ralentit. Certaines choses tombent", score: 1 }, { text: "Les événements sautent ou il faut un back-up", score: 0 }] },
  { dimension: "autonomy", text: "As-tu déjà formé un membre de ton équipe à faciliter un événement Scrum ?", answers: [{ text: "Oui — et cette personne l'a déjà fait sans moi", score: 2 }, { text: "J'ai commencé, mais c'est pas encore ancré", score: 1 }, { text: "Non — je facilite tout moi-même", score: 0 }] },
  { dimension: "autonomy", text: "Les membres de ton équipe résolvent des problèmes entre eux sans passer par toi ?", answers: [{ text: "Oui, c'est la norme — j'ai activement construit ça", score: 2 }, { text: "Ça arrive, mais ils viennent souvent me chercher", score: 1 }, { text: "Non, je suis le point de passage par défaut", score: 0 }] },
  { dimension: "autonomy", text: "As-tu déjà expliqué à ton management comment tu as construit l'autonomie de ton équipe ?", answers: [{ text: "Oui, j'ai raconté le chemin et les étapes", score: 2 }, { text: "Non, mais je pourrais si on me le demandait", score: 1 }, { text: "Non, et je ne saurais pas comment le formuler", score: 0 }] },
  { dimension: "strategic", text: "Si ton manager devait justifier ton poste à un directeur qui décide des coupes budgétaires, qu'est-ce qu'il dirait d'après toi ?", answers: [{ text: "Il citerait des résultats concrets ou des risques que tu as évités", score: 2 }, { text: "Il dirait que tu fais du bon boulot, sans pouvoir donner un chiffre ou un exemple précis", score: 1 }, { text: "Il décrirait ton rôle — facilitation, cérémonies Scrum — sans l'accrocher à aucun résultat", score: 0 }] },
  { dimension: "strategic", text: "Quand des décisions stratégiques se prennent dans ton département (roadmap, budget, réorg), à quel moment tu es dans la boucle ?", answers: [{ text: "Avant la décision — on me consulte", score: 2 }, { text: "Après la décision — on m'informe en même temps que tout le monde", score: 1 }, { text: "Je l'apprends par hasard ou trop tard", score: 0 }] },
  { dimension: "strategic", text: "As-tu un objectif de performance lié à un résultat business ? (pas \"faciliter les retros\" — un résultat)", answers: [{ text: "Oui, clairement défini", score: 2 }, { text: "C'est vague ou implicite", score: 1 }, { text: "Non, je n'ai pas d'objectif mesurable", score: 0 }] },
  { dimension: "strategic", text: "Si ton poste disparaissait demain, quelle serait la réaction dans ton organisation ?", answers: [{ text: "On mesurerait une perte concrète — une livraison ralentie, un risque non géré", score: 2 }, { text: "On sentirait un vide, mais personne ne pourrait le chiffrer", score: 1 }, { text: "Ça passerait probablement inaperçu — quelqu'un absorberait le rôle rapidement", score: 0 }] },
];

const GLOBAL_RESULTS = {
  vulnerable: {
    paragraphs: [
      "La question n'est pas si tu mérites ce poste. La question, c'est si quelqu'un dans ta direction pourrait défendre ce poste si on le lui demandait demain.",
      "Avec ce score, probablement non.",
      "Les rôles agile qui ont été coupés chez Capital One n'étaient pas forcément moins bons que leurs collègues. Ils étaient moins défendables. Ce n'est pas la même chose.",
      "La matière est souvent là. C'est la traduction qui manque.",
      "Tes diagnostics ci-dessous te montrent où tu es exposé.",
    ],
  },
  stable: {
    paragraphs: [
      "Tu n'es pas en danger immédiat. Ton profil est assez solide pour traverser les décisions ordinaires.",
      "Sauf que « stable » a une durée de validité. Quand une réorg arrive ou qu'une direction change, quelqu'un doit défendre ton poste en 5 minutes devant quelqu'un qui ne te connaît pas.",
      "Ton score dit qu'il y a des endroits où cette défense ne tiendrait pas. Tes diagnostics ci-dessous te montrent lesquels.",
    ],
  },
  irreplaceable: {
    paragraphs: [
      "La plupart des SMs qui font ce test n'arrivent pas ici. Ce score dit que tu as construit quelque chose de difficile à couper.",
      "Ça demande de l'entretien. Ce qui te rend irremplaçable aujourd'hui ne te le reste pas automatiquement. Les contextes changent, les directions changent.",
      "Regarde quand même le détail. Il y a souvent un angle mort, même à ce niveau. Le genre de trou qui ne se voit pas tant qu'on ne le cherche pas activement.",
    ],
  },
};


// ============================================================
// CONSTANTS
// ============================================================

const MAX_SCORE = 40;
const MAX_DIM_SCORE = 8;
const SCORE_THRESHOLDS = { low: 45, mid: 75 };
const QUESTIONS_PER_DIM = 4;
const SCREEN = { LANDING: "landing", QUIZ: "quiz", RESULT: "result" };

// ============================================================
// SCORING UTILITIES
// ============================================================

export function computeDimensionScores(answers, questions = QUESTIONS, dimensions = DIMENSIONS) {
  const scores = {};
  dimensions.forEach(dim => (scores[dim.id] = 0));
  questions.forEach((q, i) => {
    const sel = answers[i];
    if (sel !== null && sel !== undefined && q.answers[sel]) {
      scores[q.dimension] += q.answers[sel].score;
    }
  });
  return scores;
}

export function computeGlobalScore(dimensionScores) {
  return Math.round((Object.values(dimensionScores).reduce((a, b) => a + b, 0) / MAX_SCORE) * 100);
}

export function getCategory(percentage) {
  if (percentage < SCORE_THRESHOLDS.low) return { key: "vulnerable", label: "Vulnérable", color: "#dc2626", bg: "#fef2f2" };
  if (percentage < SCORE_THRESHOLDS.mid) return { key: "stable", label: "Stable", color: "#f59e0b", bg: "#fffbeb" };
  return { key: "irreplaceable", label: "Irremplaçable", color: "#006946", bg: "#ecfdf5" };
}

export function getDiagnosticLevel(score) { return score <= 3 ? "low" : score <= 5 ? "mid" : "high"; }

export function buildDimensionResults(dimensionScores, dimensions = DIMENSIONS) {
  return dimensions.map(dim => ({ ...dim, score: dimensionScores[dim.id], pct: Math.round((dimensionScores[dim.id] / MAX_DIM_SCORE) * 100) }));
}

export function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

async function generatePDF(pdfProps) {
  const { globalScore } = pdfProps;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `diagnostic-sm-${globalScore}-${dateStr}.pdf`;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:794px;";
  document.body.appendChild(container);

  const root = createRoot(container);
  flushSync(() => root.render(<PDFDocument {...pdfProps} />));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 794,
    windowWidth: 794,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [794, 1123] });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = pageW / canvas.width;
  const imgH = canvas.height * ratio;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  let heightLeft = imgH;
  let yPos = 0;
  pdf.addImage(imgData, "JPEG", 0, yPos, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    yPos -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, yPos, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
  root.unmount();
  document.body.removeChild(container);
}

// ============================================================
// STORAGE UTILITIES — localStorage quiz persistence
// ============================================================

const STORAGE_KEY = "sm-survival-score-state";

function isValidQuizState(state) {
  if (!state || typeof state !== "object") return false;
  if (!Array.isArray(state.answers) || state.answers.length !== QUESTIONS.length) return false;
  if (!state.answers.every(a => a === null || a === 0 || a === 1 || a === 2)) return false;
  if (typeof state.currentQ !== "number" || state.currentQ < 0 || state.currentQ >= QUESTIONS.length) return false;
  if (![SCREEN.LANDING, SCREEN.QUIZ, SCREEN.RESULT].includes(state.screen)) return false;
  return true;
}

export function saveQuizState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

export function loadQuizState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidQuizState(parsed)) return null;
    return parsed;
  } catch (_) { return null; }
}

export function clearQuizState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

// ============================================================
// SCORING — Algorithme pondéré (Signal de priorité dimension)
// ============================================================

/**
 * Poids de survie par dimension.
 * Visibility = condition nécessaire de tout (invisible = premier coupé).
 * Strategic = dimension la plus prédictive du risque de licenciement.
 */
export const DIMENSION_WEIGHTS = {
  visibility: 5,
  strategic: 4,
  proof: 3,
  business: 2,
  autonomy: 1,
};

// Ordre fixe décroissant par poids — garantit le tie-break
const DIMENSIONS_BY_WEIGHT_DESC = ['visibility', 'strategic', 'proof', 'business', 'autonomy'];

function computePriorityScore(scorePct, dimId) {
  return (1 - scorePct / 100) * DIMENSION_WEIGHTS[dimId];
}

/**
 * Retourne l'ID de la dimension prioritaire selon l'algorithme pondéré.
 * priorityScore = (1 − score_normalized) × weight
 *
 * @param {{ visibility: number, proof: number, business: number, autonomy: number, strategic: number }} dimensionScoresPct
 * @returns {string} ID de la dimension prioritaire
 */
export function getPriorityDimension(dimensionScoresPct) {
  let maxPs = -1;
  let priorityId = null;
  for (const id of DIMENSIONS_BY_WEIGHT_DESC) {
    const ps = computePriorityScore(dimensionScoresPct[id], id);
    if (ps > maxPs) { maxPs = ps; priorityId = id; }
  }
  return priorityId;
}

/**
 * Retourne les 5 IDs de dimension ordonnés du plus au moins critique.
 * Utilisé pour l'ordre d'affichage des diagnostics post-gate.
 *
 * @param {{ visibility: number, proof: number, business: number, autonomy: number, strategic: number }} dimensionScoresPct
 * @returns {string[]}
 */
export function getOrderedDimensions(dimensionScoresPct) {
  return [...DIMENSIONS_BY_WEIGHT_DESC]
    .map(id => ({ id, ps: computePriorityScore(dimensionScoresPct[id], id) }))
    .sort((a, b) => b.ps !== a.ps ? b.ps - a.ps : DIMENSION_WEIGHTS[b.id] - DIMENSION_WEIGHTS[a.id])
    .map(({ id }) => id);
}

// ============================================================
// ANALYTICS — anonymous webhook to Google Sheet
// ============================================================

// Replace with your Google Apps Script deployment URL
const ANALYTICS_URL = "https://script.google.com/macros/s/AKfycbxSSFKyZsQvhbwwSAZTyolhHQ9RzTYhIGrQwYYoGYVzyjfnFjRRPYfnzqgVAgrQ211o/exec";

function trackEvent(event, data = {}) {
  if (!ANALYTICS_URL) return;
  try {
    const payload = { timestamp: new Date().toISOString(), event, ...data };
    // Fire and forget — navigator.sendBeacon for reliability on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_URL, JSON.stringify(payload));
    } else {
      fetch(ANALYTICS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silent fail — analytics should never break the app
  }
}

export function buildAbandonPayload(screen, currentQ, answers) {
  if (screen !== SCREEN.QUIZ) return null;
  return {
    questionIndex: currentQ,
    questionNumber: currentQ + 1,
    dimension: QUESTIONS[currentQ]?.dimension ?? null,
    answersGiven: answers.filter(a => a !== null).length,
  };
}

// ============================================================
// DESIGN TOKENS — Brand: vert #006946, jaune #FFF200, crème #FBF3EB
// ============================================================

const T = {
  vert: "#006946",
  vertDark: "#004d34",
  vertLight: "#e6f5ef",
  jaune: "#FFF200",
  jauneMuted: "#e6d900",
  creme: "#FBF3EB",
  cremeDeep: "#f0e6d9",
  white: "#ffffff",
  text: "#1a1a1a",
  textMid: "#4a4a4a",
  textMuted: "#7a7a7a",
  textLight: "#a3a3a3",
  border: "#e8ddd1",
  borderLight: "#f0e8de",
  r: 16,
  rLg: 20,
  rSm: 10,
  f: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};
// Button style helpers — used in ResultScreen actions (share + restart)
T.btnAction = { fontSize: 14, fontWeight: 700, fontFamily: T.f, background: T.vert, color: T.white, border: "none", borderRadius: T.rSm, cursor: "pointer", minHeight: 48, padding: "14px 28px" };
T.btnGhost = { fontSize: 14, fontWeight: 600, fontFamily: T.f, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.rSm, cursor: "pointer", minHeight: 48, padding: "14px 28px" };

// ============================================================
// GLOBAL STYLES
// ============================================================

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,900;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.creme}; -webkit-font-smoothing: antialiased; }
  button:focus-visible { outline: 2px solid ${T.white}; outline-offset: 2px; box-shadow: 0 0 0 4px ${T.vert}; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
  @keyframes answerPulse { 0% { transform:scale(1); } 50% { transform:scale(1.015); } 100% { transform:scale(1); } }
  @keyframes countdown { from { width:100%; } to { width:0%; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  @media print {
    .no-print { display: none !important; }
  }
`;

let stylesInjected = false;
function StyleProvider({ children }) {
  useEffect(() => {
    if (stylesInjected) return;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    stylesInjected = true;
    return () => { document.head.removeChild(el); stylesInjected = false; };
  }, []);
  return children;
}

// ============================================================
// PRIORITY SIGNAL — textes éditoriaux par dimension
// ============================================================

const SIGNAL_TEXTS = {
  visibility: {
    title: 'Ton angle mort le plus urgent : ce que ton management retient de toi.',
    body: "Tant que cette dimension reste faible, le reste ne protège pas ton poste. C'est la condition de base.",
  },
  strategic: {
    title: 'Ton angle mort le plus urgent : comment tu es perçu.',
    body: "C'est la dimension la plus liée aux décisions de licenciement. Pas parce que tu travailles mal. Parce que la perception de ton rôle s'est figée à un niveau trop bas.",
  },
  proof: {
    title: 'Ton angle mort le plus urgent : tes preuves.',
    body: "Tu peux être visible et quand même n'avoir rien à montrer quand la question arrive. Ce trou-là, il se referme. Mais pas tout seul.",
  },
  business: {
    title: 'Ton angle mort le plus urgent : ton langage.',
    body: "Ton travail existe. Le problème, c'est qu'il n'est pas traduit dans un format que la direction comprend. C'est la dernière étape, et souvent la plus manquée.",
  },
  autonomy: {
    title: "Ton angle mort le plus urgent : l'autonomie de ton équipe.",
    body: "Un SM dont l'équipe ne peut pas fonctionner sans lui est perçu comme une dépendance, pas comme une valeur. Ça change la lecture de ton rôle en comité de direction.",
  },
};

function PrioritySignal({ priorityDimId }) {
  const signal = SIGNAL_TEXTS[priorityDimId];
  if (!signal) return null;
  return (
    <div style={{ backgroundColor: '#1a1a2e', borderLeft: '3px solid #FFF200', borderRadius: 4, padding: '14px 18px', margin: '20px 0 24px 0' }}>
      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#FFF200', margin: '0 0 6px 0', fontFamily: T.f }}>{signal.title}</p>
      <p style={{ fontSize: '0.9rem', color: '#e8e8e8', margin: 0, lineHeight: 1.5, fontFamily: T.f }}>{signal.body}</p>
    </div>
  );
}

// ============================================================
// BENTO CARD — shared wrapper
// ============================================================

function BentoCard({ children, style = {}, className, ...props }) {
  return (
    <div style={{
      background: T.white,
      borderRadius: T.rLg,
      padding: 24,
      border: `1px solid ${T.borderLight}`,
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function DiagnosticCard({ dimension, index }) {
  const level = getDiagnosticLevel(dimension.score);
  const diag = dimension.diagnostics[level];
  const cat = getCategory(dimension.pct);
  const levelLabel = level === "low" ? "Vulnérable" : level === "mid" ? "À renforcer" : "Solide";

  return (
    <BentoCard
      style={{ borderLeft: `4px solid ${cat.color}`, animation: `fadeUp 0.3s ease-out ${index * 0.06}s both` }}
      role="article"
      aria-label={`Diagnostic : ${dimension.name}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, fontFamily: T.f }}>{dimension.name}</h4>
        <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, padding: "4px 12px", background: cat.bg, borderRadius: 20, whiteSpace: "nowrap" }}>{levelLabel} — {dimension.score}/8</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.75, color: T.textMid, fontFamily: T.f, marginBottom: 16 }}>{diag.text}</p>
      <div style={{ padding: "14px 16px", background: T.creme, borderRadius: T.rSm }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.vert, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: T.f }}>
          {level === "high" ? "Prochain niveau" : "Action immédiate"}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: T.textMid, fontFamily: T.f }}>{diag.action}</p>
      </div>
    </BentoCard>
  );
}

function LockedDiagnosticCard({ dimension, onUnlockClick }) {
  const cat = getCategory(dimension.pct);
  return (
    <div
      aria-label={`Diagnostic verrouillé : ${dimension.name}`}
      role="region"
      style={{ marginBottom: 0, background: T.white, border: `1px solid ${T.borderLight}`, borderLeft: `4px solid ${cat.color}`, borderRadius: T.rLg, overflow: "hidden", position: "relative", minHeight: 120 }}
    >
      <div aria-hidden="true" style={{ filter: "blur(6px)", userSelect: "none", pointerEvents: "none", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{dimension.name}</h4>
          <span style={{ fontSize: 11, color: T.textMuted }}>{dimension.score}/8</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textMid }}>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt.</p>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,243,235,0.4)" }}>
        <button onClick={onUnlockClick} aria-label="Déverrouiller les diagnostics complets" style={{ background: T.vert, color: T.white, padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: T.f, border: "none", cursor: "pointer" }}>
          Déverrouiller
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ currentIndex }) {
  const activeDimIndex = Math.floor(currentIndex / QUESTIONS_PER_DIM);
  return (
    <div role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length}
      aria-label={`Question ${currentIndex + 1} sur ${QUESTIONS.length}`}
      style={{ display: "flex", gap: 6 }}>
      {DIMENSIONS.map((dim, di) => {
        const isActive = di === activeDimIndex;
        const isDone = di < activeDimIndex;
        return (
          <div key={dim.id} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: QUESTIONS_PER_DIM }, (_, q) => {
                const idx = di * QUESTIONS_PER_DIM + q;
                const pipCurrent = idx === currentIndex;
                const pipDone = idx < currentIndex;
                return <div key={q} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: pipCurrent ? T.jaune : pipDone ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.12)",
                  transition: "background 0.2s ease",
                }} />;
              })}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              color: isActive ? T.jaune : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
              textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontFamily: T.f, lineHeight: 1,
            }}>
              {isDone ? `${dim.shortName} ✓` : dim.shortName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChapterRevealScreen({ completedDimIndex, nextDimIndex, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2000);
    return () => clearTimeout(t);
  }, [onContinue]);

  const completed = DIMENSIONS[completedDimIndex];
  const next = DIMENSIONS[nextDimIndex];

  return (
    <div
      onClick={onContinue}
      data-testid="chapter-reveal"
      style={{
        minHeight: "100vh", background: T.vert, display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", textAlign: "center",
        padding: "40px 24px", fontFamily: T.f, cursor: "pointer",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 16,
      }}>✓</div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8, fontFamily: T.f }}>
        Dimension complète
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 28, fontFamily: T.f }}>{completed.name}</h2>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8, fontFamily: T.f }}>
        Prochaine dimension
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: T.jaune, marginBottom: 40, fontFamily: T.f }}>{next.name} →</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: T.f }}>Clique pour continuer</p>
    </div>
  );
}

function PDFDocument({ globalScore, category, globalResult, dimensionResults, priorityDimId, orderedDimIds, collabUrl, collabEmail }) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderedResults = orderedDimIds.map(id => dimensionResults.find(d => d.id === id));
  const priorityResult = dimensionResults.find(d => d.id === priorityDimId);
  const signal = SIGNAL_TEXTS[priorityDimId];
  const priorityLevel = getDiagnosticLevel(priorityResult.score);

  return (
    <div style={{ width: 794, fontFamily: T.f, background: T.white, color: T.text }}>
      {/* En-tête */}
      <div style={{ background: T.vert, padding: "32px 48px 24px", color: T.white }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: `${T.white}99`, marginBottom: 8 }}>
          Collaboration Solved
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: T.white, marginBottom: 4, letterSpacing: "-0.02em" }}>
          Ton diagnostic Scrum Master
        </h1>
        <p style={{ fontSize: 13, color: `${T.white}80` }}>{dateStr}</p>
      </div>

      {/* Score + texte global */}
      <div style={{ padding: "28px 48px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: category.key === "irreplaceable" ? T.vert : category.color, lineHeight: 1, letterSpacing: "-0.04em" }}>{globalScore}</div>
          <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 8 }}>/100</div>
          <div style={{ display: "inline-block", padding: "6px 18px", fontSize: 13, fontWeight: 700, color: category.key === "irreplaceable" ? T.vertDark : T.white, background: category.key === "irreplaceable" ? T.jaune : category.color, borderRadius: 20 }}>{category.label}</div>
        </div>
        <div>
          {globalResult.paragraphs.slice(0, 2).map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: T.textMid, marginBottom: 12 }}>{p}</p>
          ))}
        </div>
      </div>

      {/* Signal prioritaire */}
      <div style={{ padding: "24px 48px 0" }}>
        <div style={{ backgroundColor: "#1a1a2e", borderLeft: "3px solid #FFF200", borderRadius: 4, padding: "14px 18px" }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#FFF200", margin: "0 0 6px 0" }}>{signal.title}</p>
          <p style={{ fontSize: 13, color: "#e8e8e8", margin: 0, lineHeight: 1.5 }}>{signal.body}</p>
        </div>
        <div style={{ marginTop: 12, padding: "14px 16px", background: T.creme, borderRadius: T.rSm }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.vert, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Action immédiate — {priorityResult.shortName}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: T.textMid }}>{priorityResult.diagnostics[priorityLevel].action}</p>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div style={{ padding: "24px 48px 0" }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Vue d'ensemble</h2>
        {orderedResults.map((dim) => {
          const dimCat = getCategory(dim.pct);
          const isPriority = dim.id === priorityDimId;
          return (
            <div key={dim.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: isPriority ? 700 : 500, color: isPriority ? T.vert : T.text }}>
                  {dim.shortName}{isPriority ? " ← priorité" : ""}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: dimCat.color, fontFamily: "monospace" }}>{dim.score}/8</span>
              </div>
              <div style={{ height: 6, background: T.cremeDeep, borderRadius: 3 }}>
                <div style={{ height: 6, width: `${Math.max(dim.pct, 3)}%`, background: dimCat.color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostics détaillés */}
      <div style={{ padding: "24px 48px 32px" }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Diagnostic par dimension</h2>
        {orderedResults.map((dim) => {
          const level = getDiagnosticLevel(dim.score);
          const diag = dim.diagnostics[level];
          const dimCat = getCategory(dim.pct);
          const levelLabel = level === "low" ? "Vulnérable" : level === "mid" ? "À renforcer" : "Solide";
          return (
            <div key={dim.id} style={{ marginBottom: 20, borderLeft: `3px solid ${dimCat.color}`, paddingLeft: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{dim.name}</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: dimCat.color, padding: "3px 10px", background: dimCat.bg, borderRadius: 20 }}>{levelLabel} — {dim.score}/8</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: T.textMid, marginBottom: 12 }}>{diag.text}</p>
              <div style={{ padding: "12px 14px", background: T.creme, borderRadius: T.rSm }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.vert, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {level === "high" ? "Prochain niveau" : "Action immédiate"}
                </p>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: T.textMid }}>{diag.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Collaboration Solved */}
      <div style={{ padding: "20px 48px 32px", borderTop: `1px solid ${T.border}`, textAlign: "center", background: T.creme }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
          Pour aller plus loin avec un accompagnement personnalisé
        </p>
        {collabUrl && <p style={{ fontSize: 13, color: T.vert, fontWeight: 700, marginBottom: 4 }}>{collabUrl}</p>}
        {collabEmail && <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>{collabEmail}</p>}
        <p style={{ fontSize: 11, color: T.textLight }}>Un outil Collaboration Solved — par Pierre-Cyril Denant</p>
      </div>
    </div>
  );
}

// ============================================================
// SCREENS
// ============================================================

function GhostSignupForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "error"

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setStatus("error"); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { onSuccess(email); } else { setStatus("error"); }
    } catch { setStatus("error"); }
  }, [email, onSuccess]);

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com" required
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.white}40`,
            background: `${T.white}15`, color: T.white, fontSize: 14, outline: "none" }}
        />
        <button type="submit" disabled={status === "submitting"}
          style={{ padding: "10px 20px", borderRadius: 8, background: T.jaune, color: T.vert,
            fontWeight: 700, fontSize: 14, border: "none", cursor: status === "submitting" ? "wait" : "pointer" }}>
          {status === "submitting" ? "..." : "Déverrouiller"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ fontSize: 12, color: T.jaune, margin: 0 }}>Email invalide ou erreur — réessaie.</p>
      )}
    </form>
  );
}

function UnlockModal({ email, onClose, pdfProps }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true);
    await generatePDF(pdfProps);
    setIsGenerating(false);
  }, [pdfProps]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="no-print"
      style={{ position: "fixed", inset: 0, background: "rgba(11,36,25,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 24 }}>
      <div style={{ background: T.white, borderRadius: T.rLg, maxWidth: 440,
        width: "100%", padding: "40px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>✓</p>
        <h2 id="modal-title" style={{ fontSize: 20, fontWeight: 800, color: T.vert, marginBottom: 12 }}>
          Diagnostics déverrouillés
        </h2>
        <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, marginBottom: 28 }}>
          Un email a été envoyé à <strong style={{ color: T.text }}>{email}</strong>.
          Vérifie aussi tes spams — sans confirmation, tu ne recevras pas les conseils de la semaine.
        </p>
        <button onClick={handleDownloadPDF} disabled={isGenerating} style={{ display: "block", width: "100%",
          padding: "14px 24px", background: isGenerating ? T.textLight : T.vert, color: T.white, fontWeight: 700,
          fontSize: 15, fontFamily: T.f, border: "none", borderRadius: T.r,
          cursor: isGenerating ? "wait" : "pointer", marginBottom: 12 }}>
          {isGenerating ? "Génération..." : "Télécharger mon rapport (PDF)"}
        </button>
        <button onClick={onClose} style={{ display: "block", width: "100%",
          padding: "12px 24px", background: "transparent", color: T.textMuted,
          fontWeight: 600, fontSize: 14, fontFamily: T.f,
          border: `1px solid ${T.border}`, borderRadius: T.r, cursor: "pointer" }}>
          Voir mes résultats
        </button>
      </div>
    </div>
  );
}

function LandingScreen({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: T.vert, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: T.f }}>
      <main style={{ maxWidth: 520, textAlign: "center", animation: "fadeUp 0.5s ease-out" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: `${T.white}40`, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28 }}>
          Collaboration Solved
        </p>
        <h1 style={{ fontSize: "clamp(30px, 7vw, 44px)", fontWeight: 900, lineHeight: 1.15, color: T.white, marginBottom: 20, letterSpacing: "-0.03em" }}>
          <span style={{ display: "block" }}>Ton rôle est en danger.</span>
          <span style={{ display: "block", fontWeight: 700 }}>Tu ne sais pas encore où.</span>
        </h1>
        <p style={{ fontSize: 14, fontWeight: 500, color: `${T.white}bb`, marginBottom: 28 }}>
          Diagnostic gratuit · 5 min · Sans inscription
        </p>
        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto 32px" }}>
          <button onClick={onStart} style={{ display: "block", width: "100%", padding: "18px 0", fontSize: 16, fontWeight: 700, fontFamily: T.f, background: T.jaune, color: T.vertDark, border: "none", borderRadius: T.r, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", minHeight: 56, marginBottom: 8 }}>
            Voir mes angles morts
          </button>
          <p style={{ fontSize: 11, color: `${T.white}40`, textAlign: "center" }}>Résultat immédiat · Aucune carte requise</p>
        </div>
        <hr style={{ border: "none", borderTop: `1px solid ${T.white}20`, width: 60, margin: "0 auto 24px" }} />
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "left" }}>
          {[
            { num: "1 100", text: "postes agile supprimés chez Capital One en 2023 — qualifiés de « critiques » jusqu'au bout" },
            { num: "18%",   text: "des Scrum Masters licenciés depuis 2022 selon ScrumAlliance" },
            { num: "5",     text: "dimensions analysées : visibilité, preuves, langage, autonomie, stratégie" },
          ].map(({ num, text }, i, arr) => (
            <div key={num} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 16 : 0 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: T.jaune, letterSpacing: "-0.03em", lineHeight: 1, flexShrink: 0, width: 52, textAlign: "right" }}>{num}</span>
              <span style={{ fontSize: 13, color: `${T.white}55`, lineHeight: 1.55, paddingTop: 3 }}>{text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const ANSWER_LETTERS = ["A", "B", "C"];

function QuestionScreen({ questionIndex, question, selectedAnswer, onSelect, onNext, onPrev, total }) {
  const dimInfo = DIMENSIONS.find(d => d.id === question.dimension);
  const answerRefs = useRef([]);
  const autoAdvanceTimer = useRef(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  // Tracks if the user actively selected on the current question (vs. pre-existing answer from navigation)
  const userJustSelectedRef = useRef(false);

  // Wrap onSelect to mark user-initiated selections
  const handleSelect = useCallback((i) => {
    userJustSelectedRef.current = true;
    onSelect(i);
  }, [onSelect]);

  // Reset selection tracking when question changes
  useEffect(() => {
    userJustSelectedRef.current = false;
    setIsAdvancing(false);
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, [questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance after 600ms, only on user-initiated selection
  useEffect(() => {
    if (selectedAnswer === null || !userJustSelectedRef.current) {
      setIsAdvancing(false);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      return;
    }
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setIsAdvancing(true);
    autoAdvanceTimer.current = setTimeout(() => {
      setIsAdvancing(false);
      onNext();
    }, 600);
    return () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); };
  }, [selectedAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts A/B/C
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const i = ANSWER_LETTERS.indexOf(e.key.toUpperCase());
      if (i !== -1 && i < question.answers.length) handleSelect(i);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [question.answers.length, handleSelect]);

  const handleAnswerKey = useCallback((e, i) => {
    const n = question.answers.length;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (i + 1) % n;
      handleSelect(next);
      answerRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (i - 1 + n) % n;
      handleSelect(prev);
      answerRefs.current[prev]?.focus();
    }
  }, [question.answers.length, handleSelect]);

  return (
    <div style={{ minHeight: "100vh", background: T.creme, fontFamily: T.f, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header style={{ background: T.vert, padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.jaune, letterSpacing: "0.04em", textTransform: "uppercase" }}>{dimInfo.name}</span>
            <span style={{ fontSize: 12, color: `${T.white}99`, fontFamily: "monospace" }}>{questionIndex + 1}/{total}</span>
          </div>
          <ProgressBar currentIndex={questionIndex} />
        </div>
      </header>

      {/* Question */}
      <main key={questionIndex} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560, margin: "0 auto", padding: "40px 24px", width: "100%", animation: "fadeIn 0.2s ease-out" }}>
        <h2 style={{ fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 700, lineHeight: 1.5, color: T.text, marginBottom: 28 }}>
          {question.text}
        </h2>
        <p style={{ fontSize: 11, color: T.textLight, marginBottom: 14, fontFamily: T.f }}>
          {ANSWER_LETTERS.map((l, i) => (
            <span key={l}>
              <kbd style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: T.white, border: `1px solid ${T.border}`, borderBottom: `2px solid ${T.border}`, borderRadius: 4, width: 18, height: 18, fontSize: 10, fontWeight: 700, color: T.textMuted, fontFamily: "monospace", marginRight: 2 }}>{l}</kbd>
              {i < ANSWER_LETTERS.length - 1 ? " " : ""}
            </span>
          ))}
          {" "}Raccourcis clavier
        </p>
        <div role="radiogroup" aria-label="Choisis ta réponse" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {question.answers.map((a, i) => {
            const sel = selectedAnswer === i;
            return (
              <button
                key={i}
                ref={el => { answerRefs.current[i] = el; }}
                role="radio"
                aria-checked={sel}
                onClick={() => handleSelect(i)}
                onKeyDown={(e) => handleAnswerKey(e, i)}
                tabIndex={sel || (selectedAnswer === null && i === 0) ? 0 : -1}
                style={{
                  padding: "16px 18px 16px 14px", fontSize: 15, lineHeight: 1.5, fontFamily: T.f, textAlign: "left",
                  background: sel ? T.vert : T.white, color: sel ? T.white : T.text,
                  border: `2px solid ${sel ? T.vert : T.border}`, borderRadius: T.r,
                  cursor: "pointer", transition: "all 0.15s ease", fontWeight: sel ? 600 : 400,
                  minHeight: 56, display: "flex", alignItems: "flex-start", gap: 12,
                  animation: sel && isAdvancing ? "answerPulse 0.2s ease-out" : "none",
                }}
              >
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, fontFamily: "monospace",
                  background: sel ? "rgba(255,255,255,0.18)" : "#e8f3ee",
                  color: sel ? T.white : T.vert,
                  border: `1px solid ${sel ? "rgba(255,255,255,0.25)" : "rgba(0,105,70,0.25)"}`,
                  flexShrink: 0,
                }}>{ANSWER_LETTERS[i]}</span>
                <span>{a.text}</span>
              </button>
            );
          })}
        </div>

        {/* Countdown bar — visible only while auto-advancing */}
        {isAdvancing && (
          <div key={selectedAnswer} style={{ marginTop: 20 }}>
            <div style={{ height: 2, background: T.border, borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", background: T.vert, borderRadius: 1, animation: "countdown 0.6s linear forwards" }} />
            </div>
            {questionIndex === 0 && (
              <p style={{ fontSize: 11, color: T.textLight, textAlign: "center", marginTop: 6, fontFamily: T.f }}>
                Se déplace automatiquement
              </p>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav — only Précédent; auto-advance handles forward */}
      <nav style={{ borderTop: `1px solid ${T.border}`, padding: "16px 24px", background: T.creme, position: "sticky", bottom: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <button onClick={onPrev} disabled={questionIndex === 0} aria-label="Question précédente" style={{
            padding: "12px 28px", fontSize: 14, fontFamily: T.f, fontWeight: 600, background: "transparent",
            color: questionIndex === 0 ? T.textLight : T.textMuted, border: `1px solid ${T.border}`,
            borderRadius: T.rSm, cursor: questionIndex === 0 ? "default" : "pointer", minHeight: 48,
          }}>Précédent</button>
        </div>
      </nav>
    </div>
  );
}

function ResultScreen({ answers, onRestart }) {
  const [unlocked, setUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState("");

  const dimensionScores = useMemo(() => computeDimensionScores(answers), [answers]);
  const globalScore = useMemo(() => computeGlobalScore(dimensionScores), [dimensionScores]);
  const category = useMemo(() => getCategory(globalScore), [globalScore]);
  const globalResult = useMemo(() => GLOBAL_RESULTS[category.key], [category.key]);
  const dimensionResults = useMemo(() => buildDimensionResults(dimensionScores), [dimensionScores]);
  const dimensionScoresPct = useMemo(() => Object.fromEntries(dimensionResults.map(d => [d.id, d.pct])), [dimensionResults]);
  const priorityDimId = useMemo(() => getPriorityDimension(dimensionScoresPct), [dimensionScoresPct]);
  const orderedDimIds = useMemo(() => getOrderedDimensions(dimensionScoresPct), [dimensionScoresPct]);
  const orderedDimResults = useMemo(() => orderedDimIds.map(id => dimensionResults.find(d => d.id === id)), [orderedDimIds, dimensionResults]);
  const priorityDimResult = useMemo(() => dimensionResults.find(d => d.id === priorityDimId), [priorityDimId, dimensionResults]);
  const radarData = useMemo(() => dimensionResults.map(dim => ({ dimension: dim.shortName, score: dim.score, fullMark: MAX_DIM_SCORE })), [dimensionResults]);
  const pdfProps = useMemo(() => ({
    globalScore,
    category,
    globalResult,
    dimensionResults,
    priorityDimId,
    orderedDimIds,
    collabUrl: import.meta.env.VITE_COLLAB_SOLVED_URL ?? "",
    collabEmail: import.meta.env.VITE_COLLAB_SOLVED_EMAIL ?? "",
  }), [globalScore, category, globalResult, dimensionResults, priorityDimId, orderedDimIds]);

  // Track quiz completion (once)
  useEffect(() => {
    trackEvent("quiz_completed", {
      score_global: globalScore,
      category: category.label,
      priority_dim: priorityDimResult?.shortName || "",
      visibility: dimensionScores.visibility,
      proof: dimensionScores.proof,
      business: dimensionScores.business,
      autonomy: dimensionScores.autonomy,
      strategic: dimensionScores.strategic,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScrollToUnlock = useCallback(() => {
    document.getElementById("unlock-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);


  const handleShare = useCallback(() => {
    const text = `Je viens de faire un diagnostic sur la solidité de mon rôle de Scrum Master. 20 questions, 5 minutes, et des pistes d'action que j'aurais aimé avoir avant → https://dub.sh/sm-survival-score`;
    if (navigator.share) navigator.share({ text, url: "https://dub.sh/sm-survival-score" });
    else navigator.clipboard?.writeText(text);
  }, []);

  return (
    <div style={{ fontFamily: T.f, background: T.creme, minHeight: "100vh" }}>
      {/* Hero score */}
      <header style={{ background: T.vert, padding: "48px 24px 56px", textAlign: "center", animation: "fadeIn 0.4s ease-out" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontSize: 12, color: `${T.white}99`, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Ton score</p>
          <div aria-label={`Score : ${globalScore} sur 100`} style={{ fontSize: "clamp(64px, 18vw, 96px)", fontWeight: 900, color: category.key === "irreplaceable" ? T.jaune : category.color, lineHeight: 1, letterSpacing: "-0.04em", animation: "scaleIn 0.4s ease-out 0.15s both", willChange: "transform, opacity" }}>{globalScore}</div>
          <p style={{ fontSize: 16, color: `${T.white}80`, marginBottom: 20 }}>/100</p>
          <div style={{ display: "inline-block", padding: "10px 28px", fontSize: 15, fontWeight: 700, color: T.vertDark, background: T.jaune, borderRadius: 24 }}>{category.label}</div>
        </div>
      </header>

      {/* Bento content */}
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px 60px" }}>
        {/* Global text card */}
        <BentoCard style={{ marginBottom: 16, animation: "fadeUp 0.4s ease-out 0.2s both" }}>
          {globalResult.paragraphs.map((p, i) => <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: T.textMid, marginBottom: 12 }}>{p}</p>)}
        </BentoCard>

        {/* Bento grid: radar + bars side by side on desktop, stacked on mobile */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16 }}>
          {/* Radar card */}
          <BentoCard style={{ animation: "fadeUp 0.4s ease-out 0.3s both" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: T.vert, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ton profil</h3>
            <div style={{ width: "100%", height: 260 }} role="img" aria-label={`Radar chart de ton profil : ${radarData.map(d => `${d.dimension} ${d.score}/8`).join(", ")}`}>
              <ResponsiveContainer>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.textMuted, fontFamily: T.f }} />
                  <PolarRadiusAxis angle={90} domain={[0, 8]} tick={{ fontSize: 9, fill: T.textLight }} tickCount={5} />
                  <Radar dataKey="score" stroke={T.vert} fill={T.vert} fillOpacity={0.12} strokeWidth={2.5} dot={{ r: 4, fill: T.vert }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          {/* Scores card */}
          <BentoCard style={{ animation: "fadeUp 0.4s ease-out 0.35s both" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: T.vert, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Par dimension</h3>
            {dimensionResults.map((dim, i) => {
              const dimCategory = getCategory(dim.pct);
              return (
                <div key={dim.id} style={{ marginBottom: i < dimensionResults.length - 1 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{dim.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: dimCategory.color, fontFamily: "monospace" }}>{dim.score}/{MAX_DIM_SCORE}</span>
                  </div>
                  <div role="meter" aria-valuenow={dim.score} aria-valuemin={0} aria-valuemax={MAX_DIM_SCORE} aria-label={dim.name} style={{ height: 6, background: T.cremeDeep, borderRadius: 3 }}>
                    <div style={{ height: 6, width: `${Math.max(dim.pct, 3)}%`, background: dimCategory.color, borderRadius: 3, transition: "width 0.6s ease-out" }} />
                  </div>
                </div>
              );
            })}
          </BentoCard>
        </div>

        {/* Signal de priorité — au-dessus des diagnostics */}
        <PrioritySignal priorityDimId={priorityDimId} />

        {/* Diagnostics */}
        <section aria-label="Diagnostics détaillés" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 4 }}>Diagnostic par dimension</h3>
          <DiagnosticCard dimension={priorityDimResult} index={0} />
          {unlocked ? (
            orderedDimResults.filter(d => d.id !== priorityDimId).map((dim, i) => <DiagnosticCard key={dim.id} dimension={dim} index={i + 1} />)
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orderedDimResults.filter(d => d.id !== priorityDimId).map(dim => <LockedDiagnosticCard key={dim.id} dimension={dim} onUnlockClick={handleScrollToUnlock} />)}
              </div>
              <BentoCard id="unlock-form" style={{ background: T.vert, border: "none", textAlign: "center", padding: "36px 28px" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 8 }}>Débloque tes 4 autres diagnostics</p>
                <p style={{ fontSize: 13, color: `${T.white}bb`, marginBottom: 24, lineHeight: 1.6 }}>Entre ton email pour voir tes résultats complets. Tu recevras aussi une tactique par semaine pour défendre ton rôle.</p>
                <GhostSignupForm onSuccess={(email) => { setUnlocked(true); setShowModal(true); setSubscribedEmail(email); trackEvent("diagnostics_unlocked"); }} />
              </BentoCard>
            </>
          )}
        </section>

        {/* Actions */}
        <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          <button onClick={handleShare} aria-label="Partager le test" style={T.btnAction}>
            Envoie le test à un collègue SM
          </button>
          <button onClick={onRestart} aria-label="Refaire le test" style={T.btnGhost}>
            Refaire le test
          </button>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: "center", paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 12, color: T.textLight }}>Un outil <a href="https://dub.sh/cs-website" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: T.textMuted, textDecoration: "underline", textUnderlineOffset: 3 }}>Collaboration Solved</a> — par Pierre-Cyril Denant</p>
        </footer>
      </main>
      {showModal && <UnlockModal email={subscribedEmail} onClose={() => setShowModal(false)} pdfProps={pdfProps} />}
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================

export default function SMSurvivalScore() {
  const [screen, setScreen] = useState(() => loadQuizState()?.screen ?? SCREEN.LANDING);
  const [currentQ, setCurrentQ] = useState(() => loadQuizState()?.currentQ ?? 0);
  const [answers, setAnswers] = useState(() => loadQuizState()?.answers ?? Array(QUESTIONS.length).fill(null));
  // Ephemeral — not persisted. Stores which dim index just completed so we can show the reveal screen.
  const [chapterReveal, setChapterReveal] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  useEffect(() => {
    if (screen === SCREEN.LANDING && answers.every(a => a === null)) {
      clearQuizState();
    } else {
      saveQuizState({ answers, currentQ, screen });
    }
  }, [answers, currentQ, screen]);

  useEffect(() => {
    const handleAbandon = () => {
      const payload = buildAbandonPayload(screen, currentQ, answers);
      if (!payload) return;
      trackEvent('quiz_abandoned', payload);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleAbandon();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', handleAbandon);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', handleAbandon);
    };
  }, [screen, currentQ, answers]);

  const handleStart = useCallback(() => { trackEvent("quiz_started"); setScreen(SCREEN.QUIZ); setCurrentQ(0); }, []);
  const handleSelect = useCallback((i) => { setAnswers(prev => { const a = [...prev]; a[currentQ] = i; return a; }); }, [currentQ]);
  const handleNext = useCallback(() => {
    const isLast = currentQ === QUESTIONS.length - 1;
    const isChapterEnd = (currentQ + 1) % QUESTIONS_PER_DIM === 0 && !isLast;
    if (isLast) {
      setScreen(SCREEN.RESULT);
    } else if (isChapterEnd) {
      setChapterReveal({ completedDimIndex: Math.floor(currentQ / QUESTIONS_PER_DIM) });
      setCurrentQ(p => p + 1);
    } else {
      setCurrentQ(p => p + 1);
    }
  }, [currentQ]);
  const handleChapterRevealDone = useCallback(() => setChapterReveal(null), []);
  const handlePrev = useCallback(() => { if (currentQ > 0) { setChapterReveal(null); setCurrentQ(p => p - 1); } }, [currentQ]);
  const handleRestart = useCallback(() => { clearQuizState(); setAnswers(Array(QUESTIONS.length).fill(null)); setCurrentQ(0); setChapterReveal(null); setScreen(SCREEN.LANDING); }, []);

  return (
    <StyleProvider>
      {screen === SCREEN.LANDING && <LandingScreen onStart={handleStart} />}
      {screen === SCREEN.QUIZ && chapterReveal ? (
        <ChapterRevealScreen
          completedDimIndex={chapterReveal.completedDimIndex}
          nextDimIndex={chapterReveal.completedDimIndex + 1}
          onContinue={handleChapterRevealDone}
        />
      ) : screen === SCREEN.QUIZ ? (
        <QuestionScreen
          questionIndex={currentQ}
          question={QUESTIONS[currentQ]}
          selectedAnswer={answers[currentQ]}
          onSelect={handleSelect}
          onNext={handleNext}
          onPrev={handlePrev}
          total={QUESTIONS.length}
        />
      ) : null}
      {screen === SCREEN.RESULT && <ResultScreen answers={answers} onRestart={handleRestart} />}
    </StyleProvider>
  );
}
