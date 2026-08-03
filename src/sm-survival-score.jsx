import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

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

const ARTICLE_LINKS = {
  banners: {
    vulnerable: {
      accroche: "Ton manager peut décrire ce que tu fais en 3 mots ?",
      linkText: "Fais le test →",
      url: "https://collaborationsolved.com/ton-manager-comprend-il-ton-role-scrum-master/",
    },
    stable: {
      accroche: "Stable aujourd'hui ne veut pas dire stable après la prochaine réorg.",
      linkText: "Pourquoi l'ombre est un risque →",
      url: "https://collaborationsolved.com/scrum-master-invisibilite-sortir-ombre/",
    },
    irreplaceable: {
      accroche: "Ce qui te rend irremplaçable aujourd'hui ne le restera pas automatiquement.",
      linkText: "L'angle mort que l'IA révèle →",
      url: "https://collaborationsolved.com/ce-que-lia-ne-sait-pas-cest-toi-qui-le-sais/",
    },
  },
  cards: {
    visibility: {
      linkText: "Commence ici : Ton manager peut décrire ce que tu fais ? →",
      url: "https://collaborationsolved.com/ton-manager-comprend-il-ton-role-scrum-master/",
    },
    proof: {
      linkText: "Tu as peut-être déjà les preuves sans le savoir →",
      url: "https://collaborationsolved.com/preuves-impact-scrum-master-invisibles/",
    },
    business: {
      linkText: "Scrum vs. budget : apprends à traduire →",
      url: "https://collaborationsolved.com/sm-parles-agile-manager-pense-budget-personne-ne-traduit/",
    },
    strategic: null,
    autonomy: {
      linkText: "Un outil pour réduire la dépendance de ton équipe en 5 min/semaine →",
      url: "https://collaborationsolved.com/email-vendredi-scrum-master-prouver-impact/",
    },
  },
};

// Retourne { url, linkText } | { cta: true, text } | null
function getCardArticle(categoryKey, dimensionId) {
  if (categoryKey === "irreplaceable") {
    return { cta: true, text: "Déverrouille les 4 autres dimensions pour identifier l'angle mort qui reste." };
  }
  if (dimensionId === "strategic") {
    return { cta: true, text: "C'est la dimension la plus difficile à construire — et la première consultée en cas de réorg. Je couvre ça chaque semaine dans la newsletter." };
  }
  // Anti-doublon : bannière Vulnérable pointe déjà vers Éd.1 (Visibilité)
  if (categoryKey === "vulnerable" && dimensionId === "visibility") {
    return { cta: true, text: "Déverrouille les 4 autres dimensions pour aller plus loin." };
  }
  return ARTICLE_LINKS.cards[dimensionId] || null;
}

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

// `color` est calibré pour un fond clair (badges, barres, bordures) ; `onDark` pour le vert
// foncé (score du héros, carte de score). Un seul token ne peut pas servir les deux : plus on
// fonce pour passer AA sur fond clair, plus on échoue sur fond foncé.
export function getCategory(percentage) {
  if (percentage < SCORE_THRESHOLDS.low) return { key: "vulnerable", label: "Vulnérable", color: "#c81e1e", onDark: "#ffb4ab", bg: "#fef2f2" };
  if (percentage < SCORE_THRESHOLDS.mid) return { key: "stable", label: "Stable", color: "#b45309", onDark: "#ffd166", bg: "#fffbeb" };
  return { key: "irreplaceable", label: "Irremplaçable", color: "#006946", onDark: "#FFF200", bg: "#ecfdf5" };
}

export function getDiagnosticLevel(score) { return score <= 3 ? "low" : score <= 5 ? "mid" : "high"; }

export function buildDimensionResults(dimensionScores, dimensions = DIMENSIONS) {
  return dimensions.map(dim => ({ ...dim, score: dimensionScores[dim.id], pct: Math.round((dimensionScores[dim.id] / MAX_DIM_SCORE) * 100) }));
}

// `includes("@") && includes(".")` acceptait « a@b. », « a b@c.d », « a@b@c.d » et « hello.world@ » :
// le serveur les rejetait ensuite en 400, et l'utilisateur recevait un message d'erreur générique
// pour une faute que le client pouvait voir. Même règle que api/subscribe.js, volontairement.
export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
  try {
    flushSync(() => root.render(
      <PDFDocument
      {...pdfProps}
      articleLinks={ARTICLE_LINKS.cards}
      bannerArticle={ARTICLE_LINKS.banners[pdfProps.category.key] ?? null}
    />
  ));

  // Capture forced page-break positions and link coordinates before html2canvas
  const containerRect = container.getBoundingClientRect();

  const forceBreakYs = [...container.querySelectorAll('[data-pdf-force-break]')]
    .map(el => Math.round(el.getBoundingClientRect().top - containerRect.top))
    .filter(y => y > 0)
    .sort((a, b) => a - b);

  const linkRects = [...container.querySelectorAll('a[href]')].map(a => {
    const r = a.getBoundingClientRect();
    return { url: a.href, x: r.left - containerRect.left, y: r.top - containerRect.top, w: r.width, h: r.height };
  });

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 794,
    windowWidth: 794,
  });

  const pageW = 794;
  const canvasScale = canvas.width / pageW; // = 2 (scale: 2)
  const totalImgH = canvas.height / canvasScale; // total height in PDF px (= DOM px)

  // Build page slices at forced-break positions; last slice takes the remainder
  const pageSlices = [];
  let curY = 0;
  for (const breakY of forceBreakYs) {
    if (breakY > curY) { pageSlices.push({ start: curY, end: breakY }); curY = breakY; }
  }
  pageSlices.push({ start: curY, end: totalImgH });

  // Create PDF with adaptive page heights.
  // jsPDF normalises [w, h] to portrait (h >= w) — if sliceH < pageW it would flip
  // the dimensions, making the page narrower than 794px and clipping the right side.
  // pdfH is the declared page height (≥ pageW+1); sliceH is the actual image height.
  const firstSliceH = pageSlices[0].end - pageSlices[0].start;
  const firstPdfH = Math.max(firstSliceH, pageW + 1);
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pageW, firstPdfH] });

  for (let i = 0; i < pageSlices.length; i++) {
    const { start, end } = pageSlices[i];
    const sliceH = end - start;
    const pdfH = Math.max(sliceH, pageW + 1); // prevent jsPDF portrait flip
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.round(sliceH * canvasScale);
    sliceCanvas.getContext('2d').drawImage(
      canvas,
      0, Math.round(start * canvasScale), canvas.width, Math.round(sliceH * canvasScale),
      0, 0, canvas.width, Math.round(sliceH * canvasScale)
    );
    if (i > 0) pdf.addPage([pageW, pdfH]);
    pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, sliceH);
  }

  // Add clickable link annotations over the raster image
  for (const link of linkRects) {
    const pageIndex = pageSlices.findIndex(({ start, end }) => link.y >= start && link.y < end);
    if (pageIndex === -1) continue;
    pdf.setPage(pageIndex + 1);
    pdf.link(link.x, link.y - pageSlices[pageIndex].start, link.w, link.h, { url: link.url });
  }

    pdf.save(filename);
  } finally {
    root.unmount();
    container.remove();
  }
}

// ============================================================
// STORAGE UTILITIES — localStorage quiz persistence
// ============================================================

const STORAGE_KEY = "sm-survival-score-state";
const DEVICE_ID_KEY = "sm-device-id";
const COMPLETED_TRACKED_KEY = "sm-quiz-completed-tracked";

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
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETED_TRACKED_KEY);
  } catch (_) {}
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) { id = generateUUID(); localStorage.setItem(DEVICE_ID_KEY, id); }
    return id;
  } catch (_) { return "unknown"; }
}

const DEVICE_ID = getOrCreateDeviceId();

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
    const payload = { timestamp: new Date().toISOString(), event, deviceId: DEVICE_ID, ...data };
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
  // Échelle de gris calibrée pour tenir AA (4.5:1) sur les DEUX surfaces claires du produit,
  // crème #FBF3EB et blanc. Les anciennes valeurs (#7a7a7a, #a3a3a3) tombaient à 2.30–4.29 :
  // le contraste minimal sur crème impose ~#6e6e6e, donc la hiérarchie se resserre et se joue
  // désormais surtout à la taille et à la graisse, pas seulement à la couleur.
  text: "#1a1a1a",      // 15.85 crème / 17.40 blanc
  textMid: "#4a4a4a",   //  8.07 /  8.86
  textMuted: "#666666", //  5.23 /  5.74
  textLight: "#6e6e6e", //  4.64 /  5.10
  // Texte secondaire sur le vert : white@.8. En dessous ça échoue (.733 → 4.41, .6 → 3.48).
  onVertMuted: "rgba(255,255,255,.8)",
  border: "#e8ddd1",
  borderLight: "#f0e8de",
  trackBorder: "#8c8073", // 3.85 sur blanc — délimite la piste du meter (WCAG 1.4.11)
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
  .btn-hover { transition: filter 0.15s ease; }
  .btn-hover:hover:not(:disabled) { filter: brightness(0.94); }
  .btn-hover:active:not(:disabled) { filter: brightness(0.88); }
  /* Sous 420px le champ + bouton ne tiennent plus sur une ligne : empilement */
  @media (max-width: 420px) {
    .signup-row { flex-direction: column; }
    .signup-row > * { width: 100%; }
  }
  .signup-input:focus-visible { outline: 2px solid ${T.jaune}; outline-offset: 2px; }
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
// ICONS — minimal authored line-icon set (stroke 2.2, no fill)
// ============================================================

function IconLock({ size = 12, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconUnlock({ size = 12, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function IconClock({ size = 11, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconCheck({ size = 28, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconClose({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconChevron({ size = 12, color = "currentColor", direction = "down" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} data-a11y-icon strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: direction === "up" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
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

// Variante quand la dimension prioritaire est déjà solide (score ≥ 6). Sans ça, le bloc
// affiche « tant que cette dimension reste faible » au-dessus d'une carte « Solide — 8/8 ».
const SIGNAL_TEXTS_HIGH = {
  visibility: {
    title: 'Ton point le plus fragile : ce que ton management retient de toi.',
    body: "Et il tient. Sauf que la visibilité ne se stocke pas. Elle se rejoue à chaque changement de direction. Ce qui est acquis aujourd'hui se redemande demain.",
  },
  strategic: {
    title: 'Ton point le plus fragile : comment tu es perçu.',
    body: "Et ça tient. Mais cette perception est attachée aux gens en poste. Une réorg la remet à zéro plus vite que tes résultats.",
  },
  proof: {
    title: 'Ton point le plus fragile : tes preuves.',
    body: "Et elles tiennent. Tu as de quoi répondre quand la question arrive. Le risque n'est plus le trou. C'est la date. Des preuves d'il y a deux ans ne défendent pas le poste d'aujourd'hui.",
  },
  business: {
    title: 'Ton point le plus fragile : ton langage.',
    body: "Et il tient. Tu traduis déjà ton travail dans un format que la direction comprend. Ce qui bouge, c'est ce qu'elle mesure. Le vocabulaire de l'an dernier ne porte pas toujours cette année.",
  },
  autonomy: {
    title: "Ton point le plus fragile : l'autonomie de ton équipe.",
    body: "Et elle tient. Ton équipe fonctionne sans toi, et c'est ce qui te rend défendable. Garde-la. L'autonomie se dégrade dès qu'on arrête de la travailler.",
  },
};

export function getSignalText(dimId, level) {
  return (level === "high" ? SIGNAL_TEXTS_HIGH[dimId] : SIGNAL_TEXTS[dimId]) ?? null;
}

function PrioritySignal({ priorityDimId, level }) {
  const signal = getSignalText(priorityDimId, level);
  if (!signal) return null;
  return (
    <div style={{ backgroundColor: T.vertDark, borderRadius: T.r, padding: '18px 20px', margin: '20px 0 24px 0' }}>
      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: T.jaune, margin: '0 0 6px 0', fontFamily: T.f, letterSpacing: '-0.01em' }}>{signal.title}</p>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,.75)', margin: 0, lineHeight: 1.5, fontFamily: T.f }}>{signal.body}</p>
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

// `rank` : position dans le classement pondéré (1 = prioritaire). La sévérité était portée
// uniquement par une pastille de 11px, si bien que cinq cartes empilées se lisaient comme
// cinq bandes identiques — le produit vend précisément le fait que certaines dimensions
// pèsent et d'autres non. Elle passe donc dans la composition : la carte prioritaire s'ouvre
// avec son rang et une bande d'accent, une dimension déjà solide s'affiche repliée.
function DiagnosticCard({ dimension, index, rank = null, cardArticle = null }) {
  const level = getDiagnosticLevel(dimension.score);
  const isPriority = rank === 1;
  const [expanded, setExpanded] = useState(false);
  const analysisId = `analyse-${dimension.id}`;
  const diag = dimension.diagnostics[level];
  const cat = getCategory(dimension.pct);
  const levelLabel = level === "low" ? "Vulnérable" : level === "mid" ? "À renforcer" : "Solide";

  const firstDot = diag.text.indexOf(". ");
  const secondDot = firstDot !== -1 ? diag.text.indexOf(". ", firstDot + 1) : -1;
  const headline = secondDot !== -1 ? diag.text.slice(0, secondDot + 1) : diag.text;
  const rest = secondDot !== -1 ? diag.text.slice(secondDot + 2) : "";

  return (
    <BentoCard
      style={{
        animation: `fadeUp 0.3s ease-out ${index * 0.06}s both`, padding: 0, overflow: "hidden",
        ...(isPriority ? { boxShadow: `0 2px 16px ${T.vert}1f`, border: `1px solid ${T.vert}` } : null),
      }}
      role="article"
      aria-label={rank ? `Diagnostic ${rank} sur 5 : ${dimension.name}` : `Diagnostic : ${dimension.name}`}
    >
      {isPriority && (
        <div style={{ background: T.vert, padding: "6px 18px", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: T.jaune, fontFamily: T.f }}>
          Priorité 1 — commence ici
        </div>
      )}
      <div style={{ padding: isPriority ? "18px 18px 14px" : "16px 18px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: isPriority ? 17 : 15, fontWeight: 700, color: T.text, margin: 0, fontFamily: T.f, letterSpacing: isPriority ? "-0.01em" : 0 }}>
            {rank && !isPriority && <span style={{ color: T.textMuted, fontWeight: 600, marginRight: 6 }}>{rank}.</span>}
            {dimension.name}
          </h3>
          <span data-a11y-shape style={{ fontSize: 11, fontWeight: 700, color: cat.color, padding: "4px 12px", background: cat.bg, border: `1px solid ${cat.color}`, borderRadius: 20, whiteSpace: "nowrap" }}>{levelLabel} — {dimension.score}/8</span>
        </div>
        <p style={{ fontSize: isPriority ? 16 : 14, fontWeight: 600, lineHeight: 1.55, color: T.text, fontFamily: T.f, marginBottom: 12 }}>{headline}</p>
        {rest && (
          <button
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            aria-controls={analysisId}
            className="btn-hover"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "17px 0", margin: "-17px 0", marginBottom: expanded ? -5 : -17, minHeight: 48, fontFamily: T.f }}
          >
            <IconChevron size={11} color={T.vert} direction={expanded ? "up" : "down"} />
            <span style={{ fontSize: 12, color: T.vert, fontWeight: 600 }}>{expanded ? "Réduire" : "Lire l'analyse complète"}</span>
            {!expanded && <span style={{ fontSize: 12, color: T.textLight }}>(30 sec)</span>}
          </button>
        )}
        {expanded && rest && (
          <p id={analysisId} style={{ fontSize: 13, lineHeight: 1.75, color: T.textMid, fontFamily: T.f, marginBottom: 0 }}>{rest}</p>
        )}
      </div>
      <div style={{ background: T.vert, padding: "16px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: T.jaune, color: T.vertDark, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{rank ?? "1"}</div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.onVertMuted, marginBottom: 3, fontFamily: T.f }}>
              {level === "high" ? "Prochain niveau" : "Action cette semaine"}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: T.white, fontFamily: T.f }}>{diag.action}</p>
            <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.onVertMuted, marginTop: 5, fontFamily: T.f }}>
              <IconClock size={10} color={T.onVertMuted} /> 5 minutes
            </p>
          </div>
        </div>
      </div>
      {cardArticle && (
        <div style={{ padding: "10px 18px 14px", borderTop: `1px solid ${T.borderLight}`, background: T.creme }}>
          {cardArticle.url ? (
            <a href={cardArticle.url} target="_blank" rel="noopener noreferrer"
               style={{ display: "inline-flex", alignItems: "center", minHeight: 48, fontSize: 13, color: T.vert, textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600, fontFamily: T.f }}>
              {cardArticle.linkText}
            </a>
          ) : (
            <>
              <p style={{ fontSize: 13, color: T.textMid, fontFamily: T.f, margin: "0 0 6px", lineHeight: 1.5 }}>{cardArticle.text}</p>
              <a href="#unlock-form"
                 style={{ display: "inline-flex", alignItems: "center", minHeight: 48, fontSize: 13, color: T.vert, textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600, fontFamily: T.f }}>
                S'abonner →
              </a>
            </>
          )}
        </div>
      )}
    </BentoCard>
  );
}

function LockedDiagnosticCard({ dimension, rank = null, onUnlockClick }) {
  const cat = getCategory(dimension.pct);
  const level = getDiagnosticLevel(dimension.score);
  const levelLabel = level === "low" ? "Vulnérable" : level === "mid" ? "À renforcer" : "Solide";
  const firstDot = dimension.diagnostics[level].text.indexOf(". ");
  const hookText = firstDot !== -1 ? dimension.diagnostics[level].text.slice(0, firstDot + 1) : dimension.diagnostics[level].text;

  return (
    <div
      aria-label={rank ? `Diagnostic verrouillé ${rank} sur 5 : ${dimension.name}` : `Diagnostic verrouillé : ${dimension.name}`}
      role="region"
      style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: T.rLg, overflow: "hidden" }}
    >
      <div style={{ padding: "14px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, fontFamily: T.f }}>
            {rank && <span style={{ color: T.textMuted, fontWeight: 600, marginRight: 6 }}>{rank}.</span>}
            {dimension.name}
          </h3>
          <IconLock size={12} color={T.textMuted} />
        </div>
        <span data-a11y-shape style={{ fontSize: 11, fontWeight: 700, color: cat.color, padding: "3px 10px", background: cat.bg, border: `1px solid ${cat.color}`, borderRadius: 20, whiteSpace: "nowrap" }}>
          {levelLabel} — {dimension.score}/8
        </span>
      </div>
      <div style={{ padding: "0 18px", fontSize: 13, lineHeight: 1.6, color: T.textMid, fontFamily: T.f, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {hookText}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: T.creme, borderTop: `1px solid ${T.border}`, marginTop: 8, gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textLight }}>
          <IconUnlock size={11} color={T.textLight} /> Analyse + action concrète
        </span>
        <button
          onClick={onUnlockClick}
          aria-label={`Déverrouiller le diagnostic ${dimension.name}`}
          className="btn-hover"
          style={{ background: T.vert, color: T.white, padding: "10px 16px", borderRadius: T.rSm, fontSize: 12, fontWeight: 700, fontFamily: T.f, border: "none", cursor: "pointer", whiteSpace: "nowrap", minHeight: 48 }}
        >
          Voir le diagnostic →
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

function PDFDocument({ globalScore, category, globalResult, dimensionResults, priorityDimId, orderedDimIds, collabUrl, collabEmail, articleLinks, bannerArticle }) {
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderedResults = orderedDimIds.map(id => dimensionResults.find(d => d.id === id));
  const priorityResult = dimensionResults.find(d => d.id === priorityDimId);
  const priorityLevel = getDiagnosticLevel(priorityResult.score);
  const signal = getSignalText(priorityDimId, priorityLevel);

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
          {globalResult.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.75, color: T.textMid, marginBottom: 12 }}>{p}</p>
          ))}
        </div>
      </div>

      {/* Signal prioritaire */}
      <div style={{ padding: "24px 48px 0" }}>
        <div style={{ backgroundColor: T.vertDark, borderRadius: 4, padding: "14px 18px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 6px 0" }}>⚡ Signal prioritaire</p>
          <p style={{ fontWeight: 600, fontSize: 14, color: T.jaune, margin: "0 0 6px 0" }}>{signal.title}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>{signal.body}</p>
        </div>
        <div style={{ marginTop: 12, background: T.vert, borderRadius: T.rSm, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.jaune, color: T.vertDark, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>1</div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
              Action immédiate — {priorityResult.shortName}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: T.white }}>{priorityResult.diagnostics[priorityLevel].action}</p>
          </div>
        </div>
      </div>

      {/* Bannière article catégorie */}
      {bannerArticle && (
        <div style={{ padding: "16px 48px 0" }}>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, margin: 0 }}>
            {bannerArticle.accroche}{" "}
            <a href={bannerArticle.url} style={{ color: T.vert, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
              {bannerArticle.linkText}
            </a>
          </p>
        </div>
      )}

      {/* Vue d'ensemble */}
      <div style={{ padding: "24px 48px 20px" }}>
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

      {/* Diagnostics détaillés — forced page break before this section (end of page 1) */}
      <div data-pdf-force-break="true" style={{ padding: "24px 48px 32px" }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Diagnostic par dimension</h2>
        {orderedResults.map((dim, index) => {
          const level = getDiagnosticLevel(dim.score);
          const diag = dim.diagnostics[level];
          const dimCat = getCategory(dim.pct);
          const levelLabel = level === "low" ? "Vulnérable" : level === "mid" ? "À renforcer" : "Solide";
          const article = articleLinks?.[dim.id] ?? null;
          return (
            // Fragment key must be on outer element
            <div key={dim.id}>
            {/* spacer with forced-break before card 4 → 24px breathing room at top of page 3 */}
            {index === 3 && <div data-pdf-force-break="true" style={{ height: 24 }} />}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{dim.name}</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: dimCat.color, padding: "3px 10px", background: dimCat.bg, borderRadius: 20 }}>{levelLabel} — {dim.score}/8</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: T.textMid, marginBottom: 10 }}>{diag.text}</p>
              <div style={{ background: T.vert, borderRadius: T.rSm, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.jaune, color: T.vertDark, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>1</div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
                    {level === "high" ? "Prochain niveau" : "Action immédiate"}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: T.white }}>{diag.action}</p>
                </div>
              </div>
              {article && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: T.creme, borderTop: `1px solid ${T.border}` }}>
                  <a href={article.url} style={{ fontSize: 12, color: T.vert, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                    {article.linkText}
                  </a>
                </div>
              )}
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
        {collabUrl && (
          <a href={collabUrl} style={{ fontSize: 13, color: T.vert, fontWeight: 700, display: "block", marginBottom: 4, textDecoration: "underline", textUnderlineOffset: 3 }}>
            {collabUrl}
          </a>
        )}
        {collabEmail && (
          <a href={`mailto:${collabEmail}`} style={{ fontSize: 13, color: T.textMuted, display: "block", marginBottom: 12 }}>
            {collabEmail}
          </a>
        )}
        <p style={{ fontSize: 11, color: T.textLight, marginBottom: 6 }}>Un outil Collaboration Solved — par Pierre-Cyril Denant</p>
        <a href="https://dub.sh/sm-survival-score" style={{ fontSize: 11, color: T.textLight, textDecoration: "underline" }}>
          Faire passer le test à un collègue SM → dub.sh/sm-survival-score
        </a>
      </div>
    </div>
  );
}

// ============================================================
// SCORE CARD — shareable image (1080×1080, downloaded as PNG)
// ============================================================

// Hand-rolled SVG radar (not Recharts) — html2canvas cannot reliably capture
// Recharts' generated SVG (gradients/foreignObject), see PDFDocument above
// which omits the radar for the same reason.
// Canvas is wider than tall: label text (e.g. "Stratégique") needs generous
// horizontal clearance since html2canvas does not respect `overflow: visible`
// on an SVG root, so out-of-bounds text gets clipped instead of overflowing.
function buildRadarPolygon(dimensionResults, { radius = 130, xPad = 150, yPad = 45, maxScore = MAX_DIM_SCORE } = {}) {
  const width = (radius + 38 + xPad) * 2;
  const height = (radius + 38 + yPad) * 2;
  const cx = width / 2;
  const cy = height / 2;
  const n = dimensionResults.length;
  const angleFor = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const points = dimensionResults.map((dim, i) => {
    const angle = angleFor(i);
    // Floor at 4% so an all-zero profile (the "Vulnérable" case this card exists
    // for) still renders a visible polygon instead of collapsing to a single dot —
    // same convention as the dimension bars elsewhere (Math.max(dim.pct, 3)).
    const r = Math.max(dim.score / maxScore, 0.04) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const gridRings = [0.25, 0.5, 0.75, 1].map((f) =>
    dimensionResults
      .map((_, i) => {
        const angle = angleFor(i);
        const r = f * radius;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(" ")
  );

  const axisLines = dimensionResults.map((_, i) => {
    const angle = angleFor(i);
    return { x2: cx + radius * Math.cos(angle), y2: cy + radius * Math.sin(angle) };
  });

  const labels = dimensionResults.map((dim, i) => {
    const angle = angleFor(i);
    const lr = radius + 38;
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), text: dim.shortName };
  });

  return { width, height, cx, cy, points, gridRings, axisLines, labels };
}

function ScoreCardDocument({ globalScore, category, dimensionResults }) {
  const radar = useMemo(() => buildRadarPolygon(dimensionResults), [dimensionResults]);
  const scoreColor = category.onDark;
  const badgeBg = category.key === "irreplaceable" ? T.jaune : category.color;
  const badgeText = category.key === "irreplaceable" ? T.vertDark : T.white;

  return (
    <div style={{ width: 1080, height: 1080, background: T.vert, fontFamily: T.f, boxSizing: "border-box", padding: "64px 56px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
      <p style={{ fontSize: 24, fontWeight: 800, color: T.jaune, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>SM Survival Score</p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 240, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: "-0.04em" }}>{globalScore}</div>
        <p style={{ fontSize: 28, fontWeight: 600, color: `${T.white}cc`, margin: "4px 0 24px" }}>/100</p>
        <div style={{ padding: "14px 40px", fontSize: 26, fontWeight: 700, color: badgeText, background: badgeBg, borderRadius: 32, marginBottom: 48 }}>{category.label}</div>

        <svg width={radar.width} height={radar.height} style={{ overflow: "visible" }}>
          {radar.gridRings.map((ring, i) => (
            <polygon key={i} points={ring} fill="none" stroke={`${T.white}33`} strokeWidth={1.5} />
          ))}
          {radar.axisLines.map((line, i) => (
            <line key={i} x1={radar.cx} y1={radar.cy} x2={line.x2} y2={line.y2} stroke={`${T.white}33`} strokeWidth={1.5} />
          ))}
          <polygon
            points={radar.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={T.jaune} fillOpacity={0.22} stroke={T.jaune} strokeWidth={3} strokeLinejoin="round"
          />
          {radar.points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6} fill={T.jaune} />
          ))}
          {radar.labels.map((l, i) => (
            <text
              key={i} x={l.x} y={l.y} fill={`${T.white}e6`} fontSize={20} fontWeight={700} fontFamily={T.f}
              textAnchor={l.x < radar.cx - 5 ? "end" : l.x > radar.cx + 5 ? "start" : "middle"}
              dominantBaseline={l.y < radar.cy - 5 ? "auto" : l.y > radar.cy + 5 ? "hanging" : "middle"}
            >
              {l.text}
            </text>
          ))}
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: `${T.white}99`, letterSpacing: "0.04em", margin: "0 0 14px" }}>Un outil Collaboration Solved</p>
        <div style={{ display: "inline-block", padding: "12px 30px", fontSize: 20, fontWeight: 800, color: T.vertDark, background: T.jaune, borderRadius: 28 }}>dub.sh/sm-survival-score</div>
      </div>
    </div>
  );
}

async function generateScoreCard({ globalScore, category, dimensionResults, sessionId }) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `score-sm-survival-${globalScore}-${dateStr}.png`;

  const { default: html2canvas } = await import("html2canvas");

  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:1080px;height:1080px;";
  document.body.appendChild(container);

  const root = createRoot(container);
  let canvas;
  try {
    flushSync(() => root.render(<ScoreCardDocument globalScore={globalScore} category={category} dimensionResults={dimensionResults} />));

    canvas = await html2canvas(container, {
      width: 1080,
      height: 1080,
      windowWidth: 1080,
      scale: 1,
      useCORS: true,
      logging: false,
    });
  } finally {
    root.unmount();
    container.remove();
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("canvas.toBlob a renvoyé null");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  trackEvent("score_card_generated", { sessionId, score_global: globalScore, category: category.label });
}

// ============================================================
// SCREENS
// ============================================================

// Les six façons d'échouer se rejoignaient toutes sur un seul message, « Email invalide ou
// erreur — réessaie. » : une faute de frappe et un Ghost à terre étaient indiscernables, et
// on disait « invalide » à quelqu'un dont l'adresse était bonne. Le serveur produit déjà des
// messages distincts (api/subscribe.js) que le client jetait sans les lire.
const SIGNUP_ERRORS = {
  invalid: {
    text: "Cette adresse a l'air incomplète. Vérifie qu'elle ressemble à prenom@domaine.com.",
    recoverable: true,
  },
  rejected: {
    text: "Le serveur n'a pas accepté cette adresse. Vérifie-la, ou essaie une autre.",
    recoverable: true,
  },
  server: {
    // Panne de notre côté : ne pas dire à l'utilisateur que son adresse est fautive, et ne pas
    // le laisser croire qu'il a perdu son diagnostic.
    text: "Le service est momentanément indisponible — ce n'est pas ton adresse. Réessaie dans quelques minutes, tes résultats restent affichés.",
    recoverable: false,
  },
  offline: {
    text: "Connexion interrompue. Vérifie ton réseau et réessaie — tes résultats restent affichés.",
    recoverable: false,
  },
};

function GhostSignupForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "error"
  const [errorKind, setErrorKind] = useState(null);
  const inputRef = useRef(null);

  const fail = useCallback((kind) => {
    setErrorKind(kind);
    setStatus("error");
    // Ramener le focus sur le champ : l'erreur était annoncée mais le curseur restait
    // sur le bouton, donc corriger demandait de retrouver le champ à l'aveugle.
    if (SIGNUP_ERRORS[kind].recoverable) inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) { fail("invalid"); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { onSuccess(email); return; }
      fail(res.status >= 500 ? "server" : "rejected");
    } catch { fail("offline"); }
  }, [email, onSuccess, fail]);

  // Sans ça le message restait affiché sous une adresse déjà corrigée, jusqu'au prochain envoi.
  const handleChange = useCallback((e) => {
    setEmail(e.target.value);
    if (status === "error") { setStatus("idle"); setErrorKind(null); }
  }, [status]);

  const error = status === "error" ? SIGNUP_ERRORS[errorKind] : null;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, margin: "0 auto" }}>
      <div className="signup-row" style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          type="email" value={email} onChange={handleChange}
          placeholder="ton@email.com" required
          aria-label="Ton adresse email"
          aria-invalid={status === "error" ? "true" : undefined}
          aria-describedby={error ? "signup-error" : undefined}
          autoComplete="email" inputMode="email"
          className="signup-input" data-a11y-shape
          // minWidth:0 — sans ça l'input refuse de rétrécir et pousse le bouton hors écran <420px
          style={{ flex: 1, minWidth: 0, padding: "12px 14px", minHeight: 48, borderRadius: 8, border: `1px solid ${T.white}a6`,
            background: `${T.white}15`, color: T.white, fontSize: 14 }}
        />
        <button type="submit" disabled={status === "submitting"} aria-busy={status === "submitting"} className="btn-hover"
          style={{ padding: "12px 20px", minHeight: 48, borderRadius: 8, background: T.jaune, color: T.vert,
            fontWeight: 700, fontSize: 14, border: "none", cursor: status === "submitting" ? "wait" : "pointer" }}>
          {status === "submitting" ? "Envoi…" : "Déverrouiller"}
        </button>
      </div>
      {/* L'abonnement newsletter n'était annoncé qu'après soumission, dans le modal.
          .8 et pas .7 : sur T.vert, .7 tombe à 4.17:1 et .8 à 4.94:1 (AA = 4.5:1). */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,.8)", margin: 0, fontFamily: T.f }}>
        Un email par semaine. Désabonnement en un clic.
      </p>
      {error && (
        <p id="signup-error" role="alert" style={{ fontSize: 12, color: T.jaune, margin: 0, lineHeight: 1.5, textAlign: "left" }}>{error.text}</p>
      )}
    </form>
  );
}

function UnlockModal({ email, onClose, pdfProps, onRestoreFocus }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true);
    setPdfError(false);
    try { await generatePDF(pdfProps); } catch { setPdfError(true); } finally { setIsGenerating(false); }
  }, [pdfProps]);

  // La restauration du focus était structurellement impossible : setUnlocked et setShowModal
  // partent dans le même commit, donc GhostSignupForm — et le bouton qui avait le focus — est
  // déjà démonté quand l'effet lit document.activeElement. On récupérait <body>, et le rendre
  // au démontage ne rendait rien. Le parent fournit donc une cible qui, elle, survit.
  useEffect(() => {
    headingRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key !== "Tab") return;
      // Recalculé à chaque frappe : le bouton PDF devient disabled pendant la génération,
      // le navigateur le blurre, activeElement retombe sur <body>, et sans repli le piège
      // ne reconnaissait plus ni le premier ni le dernier élément — Tab s'échappait du modal.
      const focusables = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
      ) ?? [])];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = dialogRef.current?.contains(document.activeElement);
      if (!inside) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    // La page derrière restait défilable sous l'overlay.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      onRestoreFocus?.();
    };
    // Dépendances vides volontairement : onClose était une lambda recréée à chaque rendu du
    // parent, donc l'effet se rejouait sans cesse et le nettoyage arrachait le focus de
    // l'utilisateur hors du modal ouvert. La ref garde le handler à jour sans rejouer l'effet.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="no-print"
      style={{ position: "fixed", inset: 0, background: "rgba(11,36,25,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 24 }}>
      <div ref={dialogRef} style={{ background: T.white, borderRadius: T.rLg, maxWidth: 440,
        width: "100%", padding: "40px 32px", textAlign: "center", position: "relative" }}>
        <button onClick={onClose} aria-label="Fermer" className="btn-hover"
          style={{ position: "absolute", top: 6, right: 6, width: 48, height: 48, display: "flex",
            alignItems: "center", justifyContent: "center", background: "transparent", border: "none",
            borderRadius: T.rSm, cursor: "pointer", color: T.textMuted, fontFamily: T.f }}>
          <IconClose size={18} color={T.textMuted} />
        </button>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.vertLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <IconCheck size={26} color={T.vert} />
        </div>
        <h2 id="modal-title" ref={headingRef} tabIndex={-1} style={{ fontSize: 20, fontWeight: 800, color: T.vert, marginBottom: 12, outline: "none" }}>
          Diagnostics déverrouillés
        </h2>
        <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, marginBottom: 28 }}>
          Un email a été envoyé à <strong style={{ color: T.text }}>{email}</strong>.
          Vérifie aussi tes spams — sans confirmation, tu ne recevras pas les conseils de la semaine.
        </p>
        <button onClick={handleDownloadPDF} disabled={isGenerating} className="btn-hover" style={{ display: "block", width: "100%",
          padding: "14px 24px", minHeight: 48, background: isGenerating ? T.textLight : T.vert, color: T.white, fontWeight: 700,
          fontSize: 15, fontFamily: T.f, border: "none", borderRadius: T.r,
          cursor: isGenerating ? "wait" : "pointer", marginBottom: 12 }}>
          {isGenerating ? "Génération..." : "Télécharger mon rapport (PDF)"}
        </button>
        {pdfError && (
          <p role="alert" style={{ fontSize: 12, color: T.textMid, margin: "0 0 12px", lineHeight: 1.5 }}>
            La génération a échoué. Réessaie — et si ça persiste, le rapport reste disponible depuis tes résultats.
          </p>
        )}
        <button onClick={onClose} className="btn-hover" style={{ display: "block", width: "100%",
          padding: "12px 24px", minHeight: 48, background: "transparent", color: T.textMuted,
          fontWeight: 600, fontSize: 14, fontFamily: T.f,
          border: `1px solid ${T.border}`, borderRadius: T.r, cursor: "pointer" }}>
          Voir mes résultats
        </button>
        {pdfProps.collabUrl && (
          <p style={{ fontSize: 12, color: T.textLight, marginTop: 16, fontFamily: T.f }}>
            Besoin d'en parler à quelqu'un ?{" "}
            <a href={pdfProps.collabUrl} target="_blank" rel="noopener noreferrer"
               style={{ color: T.textMuted, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Collaboration Solved
            </a>
          </p>
        )}
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
            { num: "5",     text: "dimensions analysées : visibilité, preuves, business, autonomie, stratégique" },
          ].map(({ num, text }, i, arr) => (
            <div key={num} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 20 : 0 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: T.jaune, letterSpacing: "-0.03em", lineHeight: 1, flexShrink: 0, width: 92, textAlign: "right", whiteSpace: "nowrap" }}>{num}</span>
              <span style={{ fontSize: 13, color: `${T.white}bb`, lineHeight: 1.55, paddingTop: 6 }}>{text}</span>
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

function ResultScreen({ answers, onRestart, sessionId }) {
  const [unlocked, setUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [focusedLockedDim, setFocusedLockedDim] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const unlockedNoticeRef = useRef(null);

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

  // Track quiz completion (once — guard prevents duplicate on result page refresh)
  useEffect(() => {
    try {
      if (localStorage.getItem(COMPLETED_TRACKED_KEY) === "1") return;
      localStorage.setItem(COMPLETED_TRACKED_KEY, "1");
    } catch (_) {}
    trackEvent("quiz_completed", {
      sessionId,
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

  // Dimension mise en avant dans le formulaire : celle dont on vient de cliquer la carte,
  // sinon la 1re verrouillée (cas où l'utilisateur scrolle jusqu'au formulaire sans cliquer)
  const displayLockedDim = focusedLockedDim ?? orderedDimResults[1];
  const firstLockedLevel = getDiagnosticLevel(displayLockedDim.score);
  const firstLockedLevelLabel = firstLockedLevel === "low" ? "Vulnérable" : firstLockedLevel === "mid" ? "À renforcer" : "Solide";

  const handleScrollToUnlock = useCallback((dim = null) => {
    setFocusedLockedDim(dim);
    const target = document.getElementById("unlock-form");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    // Amener le focus dans le champ : sans ça l'utilisateur clavier ne bouge pas avec le cadrage.
    target?.querySelector('input[type="email"]')?.focus({ preventScroll: true });
  }, []);


  const handleShare = useCallback(() => {
    const text = `Je viens de faire un diagnostic sur la solidité de mon rôle de Scrum Master. 20 questions, 5 minutes, et des pistes d'action que j'aurais aimé avoir avant → https://dub.sh/sm-survival-score`;
    if (navigator.share) navigator.share({ text, url: "https://dub.sh/sm-survival-score" });
    else navigator.clipboard?.writeText(text);
  }, []);

  const handleDownloadScoreCard = useCallback(async () => {
    setIsGeneratingCard(true);
    setCardError(false);
    try {
      await generateScoreCard({ globalScore, category, dimensionResults, sessionId });
    } catch {
      setCardError(true);
    } finally {
      setIsGeneratingCard(false);
    }
  }, [globalScore, category, dimensionResults, sessionId]);

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    setPdfError(false);
    try { await generatePDF(pdfProps); } catch { setPdfError(true); } finally { setIsGeneratingPdf(false); }
  }, [pdfProps]);

  // Une fois débloqué, la variante « cta » invite à s'abonner via une ancre #unlock-form
  // dont la cible n'existe plus — et son texte est périmé. Seuls les vrais liens article restent.
  const rawCardArticle = getCardArticle(category.key, priorityDimResult.id);
  const cardArticle = unlocked && rawCardArticle?.cta ? null : rawCardArticle;

  return (
    <div style={{ fontFamily: T.f, background: T.creme, minHeight: "100vh" }}>
      {/* Hero score */}
      <header style={{ background: T.vert, padding: "48px 24px 56px", textAlign: "center", animation: "fadeIn 0.4s ease-out" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontSize: 12, color: T.onVertMuted, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Ton score</p>
          <h1 aria-label={`Score : ${globalScore} sur 100`} style={{ fontSize: "clamp(64px, 18vw, 96px)", fontWeight: 900, color: category.onDark, lineHeight: 1, letterSpacing: "-0.04em", animation: "scaleIn 0.4s ease-out 0.15s both", willChange: "transform, opacity" }}>{globalScore}</h1>
          <p style={{ fontSize: 16, color: T.onVertMuted, marginBottom: 20 }}>/100</p>
          <div data-a11y-shape style={{ display: "inline-block", padding: "10px 28px", fontSize: 15, fontWeight: 700, color: T.vertDark, background: category.onDark, borderRadius: 24 }}>{category.label}</div>
          <button
            onClick={handleDownloadScoreCard}
            disabled={isGeneratingCard}
            aria-label="Télécharger ma carte de score à partager"
            aria-busy={isGeneratingCard}
            className="btn-hover"
            style={{ display: "block", width: "100%", marginTop: 28, fontFamily: T.f, fontSize: 15, fontWeight: 700, background: T.jaune, color: T.vertDark, border: "none", borderRadius: T.rSm, padding: "14px 32px", minHeight: 48, opacity: isGeneratingCard ? 0.7 : 1, cursor: isGeneratingCard ? "wait" : "pointer" }}
          >
            {isGeneratingCard ? "Génération..." : "Télécharger ma carte de score"}
          </button>
          {cardError && (
            <p role="alert" style={{ marginTop: 10, fontSize: 13, color: T.jaune, fontFamily: T.f }}>Impossible de générer la carte — réessaie.</p>
          )}
        </div>
      </header>

      {/* Bento content */}
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px 60px" }}>
        {/* Global text card */}
        <BentoCard style={{ marginBottom: 16, animation: "fadeUp 0.4s ease-out 0.2s both" }}>
          {globalResult.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: i === 0 ? 16 : 14, fontWeight: i === 0 ? 700 : 400, lineHeight: 1.75, color: i === 0 ? T.text : T.textMid, fontFamily: T.f, marginBottom: i < globalResult.paragraphs.length - 1 ? 12 : 0 }}>{p}</p>
          ))}
        </BentoCard>

        {/* Une seule lecture des 5 dimensions.
            Le radar rendait exactement les mêmes chiffres que les barres, côte à côte, dans le
            plus gros bloc de la page — et moins bien : monochrome, donc sans sévérité, et illisible
            à 360px. Il reste dans le PDF et la carte de score, où il fait office d'objet et non de
            doublon. Les barres suivent désormais l'ordre de priorité pondéré du dossier de
            diagnostics et marquent la dimension prioritaire, comme le PDF le fait déjà : trois
            artefacts, un seul classement. */}
        <BentoCard style={{ marginBottom: 16, animation: "fadeUp 0.4s ease-out 0.3s both" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.vert, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Par dimension</h2>
          {orderedDimResults.map((dim, i) => {
            const dimCategory = getCategory(dim.pct);
            const isPriority = dim.id === priorityDimId;
            return (
              <div key={dim.id} style={{ marginBottom: i < orderedDimResults.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: isPriority ? 700 : 500 }}>
                    {dim.shortName}
                    {isPriority && <span style={{ fontSize: 11, fontWeight: 700, color: T.vert, marginLeft: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>priorité</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: dimCategory.color, fontFamily: "monospace", whiteSpace: "nowrap" }}>{dim.score}/{MAX_DIM_SCORE}</span>
                </div>
                <div data-a11y-shape role="meter" aria-valuenow={dim.score} aria-valuemin={0} aria-valuemax={MAX_DIM_SCORE} aria-label={isPriority ? `${dim.name} — dimension prioritaire` : dim.name} style={{ height: 6, background: T.cremeDeep, border: `1px solid ${T.trackBorder}`, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: 6, width: "100%", transformOrigin: "left", transform: `scaleX(${Math.max(dim.pct, 3) / 100})`, background: dimCategory.color, borderRadius: 3, transition: "transform 0.6s ease-out" }} />
                </div>
              </div>
            );
          })}
        </BentoCard>

        {/* PRODUCT.md vend « un scoring rigoureux et transparent (5 dimensions × 4 questions,
            seuils précis) ». L'écran affichait le verdict sans rien de tout ça : ni la base de
            40 points derrière le /100, ni les seuils, ni le fait qu'une pondération décide de
            la dimension prioritaire. Un produit qui reproche aux SM d'affirmer leur valeur au
            lieu de la prouver ne peut pas se contenter d'affirmer un score. Replié par défaut :
            c'est une justification, pas une étape du parcours. */}
        <details style={{ marginBottom: 16 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: T.vert, fontFamily: T.f, padding: "12px 4px", minHeight: 48, display: "flex", alignItems: "center" }}>
            Comment ce score est calculé
          </summary>
          <div style={{ padding: "4px 4px 12px", fontSize: 13, lineHeight: 1.7, color: T.textMid, fontFamily: T.f }}>
            <p style={{ margin: "0 0 8px" }}>
              20 questions, {QUESTIONS_PER_DIM} par dimension. Chaque réponse vaut 0, 1 ou 2 points, donc {MAX_DIM_SCORE} points
              au maximum par dimension et {MAX_SCORE} au total, ramenés sur 100.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              Sous {SCORE_THRESHOLDS.low} le profil est dit vulnérable, jusqu'à {SCORE_THRESHOLDS.mid} stable, au-delà irremplaçable.
              Par dimension les paliers sont différents : 0–3 vulnérable, 4–5 à renforcer, 6–8 solide.
            </p>
            <p style={{ margin: 0 }}>
              La dimension prioritaire n'est pas ton score le plus bas. Chaque dimension porte un poids
              de survie — visibilité {DIMENSION_WEIGHTS.visibility}, stratégique {DIMENSION_WEIGHTS.strategic}, preuves {DIMENSION_WEIGHTS.proof},
              business {DIMENSION_WEIGHTS.business}, autonomie {DIMENSION_WEIGHTS.autonomy} — et la priorité revient à celle où
              l'écart pèse le plus lourd. Être invisible coûte plus cher qu'une équipe peu autonome.
            </p>
          </div>
        </details>

        {/* Signal de priorité — au-dessus des diagnostics */}
        <PrioritySignal priorityDimId={priorityDimId} level={getDiagnosticLevel(priorityDimResult.score)} />

        {/* Bannière article — catégorie globale */}
        {(() => {
          const banner = ARTICLE_LINKS.banners[category.key];
          if (!banner) return null;
          return (
            <p style={{ fontSize: 14, color: T.textMid, margin: "8px 0 16px", paddingLeft: 4 }}>
              {banner.accroche}{" "}
              <a href={banner.url} target="_blank" rel="noopener noreferrer"
                 style={{ color: T.vert, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {banner.linkText}
              </a>
            </p>
          );
        })()}

        {/* Diagnostics */}
        <section aria-label="Diagnostics détaillés" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          {/* role="status" : la bascule verrouillé → déverrouillé remplaçait quatre blocs sous la
              position de défilement de l'utilisateur, pendant qu'il regardait le modal. Rien sur
              la page elle-même n'en rendait compte. */}
          {unlocked && (
            <p
              ref={unlockedNoticeRef}
              tabIndex={-1}
              role="status"
              style={{ margin: 0, padding: "12px 16px", background: T.vertLight, color: T.vertDark, borderRadius: T.rSm, fontSize: 13, fontWeight: 600, fontFamily: T.f, outline: "none" }}
            >
              Tes 5 diagnostics sont ouverts. Ton rapport PDF reste accessible en bas de page.
            </p>
          )}
          <h2 style={{ fontSize: 13, fontWeight: 700, color: T.vert, textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 4 }}>Diagnostic par dimension</h2>
          <DiagnosticCard dimension={priorityDimResult} index={0} rank={1} cardArticle={cardArticle} />
          {unlocked ? (
            orderedDimResults.filter(d => d.id !== priorityDimId).map((dim, i) => <DiagnosticCard key={dim.id} dimension={dim} index={i + 1} rank={i + 2} />)
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {orderedDimResults.filter(d => d.id !== priorityDimId).map((dim, i) => <LockedDiagnosticCard key={dim.id} dimension={dim} rank={i + 2} onUnlockClick={() => handleScrollToUnlock(dim)} />)}
              </div>
              <BentoCard id="unlock-form" style={{ background: T.vert, border: "none", textAlign: "center", padding: "36px 28px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.onVertMuted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, fontFamily: T.f }}>4 diagnostics verrouillés</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: T.white, marginBottom: 8, letterSpacing: "-0.01em", fontFamily: T.f }}>
                  Ton niveau en {displayLockedDim.shortName} :{" "}
                  <span style={{ color: T.jaune }}>{firstLockedLevelLabel}</span>
                </p>
                <p style={{ fontSize: 13, color: T.onVertMuted, marginBottom: 24, lineHeight: 1.6, fontFamily: T.f }}>Entre ton email pour débloquer l'analyse et l'action concrète sur tes 4 dimensions restantes.</p>
                <GhostSignupForm onSuccess={(email) => { setUnlocked(true); setShowModal(true); setSubscribedEmail(email); trackEvent("diagnostics_unlocked", { sessionId }); }} />
              </BentoCard>
            </>
          )}
        </section>

        {/* Actions */}
        <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {/* Sans ça, fermer le modal supprime définitivement l'accès au rapport déjà payé par l'email */}
          {unlocked && (
            <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} aria-busy={isGeneratingPdf}
              aria-label="Télécharger le rapport PDF" className="btn-hover"
              style={{ ...T.btnAction, opacity: isGeneratingPdf ? 0.7 : 1, cursor: isGeneratingPdf ? "wait" : "pointer" }}>
              {isGeneratingPdf ? "Génération..." : "Mon rapport (PDF)"}
            </button>
          )}
          {pdfError && (
            <p role="alert" style={{ width: "100%", textAlign: "center", fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
              La génération du PDF a échoué. Réessaie — tes résultats restent affichés.
            </p>
          )}
          <button onClick={handleShare} aria-label="Partager le test" className="btn-hover" style={T.btnAction}>
            Envoie le test à un collègue SM
          </button>
          <button
            onClick={() => {
              if (window.confirm("Refaire le test effacera ce diagnostic et tes 20 réponses. Continuer ?")) onRestart();
            }}
            aria-label="Refaire le test — efface le diagnostic actuel"
            className="btn-hover"
            style={T.btnGhost}
          >
            Refaire le test
          </button>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: "center", paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 12, color: T.textLight }}>Un outil <a href="https://dub.sh/cs-website" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: T.textMuted, textDecoration: "underline", textUnderlineOffset: 3 }}>Collaboration Solved</a> — par Pierre-Cyril Denant</p>
        </footer>
      </main>
      {showModal && (
        <UnlockModal
          email={subscribedEmail}
          onClose={() => setShowModal(false)}
          pdfProps={pdfProps}
          onRestoreFocus={() => unlockedNoticeRef.current?.focus()}
        />
      )}
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
  const [sessionId, setSessionId] = useState(() => loadQuizState()?.sessionId ?? null);
  // Ephemeral — not persisted. Stores which dim index just completed so we can show the reveal screen.
  const [chapterReveal, setChapterReveal] = useState(null);

  const abandonSentRef = useRef(false);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  useEffect(() => {
    if (screen === SCREEN.LANDING && answers.every(a => a === null)) {
      clearQuizState();
    } else {
      saveQuizState({ answers, currentQ, screen, sessionId });
    }
  }, [answers, currentQ, screen, sessionId]);

  // Detect page reload: fire quiz_resumed so GAS can pair it with the preceding quiz_abandoned
  useEffect(() => {
    const navType = performance.getEntriesByType?.("navigation")?.[0]?.type
      ?? (performance.navigation?.type === 1 ? "reload" : null);
    if (navType === "reload" && sessionId && screen === SCREEN.QUIZ) {
      trackEvent("quiz_resumed", { sessionId, questionIndex: currentQ });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    abandonSentRef.current = false;

    const handleAbandon = () => {
      if (abandonSentRef.current) return;
      const payload = buildAbandonPayload(screen, currentQ, answers);
      if (!payload) return;
      abandonSentRef.current = true;
      trackEvent('quiz_abandoned', { ...payload, sessionId });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleAbandon();
    };

    // Reset dedup flag after bfcache restoration so a real close is still tracked
    const onPageShow = (e) => {
      if (e.persisted) abandonSentRef.current = false;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', handleAbandon);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', handleAbandon);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [screen, currentQ, answers, sessionId]);

  const handleStart = useCallback(() => {
    const newSessionId = generateUUID();
    setSessionId(newSessionId);
    trackEvent("quiz_started", { sessionId: newSessionId });
    setScreen(SCREEN.QUIZ);
    setCurrentQ(0);
  }, []);
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
  const handleRestart = useCallback(() => {
    clearQuizState();
    setAnswers(Array(QUESTIONS.length).fill(null));
    setCurrentQ(0);
    setChapterReveal(null);
    setSessionId(null);
    setScreen(SCREEN.LANDING);
  }, []);

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
      {screen === SCREEN.RESULT && <ResultScreen answers={answers} onRestart={handleRestart} sessionId={sessionId} />}
    </StyleProvider>
  );
}
