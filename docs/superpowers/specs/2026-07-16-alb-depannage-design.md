# ALB Dépannage — Site vitrine WebGL

**Date :** 2026-07-16
**Statut :** Design validé, en attente de plan d'implémentation

---

## 1. Contexte

ALB Dépannage est une entreprise belge de dépannage automobile et de remorquage, basée en périphérie bruxelloise. Le site n'existe pas : projet greenfield.

### Données entreprise

| Champ | Valeur | Statut |
|---|---|---|
| Nom d'affichage | ALB Dépannage | Validé |
| Téléphone | `0467 78 64 56` (affichage) / `+32467786456` (lien `tel:`) | Validé |
| Email | contact@alb-depannage.com | Validé |
| Adresse | Schaarbeeklei, [n°], [code postal], [commune] | **TODO — incomplet** |
| TVA | `BE06922715996` | **TODO — invalide** |
| Disponibilité | 24h/24, 7j/7 | Validé |
| Logo | Aucun | **TODO — wordmark à créer** |

### Points bloquants à résoudre par le client

1. **Numéro de TVA invalide.** `BE06922715996` comporte 11 chiffres après `BE`. Le format belge en exige exactement 10, commençant par 0 ou 1. Un chiffre est en trop. Cette donnée apparaît dans les mentions légales et le `schema.org/LocalBusiness` — elle doit être exacte. À vérifier sur la Banque-Carrefour des Entreprises.
2. **Adresse incomplète.** « Schaarbeeklei » est une rue (Vilvoorde / Machelen). Il manque le numéro, le code postal et la commune. Requis pour les mentions légales et le référencement local.
3. **Agrément autoroute non qualifié.** Le dépannage autoroutier belge est concédé par zone. La zone couverte doit être précisée, sans quoi la mention est retirée du site.

En l'absence de ces réponses, ces champs restent marqués `TODO` dans le contenu et ne sont pas publiés. **Aucune valeur n'est inventée.**

### Positionnement de la zone d'intervention

Le client annonce « toute l'Europe ». Cette promesse est scindée en deux, car elle n'est vraie que pour une partie de l'activité :

- **Dépannage d'urgence** → Bruxelles et périphérie. Contrainte physique : un camion ne traverse pas l'Europe pour une batterie à plat.
- **Transport de véhicule** → toute l'Europe. Vrai, et c'est un différenciateur commercial réel.

Cette distinction structure le contenu et évite une promesse intenable.

### Services

Remorquage · Batterie · Crevaison · Panne de carburant · Ouverture de véhicule · Transport de véhicule · VL/PL · Véhicule accidenté

Mentions de confiance : agréé, assuré, autoroute (sous réserve du point 3).

### Tarifs

- Bruxelles : de **50 € à 250 €** selon l'intervention
- Hors Bruxelles : **+2 €/km**
- Devis sur demande

Les tarifs sont **affichés**, pas cachés. La base UX identifie « prix caché » et « absence de certifications » comme les deux anti-patterns majeurs du secteur.

---

## 2. Objectifs

**Objectif prioritaire : l'appel d'urgence.** La vitrine sert ensuite l'image de marque auprès des assureurs, garages et clients B2B du transport.

### Critères de succès

- Le numéro de téléphone est atteignable en moins d'une seconde, sur n'importe quel appareil, sans scroll.
- LCP < 1,5 s sur mobile 4G dégradée.
- Le site est intégralement fonctionnel sans WebGL.
- Trilingue FR / NL / EN avec SEO propre par langue.

### Hors périmètre (v1)

- CMS (contenu statique typé)
- Réservation / paiement en ligne
- Espace client, suivi d'intervention
- Blog

---

## 3. Le principe central : un canvas, trois paliers

### Un seul canvas persistant

Un unique `<Canvas>` React Three Fiber vit dans le **layout racine**, fixé en arrière-plan, et **ne se démonte jamais** entre les routes. Son contenu change selon la page via un store Zustand.

Ce choix donne l'omniprésence visuelle du WebGL sans en payer le coût à chaque section, et rend les transitions de page fluides puisque le contexte WebGL survit à la navigation.

### Trois paliers de capacité

| Palier | Cible | Rendu |
|---|---|---|
| **Full** | Desktop, GPU correct, bonne connexion | Scènes complètes, GLSL custom, post-processing, Lenis, ScrollTrigger |
| **Lite** | Mobile récent, connexion moyenne | WebGL actif mais dégradé : DPR plafonné à 1,5, shader simplifié, zéro post-processing, pas de Lenis |
| **Static** | Bas de gamme, `save-data`, `prefers-reduced-motion`, batterie faible, pas de WebGL2 | Posters + transitions CSS uniquement |

Le palier **Static n'est pas une dégradation** : c'est une version conçue pour être bonne en soi. Posters travaillés, typographie soignée, transitions CSS propres.

### Signaux de détection

Calculés une fois au montage, dans un provider client, stockés dans Zustand :

- Support WebGL2
- `navigator.deviceMemory`, `navigator.hardwareConcurrency`
- `navigator.connection.effectiveType` et `saveData`
- `prefers-reduced-motion`
- `navigator.getBattery()` — niveau et état de charge
- Type de pointeur (`hover: hover` / `pointer: fine`)

Chaque signal est optionnel et absent sur certains navigateurs. **Règle : signal absent = on ne suppose rien de favorable.** La détection dégrade vers le palier inférieur en cas de doute.

### Le SSR rend toujours le palier Static

Le rendu serveur produit systématiquement le markup statique. **Le poster du hero est le LCP.** Le WebGL s'invite par-dessus une fois la page utilisable, sans jamais bloquer le rendu initial ni provoquer de CLS (le canvas est en `position: fixed`, hors flux).

C'est ce qui permet d'avoir l'ambition visuelle sur desktop et des métriques mobiles saines, sans arbitrer entre les deux.

---

## 4. Moments WebGL

Conformément à la règle UX « animer 1 à 2 éléments clés par vue maximum », chaque vue a **un seul** point focal animé.

### Hero — « Route de nuit »

Asphalte mouillé, pluie, et balayage ambre d'un gyrophare, réactif à la position du curseur. Shader GLSL sur un plan plein écran.

**Décision : pas de camion 3D modélisé.** Sans modèle professionnel, un camion low-poly dessert la marque plus qu'il ne la sert. Un shader abstrait est plus sûr, moins cher, et évoque l'urgence nocturne sans risque de ratage.

- **Full** : raymarching complet, pluie, réflexions, bloom
- **Lite** : shader plan simplifié, pas de réflexion, pas de bloom
- **Static** : poster WebP/AVIF

### Couverture Europe — carte des trajets

Carte animée des trajets de transport longue distance. **Non décorative** : elle communique la portée européenne mieux qu'un paragraphe.

- **Full** : R3F, arcs animés, interaction au survol
- **Lite** : Canvas 2D, arcs statiques avec une animation légère
- **Static** : SVG des trajets principaux

### Fond ambiant

Le même canvas racine, en très basse intensité, sur les pages secondaires. Assure la cohérence sans surcharge.

### Transitions de page

Voile WebGL entre les routes. **Palier Full uniquement.** Lite et Static utilisent un fondu Framer Motion.

---

## 5. Architecture

### Stack

Versions vérifiées au 2026-07-16, non supposées.

- **Next.js 16.2.10 App Router**, React Server Components par défaut
- **React 19.2.7 — version exacte, pas `^19`**
- **TypeScript strict**
- **next-intl 4.13.2** — routes `/fr`, `/nl`, `/en`, négociation de langue via `proxy.ts`

**Deux décisions de version qui méritent d'être tracées :**

1. **Next 16, pas 15.** Le brief initial spécifiait Next 15, mais `next@15.5.20` porte le dist-tag `backport` — la branche est en maintenance, la version courante est 16.2.10. Démarrer un greenfield sur une branche en maintenance crée de la dette au premier commit. `next-intl@4.13.2` déclare `next: "^12 || ^13 || ^14 || ^15 || ^16"`, donc le choix n'est pas contraint par l'i18n.
2. **React pinné en version exacte.** `@react-three/fiber@9.6.1` déclare `react: ">=19 <19.3"`. React est en 19.2.7 : ça passe aujourd'hui, mais une 19.3 casserait R3F. Un `^19` signifierait qu'un `npm install` dans trois mois casse le site sans que personne n'ait touché au code. React et React-DOM sont donc pinnés exactement, et la contrainte est documentée dans le `package.json`.

### Contraintes Next.js 16 (vérifiées dans le guide de migration officiel)

Ces points sont des ruptures par rapport à la 15 et conditionnent le code :

| Contrainte | Conséquence |
|---|---|
| `middleware.ts` est déprécié, renommé **`proxy.ts`** ; l'export nommé devient `proxy` | La négociation de langue next-intl vit dans `src/proxy.ts` |
| Le runtime **edge n'est pas supporté** dans `proxy` — c'est `nodejs`, non configurable | La négociation de langue tourne en Node |
| Next 16 **n'override plus `scroll-behavior`** pendant la navigation | `data-scroll-behavior="smooth"` requis sur `<html>` — pertinent pour Lenis |
| `next lint` **supprimé** ; `next build` ne linte plus | ESLint câblé manuellement, en flat config |
| **Node 20.9+**, **TypeScript 5.1+** | Prérequis d'environnement |
| **Turbopack par défaut** | Pas de flag `--turbopack` |
| `params` / `searchParams` **async uniquement** | `params: Promise<{locale: string}>` partout |
| `images.qualities` par défaut `[75]` ; `imageSizes` sans `16` | À configurer si d'autres qualités sont nécessaires |

**Risque d'intégration à lever tôt (plan WebGL) :** Next 16 utilise en interne une release canary de React (fonctionnalités 19.2). R3F déclare `react: ">=19 <19.3"`. La résolution du peer se fait sur le paquet `react` installé (19.2.7), donc en théorie ça passe — mais c'est à vérifier par un test de rendu R3F réel dès la première tâche WebGL, pas à supposer.
- **Tailwind CSS** + variables CSS pour les tokens
- **Zustand** — palier de capacité, scène active, état UI
- **React Three Fiber / Three.js** + shaders GLSL custom
- **GSAP + ScrollTrigger** — animations de scroll, gatées par palier
- **Lenis** — palier Full uniquement
- **Framer Motion** — micro-interactions, transitions
- **Vercel** — déploiement

### Frontières des modules

Chaque unité a une responsabilité unique et une interface explicite :

| Module | Responsabilité | Dépend de |
|---|---|---|
| `lib/capability` | Détecte le palier. Ne connaît rien du rendu. | Navigateur |
| `stores/useCapability` | Expose le palier. Lecture seule pour les consommateurs. | `lib/capability` |
| `components/canvas` | Le canvas racine et les scènes. Lit le palier, ne le décide pas. | `stores/useCapability` |
| `components/motion` | Wrappers GSAP/Lenis gatés. Aucun composant n'appelle GSAP directement. | `stores/useCapability` |
| `content/` | Contenu typé par langue. Zéro logique. | — |
| `components/ui` | Composants de présentation. Aucune dépendance WebGL. | `content/` |

**Règle structurante :** aucun composant UI n'importe Three.js. La couche WebGL est entièrement optionnelle et supprimable sans casser le site — c'est ce qui garantit que le palier Static fonctionne réellement, plutôt que d'être supposé fonctionner.

### Contenu

`content/{fr,nl,en}.ts`, typés par une interface partagée. Le typage garantit qu'une clé manquante dans une langue est une erreur de compilation, pas un trou en production.

Les données entreprise (téléphone, TVA, adresse) vivent dans `content/company.ts`, **source unique**, avec les champs non résolus explicitement typés comme `TODO` et exclus du rendu tant qu'ils ne sont pas remplis.

### Pages

| Route | Contenu |
|---|---|
| `/[locale]` | Hero · Services · Preuves · Zone · Tarifs · CTA |
| `/[locale]/transport-europe` | Carte, trajets, devis transport |
| `/[locale]/tarifs` | Grille tarifaire détaillée |
| `/[locale]/contact` | Formulaire de devis + contact direct |
| `/[locale]/mentions-legales` | Mentions légales |
| `/[locale]/cgv` | Conditions générales |
| `/[locale]/confidentialite` | RGPD |

---

## 6. Conversion

### Barre d'appel persistante

- **Mobile** : barre fixée en bas, hauteur 56 px minimum, à portée de pouce, visible sur 100 % des vues. Lien `tel:+32467786456`.
- **Desktop** : CTA en header, plus CTA in-page aux points de décision.

Le lien est **toujours au format international** — les clients du transport européen appellent depuis l'étranger.

### Structure de page (pattern « Hero + Preuves + CTA »)

1. Hero — promesse, numéro, disponibilité 24/7
2. Problème — la situation du client
3. Services
4. Preuves sociales — agrément, assurance, avis
5. Zone de couverture
6. Tarifs transparents
7. CTA final

CTA sticky dès le hero, plus un CTA après les preuves sociales.

---

## 7. Direction visuelle

### Tokens

Ratios calculés, non estimés (formule WCAG 2.1 de luminance relative). Tous vérifiés par test automatisé — voir §10.

| Rôle | Valeur | Contraste | Verdict |
|---|---|---|---|
| Fond | `#0A0E14` (nuit) | — | — |
| Surface | `#141A23` | — | — |
| Texte | `#F8FAFC` | 18,48:1 sur fond · 16,70:1 sur surface | AA |
| Texte atténué | `#94A3B8` (fond sombre uniquement) | 7,54:1 sur fond · 6,82:1 sur surface | AA |
| CTA / accent | `#F97316` (ambre gyrophare) | 6,90:1 sur fond | AA |
| **Texte sur CTA** | `#0A0E14` | **6,90:1 sur ambre** | AA |
| Secondaire | `#3B82F6` | 5,26:1 sur fond | AA |
| Bordure | `#1E293B` | — | — |

Thème sombre par défaut. Contraste 4,5:1 minimum sur tous les couples texte/fond.

**Contrainte non négociable :** le texte du CTA est **sombre (`#0A0E14`), jamais blanc**. Du blanc `#F8FAFC` sur l'ambre `#F97316` ne donne que **2,68:1** et échoue au WCAG AA. C'est le bouton le plus important du site — il ne peut pas être le seul élément non conforme. Un test de non-régression verrouille ce point explicitement.

### Typographie

- **Display : Syncopate** — large, kinétique, registre automobile. Titres uniquement, jamais en texte courant.
- **Corps : Inter** — lisibilité maximale.

**Décision contre la recommandation du générateur**, qui proposait Space Mono en corps de texte. Du monospace pour du contenu courant en trois langues, lu par un utilisateur stressé sur mobile, est un mauvais choix de lisibilité. L'esprit « Kinetic » est conservé via le display.

---

## 8. Accessibilité

- `prefers-reduced-motion` force le palier **Static** — pas seulement une réduction, une désactivation complète du mouvement, Lenis inclus.
- Contraste 4,5:1 minimum.
- Navigation clavier complète, focus visibles.
- Le canvas est `aria-hidden` : il est décoratif et ne porte aucune information non disponible en texte.
- Cibles tactiles 44×44 px minimum.
- Labels sur tous les champs de formulaire.
- La couleur n'est jamais le seul porteur d'information.

---

## 9. Budgets de performance

| Métrique | Cible |
|---|---|
| LCP mobile (4G lente) | < 1,5 s |
| CLS | < 0,1 |
| JS initial (hors WebGL) | < 100 ko gzip |
| Bundle WebGL | Chargé après interactivité, jamais bloquant |

Three.js, GSAP et Lenis sont en imports dynamiques, exclus du bundle initial.

---

## 10. Stratégie de test

- **Détection de capacité** — tests unitaires sur la matrice de signaux, en particulier les signaux absents (doit dégrader).
- **Palier Static** — le site doit être navigable et convertir avec WebGL désactivé. Testé en forçant le palier.
- **Trilingue** — aucune clé manquante (garanti par le typage), routes et `hreflang` corrects.
- **Lighthouse mobile** — sur throttling 4G, palier Static et Lite.
- **Clavier + lecteur d'écran** — parcours d'appel complet.
- **Responsive** — 375, 768, 1024, 1440 px.

---

## 11. Décisions actées

| Décision | Raison |
|---|---|
| Un canvas racine persistant | Omniprésence WebGL sans coût multiplié, transitions fluides |
| SSR toujours en palier Static | Le LCP ne dépend jamais du WebGL |
| Pas de camion 3D | Un modèle low-poly dessert la marque ; le shader abstrait est plus sûr |
| Urgence locale / transport européen | La promesse « toute l'Europe » n'est vraie que pour le transport |
| Tarifs affichés | « Prix caché » est un anti-pattern majeur du secteur |
| Inter en corps, pas Space Mono | Lisibilité sur trois langues pour un utilisateur stressé |
| Aucune donnée inventée | TVA, adresse et agrément restent `TODO` jusqu'à confirmation |

## 12. Questions ouvertes

1. Numéro de TVA correct ?
2. Adresse complète ?
3. Zone d'agrément autoroute ?
4. Wordmark : à créer, ou le client fournit-il une identité ?
5. Avis clients réels disponibles (Google Business) pour la section preuves ?
