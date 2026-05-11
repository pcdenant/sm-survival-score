import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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
  return (
    <div role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-label={`Question ${currentIndex + 1} sur ${QUESTIONS.length}`} style={{ display: "flex", gap: 3 }}>
      {DIMENSIONS.map((dim, i) => (
        <div key={dim.id} style={{ flex: 1, display: "flex", gap: 2 }}>
          {Array.from({ length: QUESTIONS_PER_DIM }, (_, q) => {
            const idx = i * QUESTIONS_PER_DIM + q;
            return <div key={q} style={{ flex: 1, height: 3, borderRadius: 2, background: idx === currentIndex ? T.jaune : idx < currentIndex + 1 ? T.vert : T.cremeDeep, transition: "background 0.2s ease" }} />;
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HOOKS
// ============================================================

function useKitFormUnlock() {
  const [unlocked, setUnlocked] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (unlocked || !containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://collaboration-solved.kit.com/da72eeaa73/index.js";
    script.async = true;
    script.dataset.uid = "da72eeaa73";
    containerRef.current.appendChild(script);

    const SUCCESS_KEYWORDS = ["success", "merci", "thank", "confirm", "check your email", "vérifi"];
    const observer = new MutationObserver(() => {
      const container = containerRef.current;
      if (!container) return;
      const byText = SUCCESS_KEYWORDS.some(kw => container.innerText.toLowerCase().includes(kw));
      const byElement = !!container.querySelector("[data-state='success'], .formkit-alert-success, .formkit-success");
      if (byText || byElement) { trackEvent("diagnostics_unlocked"); setUnlocked(true); observer.disconnect(); }
    });
    observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [unlocked]);

  return { unlocked, containerRef };
}

// ============================================================
// SCREENS
// ============================================================

function LandingScreen({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: T.vert, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: T.f }}>
      <main style={{ maxWidth: 520, textAlign: "center", animation: "fadeUp 0.5s ease-out" }}>
        <div style={{ display: "inline-block", padding: "6px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.jaune, border: `1px solid ${T.jaune}50`, borderRadius: 20, marginBottom: 36 }}>
          Diagnostic gratuit
        </div>
        <h1 style={{ fontSize: "clamp(30px, 7vw, 44px)", fontWeight: 900, lineHeight: 1.15, color: T.white, marginBottom: 20, letterSpacing: "-0.03em" }}>
          <span style={{ display: "block" }}>Ton rôle est en danger.</span>
          <span style={{ display: "block", fontWeight: 700 }}>Tu ne sais pas encore où.</span>
        </h1>
        <p style={{ fontSize: 17, fontWeight: 500, color: `${T.white}cc`, marginBottom: 0 }}>
          20 questions · 5 min · Score sur 5 dimensions
        </p>
        <hr style={{ border: "none", borderTop: `1px solid ${T.white}20`, width: 60, margin: "32px auto" }} />
        <div style={{ fontSize: 15, color: `${T.white}99`, lineHeight: 1.75, marginBottom: 48, maxWidth: 440, marginLeft: "auto", marginRight: "auto", textAlign: "left" }}>
          <p style={{ marginBottom: 20 }}>
            En janvier 2023, Capital One a dissous sa famille de rôles agile. 1 100 postes. Dans leur communiqué, ces personnes étaient qualifiées de « critiques ». Elles ont été éliminées quand même.
          </p>
          <p style={{ marginBottom: 20 }}>
            Selon ScrumAlliance, 18% des Scrum Masters ont été touchés par des licenciements depuis 2022. Des outils vendent aujourd'hui 85% des responsabilités visibles du SM en abonnement mensuel, pour un fragment de ton salaire. La direction peut faire le calcul.
          </p>
          <p style={{ marginBottom: 20, color: `${T.white}cc`, fontStyle: "italic", fontWeight: 600 }}>
            Le risque n'est pas toujours là où tu crois.<br />C'est ça, l'angle mort métier.
          </p>
          <p style={{ marginBottom: 0 }}>
            Ce diagnostic mesure ta situation sur 5 dimensions. Tu repars avec un score et un plan d'action par zone de vulnérabilité.
          </p>
        </div>
        <button onClick={onStart} style={{ padding: "18px 56px", fontSize: 16, fontWeight: 700, fontFamily: T.f, background: T.jaune, color: T.vertDark, border: "none", borderRadius: T.r, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", minHeight: 56 }}>
          Voir mes angles morts
        </button>
        <p style={{ fontSize: 12, color: `${T.white}60`, marginTop: 24 }}>Gratuit · Sans inscription · Résultat immédiat</p>
      </main>
    </div>
  );
}

function QuestionScreen({ questionIndex, question, selectedAnswer, onSelect, onNext, onPrev, total }) {
  const dimInfo = DIMENSIONS.find(d => d.id === question.dimension);
  const answerRefs = useRef([]);

  const handleAnswerKey = useCallback((e, i) => {
    const n = question.answers.length;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (i + 1) % n;
      onSelect(next);
      answerRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (i - 1 + n) % n;
      onSelect(prev);
      answerRefs.current[prev]?.focus();
    }
  }, [question.answers.length, onSelect]);

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
        <h2 style={{ fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 700, lineHeight: 1.5, color: T.text, marginBottom: 32 }}>
          {question.text}
        </h2>
        <div role="radiogroup" aria-label="Choisis ta réponse" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {question.answers.map((a, i) => {
            const sel = selectedAnswer === i;
            return (
              <button
                key={i}
                ref={el => { answerRefs.current[i] = el; }}
                role="radio"
                aria-checked={sel}
                onClick={() => onSelect(i)}
                onKeyDown={(e) => handleAnswerKey(e, i)}
                tabIndex={sel || (selectedAnswer === null && i === 0) ? 0 : -1}
                style={{
                  padding: "18px 20px", fontSize: 15, lineHeight: 1.5, fontFamily: T.f, textAlign: "left",
                  background: sel ? T.vert : T.white, color: sel ? T.white : T.text,
                  border: `2px solid ${sel ? T.vert : T.border}`, borderRadius: T.r,
                  cursor: "pointer", transition: "all 0.15s ease", fontWeight: sel ? 600 : 400,
                  minHeight: 56,
                }}
              >{a.text}</button>
            );
          })}
        </div>
      </main>

      {/* Bottom nav */}
      <nav style={{ borderTop: `1px solid ${T.border}`, padding: "16px 24px", background: T.creme, position: "sticky", bottom: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", justifyContent: "space-between" }}>
          <button onClick={onPrev} disabled={questionIndex === 0} aria-label="Question précédente" style={{
            padding: "12px 28px", fontSize: 14, fontFamily: T.f, fontWeight: 600, background: "transparent",
            color: questionIndex === 0 ? T.textLight : T.textMuted, border: `1px solid ${T.border}`,
            borderRadius: T.rSm, cursor: questionIndex === 0 ? "default" : "pointer", minHeight: 48,
          }}>Précédent</button>
          <button onClick={onNext} disabled={selectedAnswer === null} aria-label={questionIndex === total - 1 ? "Voir le résultat" : "Question suivante"} style={{
            padding: "12px 32px", fontSize: 14, fontFamily: T.f, fontWeight: 700,
            background: selectedAnswer === null ? T.textLight : T.vert, color: T.white,
            border: "none", borderRadius: T.rSm, cursor: selectedAnswer === null ? "default" : "pointer", minHeight: 48,
          }}>{questionIndex === total - 1 ? "Voir mon résultat" : "Suivant"}</button>
        </div>
      </nav>
    </div>
  );
}

function ResultScreen({ answers, onRestart }) {
  const { unlocked, containerRef: kitContainerRef } = useKitFormUnlock();

  const dimensionScores = useMemo(() => computeDimensionScores(answers), [answers]);
  const globalScore = useMemo(() => computeGlobalScore(dimensionScores), [dimensionScores]);
  const category = useMemo(() => getCategory(globalScore), [globalScore]);
  const globalResult = useMemo(() => GLOBAL_RESULTS[category.key], [category.key]);
  const dimensionResults = useMemo(() => buildDimensionResults(dimensionScores), [dimensionScores]);
  const dimensionsSortedByScore = useMemo(() => [...dimensionResults].sort((a, b) => a.score - b.score), [dimensionResults]);
  const radarData = useMemo(() => dimensionResults.map(dim => ({ dimension: dim.shortName, score: dim.score, fullMark: MAX_DIM_SCORE })), [dimensionResults]);

  // Track quiz completion (once)
  useEffect(() => {
    trackEvent("quiz_completed", {
      score_global: globalScore,
      category: category.label,
      weakest_dim: dimensionsSortedByScore[0]?.shortName || "",
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

        {/* Diagnostics */}
        <section aria-label="Diagnostics détaillés" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 4 }}>Diagnostic par dimension</h3>
          <DiagnosticCard dimension={dimensionsSortedByScore[0]} index={0} />
          {unlocked ? (
            dimensionsSortedByScore.slice(1).map((dim, i) => <DiagnosticCard key={dim.id} dimension={dim} index={i + 1} />)
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dimensionsSortedByScore.slice(1).map(dim => <LockedDiagnosticCard key={dim.id} dimension={dim} onUnlockClick={handleScrollToUnlock} />)}
              </div>
              <BentoCard id="unlock-form" style={{ background: T.vert, border: "none", textAlign: "center", padding: "36px 28px" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 8 }}>Débloque tes 4 autres diagnostics</p>
                <p style={{ fontSize: 13, color: `${T.white}bb`, marginBottom: 24, lineHeight: 1.6 }}>Entre ton email pour voir tes résultats complets. Tu recevras aussi une tactique par semaine pour défendre ton rôle.</p>
                <div ref={kitContainerRef} style={{ maxWidth: 380, margin: "0 auto" }} />
              </BentoCard>
            </>
          )}
        </section>

        {/* Confirmation */}
        {unlocked && (
          <BentoCard style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", marginBottom: 16, textAlign: "center", animation: "fadeUp 0.3s ease-out" }} role="alert">
            <p style={{ fontSize: 14, color: T.vert, fontWeight: 600 }}>C'est débloqué. Tu recevras ta première tactique cette semaine.</p>
          </BentoCard>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
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
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================

export default function SMSurvivalScore() {
  const [screen, setScreen] = useState(SCREEN.LANDING);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(() => Array(QUESTIONS.length).fill(null));

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

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
  const handleNext = useCallback(() => { if (currentQ === QUESTIONS.length - 1) setScreen(SCREEN.RESULT); else setCurrentQ(p => p + 1); }, [currentQ]);
  const handlePrev = useCallback(() => { if (currentQ > 0) setCurrentQ(p => p - 1); }, [currentQ]);
  const handleRestart = useCallback(() => { setAnswers(Array(QUESTIONS.length).fill(null)); setCurrentQ(0); setScreen(SCREEN.LANDING); }, []);

  return (
    <StyleProvider>
      {screen === SCREEN.LANDING && <LandingScreen onStart={handleStart} />}
      {screen === SCREEN.QUIZ && (
        <QuestionScreen
          questionIndex={currentQ}
          question={QUESTIONS[currentQ]}
          selectedAnswer={answers[currentQ]}
          onSelect={handleSelect}
          onNext={handleNext}
          onPrev={handlePrev}
          total={QUESTIONS.length}
        />
      )}
      {screen === SCREEN.RESULT && <ResultScreen answers={answers} onRestart={handleRestart} />}
    </StyleProvider>
  );
}
