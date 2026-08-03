// Sonde d'accessibilité exécutée DANS la page (page.evaluate).
//
// Pourquoi elle existe : trois régressions successives sur cet écran ont toutes eu la même
// forme — une paire couleur/surface corrigée, la paire voisine jamais vérifiée. Les tests
// unitaires ne peuvent pas l'attraper : ils lisent la source, pas le rendu, donc ils ignorent
// l'héritage, la composition alpha, et la surface réelle sur laquelle un élément atterrit.
// axe ne le peut pas non plus pour le contraste non-textuel (pastilles, bordures de champ,
// anneaux de focus) : ce n'est pas dans sa couverture. D'où cette sonde.
//
// Renvoie des violations brutes ; c'est le spec qui décide de ce qui est fatal.

export const PROBE_SOURCE = `(() => {
  const AA_NORMAL = 4.5;
  const AA_LARGE = 3.0;
  const NON_TEXT = 3.0;
  const TOUCH_MIN = 48; // PRODUCT.md s'engage sur 48, pas 44

  const parseColor = (str) => {
    const m = String(str).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };

  // Aplatit une couleur semi-transparente sur la première surface opaque au-dessus d'elle.
  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const effectiveBg = (el) => {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement.parentNode) {
      const c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? composite(acc, c) : c;
        if (acc.a >= 1) return acc;
      }
      node = node.parentElement;
    }
    const white = { r: 255, g: 255, b: 255, a: 1 };
    return acc ? composite(acc, white) : white;
  };

  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const hex = ({ r, g, b }) =>
    "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  const label = (el) => {
    const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\\s+/g, " ");
    return t.slice(0, 60) || "<" + el.tagName.toLowerCase() + ">";
  };

  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const violations = [];
  const add = (type, el, detail) =>
    violations.push({ type, element: label(el), tag: el.tagName.toLowerCase(), ...detail });

  const root = document.querySelector("[data-a11y-scope]") || document.body;

  // ---- 1. Contraste du texte -------------------------------------------------
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.textContent.trim() && n.parentElement && visible(n.parentElement)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (seen.has(el)) continue;
    seen.add(el);
    const s = getComputedStyle(el);
    const fgRaw = parseColor(s.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    const fg = fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw;
    const size = parseFloat(s.fontSize);
    const weight = Number(s.fontWeight) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = isLarge ? AA_LARGE : AA_NORMAL;
    const got = ratio(fg, bg);
    if (got < need) {
      add("text-contrast", el, {
        ratio: +got.toFixed(2), required: need, fg: hex(fg), bg: hex(bg),
        fontSize: size, fontWeight: weight,
      });
    }
  }

  // ---- 2. Contraste non-textuel (WCAG 1.4.11) --------------------------------
  // Uniquement les formes qui portent du sens. Les bordures purement décoratives
  // (délimitation de carte déjà assurée par le fond) sont hors périmètre — décision produit.
  for (const el of root.querySelectorAll("[data-a11y-shape]")) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const bg = effectiveBg(el.parentElement || document.body);
    const own = parseColor(s.backgroundColor);
    if (own && own.a > 0) {
      const fill = own.a < 1 ? composite(own, bg) : own;
      const got = ratio(fill, bg);
      if (got < NON_TEXT) {
        add("shape-contrast", el, { ratio: +got.toFixed(2), required: NON_TEXT, fill: hex(fill), against: hex(bg) });
      }
    }
    const bw = parseFloat(s.borderTopWidth) || 0;
    const bc = parseColor(s.borderTopColor);
    if (bw > 0 && bc && bc.a > 0) {
      const border = bc.a < 1 ? composite(bc, bg) : bc;
      const got = ratio(border, bg);
      if (got < NON_TEXT) {
        add("border-contrast", el, { ratio: +got.toFixed(2), required: NON_TEXT, border: hex(border), against: hex(bg) });
      }
    }
  }

  // Traits SVG porteurs de sens (icônes)
  for (const svg of root.querySelectorAll("svg[data-a11y-icon]")) {
    if (!visible(svg)) continue;
    const strokeRaw = parseColor(getComputedStyle(svg).stroke) ||
      parseColor(getComputedStyle(svg.querySelector("*") || svg).stroke);
    if (!strokeRaw) continue;
    const bg = effectiveBg(svg.parentElement || document.body);
    const stroke = strokeRaw.a < 1 ? composite(strokeRaw, bg) : strokeRaw;
    const got = ratio(stroke, bg);
    if (got < NON_TEXT) {
      add("icon-contrast", svg, { ratio: +got.toFixed(2), required: NON_TEXT, stroke: hex(stroke), against: hex(bg) });
    }
  }

  // ---- 3. Cibles tactiles ----------------------------------------------------
  const INTERACTIVE = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  for (const el of root.querySelectorAll(INTERACTIVE)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < TOUCH_MIN || r.height < TOUCH_MIN) {
      add("touch-target", el, {
        width: +r.width.toFixed(1), height: +r.height.toFixed(1), required: TOUCH_MIN,
      });
    }
  }

  // ---- 4. Champs sans nom accessible -----------------------------------------
  for (const el of root.querySelectorAll("input, select, textarea")) {
    if (!visible(el)) continue;
    const named =
      el.getAttribute("aria-label") ||
      el.getAttribute("aria-labelledby") ||
      (el.id && document.querySelector('label[for="' + el.id + '"]')) ||
      el.closest("label");
    if (!named) add("unlabeled-input", el, { type: el.getAttribute("type") || el.tagName.toLowerCase() });
  }

  return violations;
})()`;

// Vérifie l'anneau de focus de chaque élément focusable, contre SA PROPRE surface.
// C'est la sonde qui aurait attrapé les deux régressions d'anneau : un contour blanc
// invisible sur carte blanche, et une règle :focus-visible morte car écrasée par un
// outline inline.
export const FOCUS_PROBE_SOURCE = `((el) => {
  const parseColor = (str) => {
    const m = String(str).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  });
  const effectiveBg = (n) => {
    let cur = n, acc = null;
    while (cur) {
      const c = parseColor(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0) { acc = acc ? composite(acc, c) : c; if (acc.a >= 1) return acc; }
      cur = cur.parentElement;
    }
    const w = { r: 255, g: 255, b: 255, a: 1 };
    return acc ? composite(acc, w) : w;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const hex = ({ r, g, b }) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  const s = getComputedStyle(el);
  const surface = effectiveBg(el.parentElement || document.body);
  const candidates = [];

  const ow = parseFloat(s.outlineWidth) || 0;
  const oc = parseColor(s.outlineColor);
  if (ow > 0 && s.outlineStyle !== "none" && oc && oc.a > 0) {
    candidates.push({ kind: "outline", ratio: ratio(oc.a < 1 ? composite(oc, surface) : oc, surface), color: hex(oc) });
  }
  // Un box-shadow de focus peut porter l'indicateur à lui seul
  if (s.boxShadow && s.boxShadow !== "none") {
    const sc = parseColor(s.boxShadow);
    if (sc && sc.a > 0) {
      candidates.push({ kind: "box-shadow", ratio: ratio(sc.a < 1 ? composite(sc, surface) : sc, surface), color: hex(sc) });
    }
  }

  const best = candidates.sort((a, b) => b.ratio - a.ratio)[0] || null;
  return {
    label: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 60),
    tag: el.tagName.toLowerCase(),
    surface: hex(surface),
    indicator: best ? best.kind : null,
    ratio: best ? +best.ratio.toFixed(2) : 0,
    color: best ? best.color : null,
  };
})`;
