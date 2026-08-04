# Retour d'expérience — quatre passes de critique sur l'écran résultat

Août 2026. Quatre passes `/impeccable critique` et neuf PR (#45–#53) sur `ResultScreen`.
Score : **21 → 18 → 21 → 25** sur 40.

Ce document existe parce que la partie la plus utile de ce travail n'est pas ce qui a été corrigé,
mais ce qui a été cassé en le corrigeant — et le fait que les régressions avaient toutes la même
forme. Les constats détaillés sont dans `.impeccable/critique/`.

---

## Le motif d'échec, une seule phrase

> **J'ai vérifié la paire que je corrigeais, jamais la paire voisine.**

Quatre occurrences, toutes livrées en production :

| Correctif | Vérifié | Manqué |
|---|---|---|
| Contraste (#47) | texte blanc de la pastille — 5.02:1 ✅ | **fond** de la pastille sur le héros vert — 1.18:1 ❌ |
| Anneau de focus (#47) | règle `:focus-visible` ajoutée | `outline: "none"` inline qui l'écrase — la règle n'a jamais rien fait |
| Restauration du focus (#48) | le code de restauration écrit | la cible est démontée dans le même commit — on restaurait vers `<body>` |
| Gate (#50–53) | un gate construit et vert 12/12 | il lit les nœuds de texte et énumère `button, a[href], input` → il ne voit ni `::placeholder` (1.23:1) ni les cibles `[tabindex="-1"]`, **précisément les surfaces que la passe venait d'introduire** |

La dernière est la plus instructive : j'ai construit l'instrument censé empêcher ce motif, puis
introduit des défauts exactement là où l'instrument ne regarde pas. **Un gate ne couvre que ce
qu'il échantillonne, et le prochain changement ira là où il ne regarde pas** — c'est à ce
moment-là qu'il faut se poser la question, pas après.

---

## Sur la conduite d'une critique

**Un score qui revient à son point de départ après N correctifs signale que les correctifs sont au
mauvais niveau.** Neuf PR au niveau composant : 21 → 21. Le gate plus le travail de composition :
21 → 25. Quand la tendance est plate, changer d'échelle, pas d'effort.

**Mesurer, ne pas raisonner depuis la source.** J'ai affirmé dans un plan approuvé qu'aucun bouton
n'avait d'anneau de focus fiable, déduit de la lecture du CSS. Mesure : 6.15–6.75:1 à chacun des
14 arrêts — les deux moitiés de l'anneau sont complémentaires par construction. Le raisonnement
était cohérent et faux.

**L'isolation des deux évaluations paye.** L'agent « mesures » a corrigé à plusieurs reprises
l'agent « design » et moi-même. Un contraste calculé n'a pas d'opinion.

**Attention aux artefacts de mesure.** Un `#bb621e` rapporté par axe n'existe nulle part dans la
source : c'était `#b45309` échantillonné en cours d'animation `fadeUp`. Attendre
`document.getAnimations()` avant de sonder.

---

## Sur les correctifs

**Le rayon d'action d'un correctif, c'est le token, pas le site d'appel.** `category.color` portait
quatre contrats de contraste différents (texte de pastille sur teinte, fond de pastille sur vert,
remplissage de barre, valeur chiffrée sur blanc). Le modifier pour l'un l'a cassé pour l'autre.
Avant de toucher un token : lister *tous* ses usages et la surface de chacun.

**« Déplacer X vers Y » n'est fini que quand l'ancien porteur a disparu.** Objectif annoncé :
déplacer la sévérité de la pastille vers la composition. Résultat : pastille **plus** rang **plus**
couleur **plus** disque **plus** bandeau — cinq encodages. J'ai ajouté sans soustraire, et produit
au passage la contradiction `PRIORITÉ 1 — COMMENCE ICI` au-dessus de `Solide — 8/8`.

**Ne pas réparer la collision qu'on vient de créer et déclarer le problème résolu.** Le CTA du
héros était signalé P1 (« l'élément le plus visible propose de partager un score de 0 »). En le
rendant conforme j'ai créé une collision visuelle, que j'ai corrigée en le passant pleine
largeur — donc **plus** visible. Le problème d'origine n'a jamais été traité.

**Supprimer du travail dupliqué paye deux fois.** Retirer le radar (doublon des barres) a fait
tomber le bundle de 562 à 213 kB et supprimé un bug d'accessibilité au passage (l'`aria-label`
annonçait le plancher d'affichage, « 0.64/8 »).

**Construire le gate avant les correctifs.** C'est lui qui a permis à deux PR suivantes de
réécrire le balisage sans revérifier à la main contraste, cibles et focus.

---

## Sur les tests

**Un test qui affirme un mécanisme survit au mécanisme.** Deux exemples trouvés ici :

- une assertion vérifiait la présence de `previouslyFocused` — c'est-à-dire d'un code dont on a
  ensuite prouvé qu'il ne pouvait pas fonctionner ;
- une assertion « `⚡ Signal prioritaire` présent » passait grâce à `PDFDocument` alors qu'elle
  prétendait vérifier `PrioritySignal`, d'où la chaîne avait été retirée.

Assertion sur le résultat plutôt que sur la chaîne d'implémentation, et quand on teste un
composant, découper la source à son périmètre.

**Un miroir de données dérive en silence.** Le `getCategory` recopié dans les tests renvoyait
encore `#ef4444`/`#f59e0b` longtemps après que la source soit passée à `#c81e1e`/`#b45309`.
Extraire de la source, ou ne pas dupliquer.

---

## Sur le copy de marque

**La dérive de voix se mesure.** Comptage des tirets cadratins, des deux-points en incise, longueur
de phrase, densité de deuxième personne, mots absents du reste du fichier. Une première version de
`SIGNAL_TEXTS_HIGH` affichait 2 tirets et 2 deux-points là où les textes d'origine en ont 0, plus
deux mots (`péremption`, `redémontre`) introuvables ailleurs dans 1 800 lignes. La réécriture est
revenue à 0/0. C'est plus fiable et plus rapide que « est-ce que ça sonne juste ? ».

**Demander avant de rédiger du copy de marque**, et quand il tombe à côté, mesurer plutôt que
re-deviner.

---

## Reste ouvert

Consigné dans `.impeccable/critique/`, non corrigé :

- `::placeholder` du champ email à 1.23:1, seul nom visible du champ (pas de `<label>`)
- Le CTA du héros reste l'élément le plus visible de la page, quel que soit le score
- Sévérité encodée cinq fois par carte
- `<summary>` du bloc méthodologie : `display: flex` supprime le marqueur d'ouverture
- `aria-controls` pointe vers un élément absent tant que le panneau est replié
- Texte fonctionnel à 9/10/11px
- `recharts` déclaré dans `package.json` sans importeur
