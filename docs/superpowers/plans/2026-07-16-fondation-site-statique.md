# ALB Dépannage — Plan 1 : Fondation & site statique

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le site ALB Dépannage trilingue, complet et déployable, entièrement fonctionnel **sans une ligne de WebGL**.

**Architecture:** Next.js 16 App Router en RSC. Routes `/fr`, `/nl`, `/en` via next-intl (routage uniquement — le contenu est du TypeScript typé, pas des messages JSON, pour obtenir la sécurité à la compilation exigée par la spec). Tokens de design en Tailwind v4 CSS-first. Les données entreprise non confirmées sont typées `todo` et **ne peuvent pas être rendues** — la règle « aucune donnée inventée » est appliquée par le typage, pas par la discipline.

**Tech Stack:** Next.js 16.2.10 · React 19.2.7 (pinné exact) · TypeScript 5+ strict · Tailwind CSS 4.3.3 · next-intl 4.13.2 · Vitest 4.1.10 · Playwright

**Spec:** `docs/superpowers/specs/2026-07-16-alb-depannage-design.md`

**Hors périmètre :** toute la couche WebGL/GSAP/Lenis/Zustand — voir Plan 2. À la fin de ce plan, le site tourne au palier **Static** et c'est un livrable complet.

---

## Global Constraints

Ces règles s'appliquent à **toutes** les tâches. Chaque tâche les inclut implicitement.

- **Node 20.9+ / TypeScript 5.1+** — minimums Next 16.
- **`proxy.ts`, jamais `middleware.ts`** — renommé en Next 16, export nommé `proxy`. Runtime `nodejs`, non configurable.
- **`params` et `searchParams` sont des `Promise`** — accès sync supprimé en Next 16. Toujours `const {locale} = await params`.
- **React et React-DOM pinnés en version exacte `19.2.7`**, sans `^`. R3F (Plan 2) exige `>=19 <19.3`.
- **Turbopack par défaut** — aucun flag `--turbopack` dans les scripts.
- **`next lint` n'existe plus.** ESLint est appelé directement, en flat config. `next build` ne linte pas.
- **Texte du CTA : `#0A0E14`, jamais blanc.** Blanc sur `#F97316` = 2,68:1, échec WCAG AA. Verrouillé par test.
- **Aucun composant n'importe Three.js dans ce plan.** La couche WebGL doit rester supprimable.
- **Aucune donnée entreprise inventée.** TVA, adresse et zone autoroute sont `todo` et non rendues.
- **Téléphone : `+32467786456` en E.164** pour tout `href="tel:"`. Affichage national `0467 78 64 56`.
- **Contraste minimum 4,5:1** sur tout couple texte/fond.
- **Cibles tactiles 44×44 px minimum.**
- **Langues : `fr` (défaut), `nl`, `en`.** Une clé manquante dans une langue = erreur de compilation.
- **Aucune tâche ne commite sans `npm run typecheck && npm run lint && npm test` au vert.** Les tests seuls ne suffisent pas : Vitest transpile sans vérifier les types, donc une suite verte peut coexister avec un arbre qui ne compile pas. Si une étape d'une tâche ne mentionne que Vitest, cette règle s'applique quand même.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/lib/contrast.ts` | Calcul de luminance/ratio WCAG. Pur, aucune dépendance. |
| `src/lib/tokens.ts` | Tokens de couleur, source unique. Consommé par les tests et le CSS. |
| `src/lib/phone.ts` | Constantes téléphone (E.164, affichage). |
| `src/content/company.ts` | Données entreprise + le type `Field<T>` qui rend les `todo` non-rendables. |
| `src/content/types.ts` | Interface `SiteContent` partagée par les 3 langues. |
| `src/content/{fr,nl,en}.ts` | Contenu typé par langue. Zéro logique. |
| `src/content/index.ts` | `getContent(locale)`. |
| `src/i18n/routing.ts` | `defineRouting` — locales, défaut. |
| `src/i18n/navigation.ts` | `createNavigation` — Link/redirect localisés. |
| `src/i18n/request.ts` | `getRequestConfig`. |
| `src/proxy.ts` | Négociation de langue. **Pas `middleware.ts`.** |
| `src/app/[locale]/layout.tsx` | Shell : html/body, header, footer, barre d'appel. |
| `src/app/[locale]/page.tsx` | Accueil. |
| `src/components/ui/*` | Présentation pure. Aucune dépendance WebGL. |
| `src/app/globals.css` | `@theme` Tailwind v4 — tokens en CSS. |

---

### Task 1: Scaffold, tokens et verrou de contraste

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`
- Create: `src/lib/contrast.ts`, `src/lib/tokens.ts`, `src/app/globals.css`
- Test: `src/lib/contrast.test.ts`, `src/lib/tokens.test.ts`

**Interfaces:**
- Consumes: rien (première tâche)
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number`, `tokens: Readonly<Record<TokenName, string>>` où `TokenName = 'bg' | 'surface' | 'text' | 'muted' | 'cta' | 'ctaFg' | 'secondary' | 'border'`

- [ ] **Step 1: Scaffolder le projet**

```bash
cd C:/Users/mmdar/Desktop/code/work/alb-depannage
npx create-next-app@16.2.10 . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm --skip-install --yes
```

Si `create-next-app` refuse d'écrire dans un dossier non vide (à cause de `docs/`, `.git`, `ruvector.db`), scaffolder à côté puis rapatrier :

```bash
cd C:/Users/mmdar/Desktop/code/work
npx create-next-app@16.2.10 _scaffold --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm --skip-install --yes
cp -r _scaffold/src _scaffold/public _scaffold/*.json _scaffold/*.ts _scaffold/*.mjs alb-depannage/ 2>/dev/null
rm -rf _scaffold
```

- [ ] **Step 2: Pinner les versions et câbler les scripts**

Remplacer `package.json` par :

```json
{
  "name": "alb-depannage",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=20.9.0" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.2.10",
    "next-intl": "4.13.2",
    "react": "19.2.7",
    "react-dom": "19.2.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@next/eslint-plugin-next": "16.2.10",
    "@tailwindcss/postcss": "4.3.3",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.17.0",
    "jsdom": "^25.0.1",
    "tailwindcss": "4.3.3",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.1",
    "vitest": "4.1.10"
  }
}
```

> `react` et `react-dom` sont en **19.2.7 exact, sans `^`**. R3F (Plan 2) exige `>=19 <19.3` : un caret laisserait `npm install` casser le site en 19.3 sans qu'on ait touché au code.

```bash
npm install
```

- [ ] **Step 3: Écrire le test de contraste qui échoue**

Créer `src/lib/contrast.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('vaut 0 pour le noir', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('vaut 1 pour le blanc', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('accepte un hex sans dièse', () => {
    expect(relativeLuminance('FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('donne 21:1 entre noir et blanc', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('est symetrique', () => {
    expect(contrastRatio('#0A0E14', '#F97316')).toBeCloseTo(
      contrastRatio('#F97316', '#0A0E14'),
      10,
    );
  });

  it('donne 1:1 pour deux couleurs identiques', () => {
    expect(contrastRatio('#F97316', '#F97316')).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Créer `vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: FAIL — `Failed to resolve import "./contrast"`

- [ ] **Step 5: Implémenter le calcul de contraste**

Créer `src/lib/contrast.ts` :

```ts
/**
 * Luminance relative WCAG 2.1.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Hex invalide: ${hex}`);
  }
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG 2.1, toujours >= 1. Symetrique. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 7: Écrire le test des tokens qui échoue**

Créer `src/lib/tokens.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { tokens } from './tokens';

const AA_NORMAL = 4.5;

describe('Contraste WCAG des tokens', () => {
  it('texte sur fond passe AA', () => {
    expect(contrastRatio(tokens.text, tokens.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('texte sur surface passe AA', () => {
    expect(contrastRatio(tokens.text, tokens.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('texte attenue sur fond passe AA', () => {
    expect(contrastRatio(tokens.muted, tokens.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('texte attenue sur surface passe AA', () => {
    expect(contrastRatio(tokens.muted, tokens.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('CTA sur fond passe AA', () => {
    expect(contrastRatio(tokens.cta, tokens.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('secondaire sur fond passe AA', () => {
    expect(contrastRatio(tokens.secondary, tokens.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe('Le texte du CTA est sombre, jamais blanc', () => {
  it('ctaFg sur cta passe AA', () => {
    expect(contrastRatio(tokens.ctaFg, tokens.cta)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  /**
   * Non-regression. Ce test documente POURQUOI ctaFg est sombre.
   * Si quelqu'un passe le texte du CTA en blanc "parce que c'est plus joli",
   * ce test le rattrape. Blanc sur ambre = 2,68:1, echec AA.
   * Le CTA est le bouton le plus important du site : il ne peut pas etre
   * le seul element non conforme.
   */
  it('le blanc sur le CTA ambre ECHOUE — d ou le texte sombre', () => {
    expect(contrastRatio('#F8FAFC', tokens.cta)).toBeLessThan(AA_NORMAL);
  });

  it('ctaFg n est pas une couleur claire', () => {
    expect(contrastRatio(tokens.ctaFg, '#FFFFFF')).toBeGreaterThan(AA_NORMAL);
  });
});
```

- [ ] **Step 8: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/tokens.test.ts`
Expected: FAIL — `Failed to resolve import "./tokens"`

- [ ] **Step 9: Implémenter les tokens**

Créer `src/lib/tokens.ts` :

```ts
/**
 * Source unique des couleurs. Le CSS (globals.css) et les tests lisent
 * les memes valeurs. Ratios verifies par tokens.test.ts, pas estimes.
 */
export const tokens = {
  bg: '#0A0E14',
  surface: '#141A23',
  text: '#F8FAFC',
  muted: '#94A3B8',
  cta: '#F97316',
  ctaFg: '#0A0E14',
  secondary: '#3B82F6',
  border: '#1E293B',
} as const;

export type TokenName = keyof typeof tokens;
```

- [ ] **Step 10: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run`
Expected: PASS — 15 tests

- [ ] **Step 11: Câbler Tailwind v4 et les polices**

Créer `postcss.config.mjs` :

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

Remplacer `src/app/globals.css` :

```css
@import 'tailwindcss';

/*
 * Tailwind v4 CSS-first. Ces valeurs DOIVENT rester synchrones avec
 * src/lib/tokens.ts, qui est la source verifiee par les tests.
 */
@theme {
  --color-bg: #0a0e14;
  --color-surface: #141a23;
  --color-text: #f8fafc;
  --color-muted: #94a3b8;
  --color-cta: #f97316;
  --color-cta-fg: #0a0e14;
  --color-secondary: #3b82f6;
  --color-border: #1e293b;

  /*
   * Chainer via les variables de next/font, pas via le nom litteral.
   * next/font genere une famille de repli aux metriques ajustees
   * (« Syncopate Fallback ») que --font-syncopate inclut. Nommer la
   * police litteralement resout bien, mais saute ce repli et tombe
   * direct sur system-ui, dont les metriques ne correspondent pas —
   * d ou du decalage evitable pendant le swap, contre un budget CLS < 0,1.
   * Les variables sont definies par le layout [locale] (Task 3).
   */
  --font-display: var(--font-syncopate), system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}

html {
  color-scheme: dark;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  /* line-height 1.5-1.75 pour le corps de texte (regle UX) */
  line-height: 1.6;
}

/* Focus visible sur tout element interactif (regle a11y CRITICAL) */
:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 12: Configurer Next et ESLint**

Créer `next.config.ts` :

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Next 16 : defaut [75]. On ajoute 90 pour le poster du hero (LCP).
    qualities: [75, 90],
  },
};

export default nextConfig;
```

Créer `eslint.config.mjs` — flat config, `next lint` n'existe plus en Next 16 :

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    /**
     * La couche WebGL doit rester supprimable : c'est ce qui garantit que
     * le palier Static fonctionne reellement plutot que d'etre suppose.
     * Un composant qui importe Three.js casse cette garantie en silence —
     * la regle le rattrape a l'edition, pas au test.
     *
     * Restreint PARTOUT sous src/, sauf les deux repertoires qui possedent
     * legitimement ce code (crees au Plan 2). Scoper la regle aux seuls
     * composants UI laisserait passer un import depuis src/app/**, ce qui
     * suffirait a defaire la garantie.
     */
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/canvas/**', 'src/components/motion/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*', '@react-three/*', 'gsap', 'gsap/*', 'lenis'],
              message:
                'Les composants UI ne doivent dependre d aucun module WebGL/animation : le palier Static doit fonctionner sans eux. Placez ce code dans src/components/canvas/ ou src/components/motion/.',
            },
          ],
        },
      ],
    },
  },
);
```

Vérifier que `tsconfig.json` contient `"strict": true`. Sinon l'ajouter.

- [ ] **Step 13: Vérifier que tout passe**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: les quatre passent. Le build produit `.next/`.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 16 + tokens verrouilles par test de contraste

Le ratio de chaque couple texte/fond est calcule par test, pas estime.
Un test de non-regression verrouille explicitement le texte sombre du
CTA : blanc sur ambre = 2,68:1, echec WCAG AA.

React pinne en 19.2.7 exact (R3F exigera >=19 <19.3 au plan 2).
ESLint en flat config : next lint n'existe plus en Next 16."
```

---

### Task 2: Données entreprise — les `todo` sont non-rendables

**Files:**
- Create: `src/content/company.ts`, `src/lib/phone.ts`
- Test: `src/content/company.test.ts`, `src/lib/phone.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `type Field<T> = { status: 'resolved'; value: T } | { status: 'todo'; reason: string }`
  - `resolved<T>(value: T): Field<T>`, `todo(reason: string): Field<never>`
  - `isResolved<T>(f: Field<T>): f is { status: 'resolved'; value: T }`
  - `company` — objet des données entreprise
  - `PHONE_E164 = '+32467786456'`, `PHONE_NATIONAL = '0467 78 64 56'`, `PHONE_INTERNATIONAL = '+32 467 78 64 56'`, `TEL_HREF = 'tel:+32467786456'`

**Pourquoi ce design :** la spec impose « aucune donnée inventée ». Une règle écrite dans un document se perd. Un type qui rend l'accès à `.value` impossible sans passer par `isResolved` la rend **exécutable** : un développeur pressé ne peut pas afficher la TVA fausse par accident, le compilateur l'en empêche.

- [ ] **Step 1: Écrire le test téléphone qui échoue**

Créer `src/lib/phone.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import {
  PHONE_E164,
  PHONE_INTERNATIONAL,
  PHONE_NATIONAL,
  TEL_HREF,
} from './phone';

describe('Telephone', () => {
  it('E164 est strictement sans espace ni ponctuation', () => {
    expect(PHONE_E164).toMatch(/^\+[0-9]+$/);
  });

  it('E164 est le numero belge attendu', () => {
    expect(PHONE_E164).toBe('+32467786456');
  });

  it('le href tel utilise TOUJOURS le format international', () => {
    // Les clients du transport europeen appellent depuis l'etranger :
    // un href national ne fonctionnerait pas pour eux.
    expect(TEL_HREF).toBe('tel:+32467786456');
    expect(TEL_HREF).not.toContain(' ');
  });

  it('l affichage national et E164 designent le meme numero', () => {
    const digits = PHONE_NATIONAL.replace(/\s/g, '');
    expect(digits).toBe('0467786456');
    expect(PHONE_E164).toBe('+32' + digits.slice(1));
  });

  it('l affichage international et E164 designent le meme numero', () => {
    expect(PHONE_INTERNATIONAL.replace(/\s/g, '')).toBe(PHONE_E164);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/phone.test.ts`
Expected: FAIL — `Failed to resolve import "./phone"`

- [ ] **Step 3: Implémenter phone.ts**

Créer `src/lib/phone.ts` :

```ts
/**
 * Le numero unique d'ALB Depannage, sous ses trois formes.
 *
 * TEL_HREF est TOUJOURS en E.164 : les clients du transport europeen
 * appellent depuis l'etranger, un href au format national echouerait.
 * L'affichage, lui, reste national pour les clients belges.
 */
export const PHONE_E164 = '+32467786456' as const;
export const PHONE_NATIONAL = '0467 78 64 56' as const;
export const PHONE_INTERNATIONAL = '+32 467 78 64 56' as const;
export const TEL_HREF = `tel:${PHONE_E164}` as const;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/phone.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Écrire le test company qui échoue**

Créer `src/content/company.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { company, isResolved, resolved, todo } from './company';

describe('Field', () => {
  it('isResolved discrimine un champ resolu', () => {
    const f = resolved('valeur');
    expect(isResolved(f)).toBe(true);
    if (isResolved(f)) expect(f.value).toBe('valeur');
  });

  it('isResolved rejette un champ todo', () => {
    expect(isResolved(todo('pas confirme'))).toBe(false);
  });

  it('un todo porte toujours une raison non vide', () => {
    const f = todo('la TVA a un chiffre en trop');
    expect(f.status).toBe('todo');
    if (!isResolved(f)) expect(f.reason.length).toBeGreaterThan(0);
  });
});

describe('Donnees entreprise confirmees', () => {
  it('le nom est resolu', () => {
    expect(isResolved(company.legalName)).toBe(true);
  });

  it('email et telephone sont resolus', () => {
    expect(isResolved(company.email)).toBe(true);
    expect(company.phoneE164).toBe('+32467786456');
  });

  it('la disponibilite 24/7 est confirmee', () => {
    expect(company.available247).toBe(true);
  });
});

describe('Donnees NON confirmees — protection contre l invention', () => {
  /**
   * Ces trois champs sont faux ou incomplets et attendent le client.
   * Ils DOIVENT rester todo. Si quelqu'un les "resout" avec une valeur
   * plausible pour faire passer un build, ces tests le rattrapent.
   * Mentions legales fausses en Belgique = risque juridique reel.
   */
  it('la TVA reste todo — BE06922715996 a 11 chiffres au lieu de 10', () => {
    expect(company.vat.status).toBe('todo');
  });

  it('l adresse reste todo — Schaarbeeklei sans numero ni commune', () => {
    expect(company.address.status).toBe('todo');
  });

  it('la zone autoroute reste todo — concession belge par zone', () => {
    expect(company.motorwayZone.status).toBe('todo');
  });

  it('chaque todo explique ce qui manque', () => {
    for (const field of [company.vat, company.address, company.motorwayZone]) {
      expect(field.status).toBe('todo');
      // Narrowing par discriminant, pas via isResolved() : sur un tableau
      // heterogene Field<string> | Field<Address>, le guard generique ne
      // reduit pas la branche negative et `.reason` n'existe alors pas.
      if (field.status === 'todo') {
        expect(field.reason.length).toBeGreaterThan(20);
      }
    }
  });
});

describe('Perimetre d intervention', () => {
  /**
   * La spec scinde la promesse "toute l'Europe" : elle n'est vraie que
   * pour le transport. Un camion ne traverse pas l'Europe pour une
   * batterie a plat.
   */
  it('l urgence est locale, pas europeenne', () => {
    expect(company.emergencyScope).toBe('brussels-region');
  });

  it('le transport est europeen', () => {
    expect(company.transportScope).toBe('europe');
  });
});
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/content/company.test.ts`
Expected: FAIL — `Failed to resolve import "./company"`

- [ ] **Step 7: Implémenter company.ts**

Créer `src/content/company.ts` :

```ts
import { PHONE_E164, PHONE_INTERNATIONAL, PHONE_NATIONAL } from '@/lib/phone';

/**
 * Un champ soit confirme par le client, soit explicitement en attente.
 *
 * La spec impose "aucune donnee inventee". Une regle dans un document se
 * perd ; un type la rend executable. Pour lire .value il faut passer par
 * isResolved(), donc afficher une TVA non confirmee devient une erreur
 * de compilation plutot qu'un oubli.
 */
export type Field<T> =
  | { status: 'resolved'; value: T }
  | { status: 'todo'; reason: string };

export const resolved = <T>(value: T): Field<T> => ({
  status: 'resolved',
  value,
});

export const todo = (reason: string): Field<never> => ({
  status: 'todo',
  reason,
});

export const isResolved = <T>(
  field: Field<T>,
): field is { status: 'resolved'; value: T } => field.status === 'resolved';

export type Address = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  country: string;
};

export const company = {
  legalName: resolved('ALB Dépannage'),
  displayName: 'ALB Dépannage',

  phoneE164: PHONE_E164,
  phoneNational: PHONE_NATIONAL,
  phoneInternational: PHONE_INTERNATIONAL,
  email: resolved('contact@alb-depannage.com'),

  available247: true,

  /**
   * La promesse "toute l'Europe" du brief n'est vraie que pour le
   * transport. L'urgence est physiquement locale.
   */
  emergencyScope: 'brussels-region' as const,
  transportScope: 'europe' as const,

  pricing: {
    minEur: 50,
    maxEur: 250,
    perKmOutsideBrusselsEur: 2,
    quoteAvailable: true,
  },

  // --- En attente de confirmation client. Ne pas resoudre sans reponse. ---

  vat: todo(
    "Le client a fourni BE06922715996 : 11 chiffres apres BE, or le format belge en exige exactement 10 commencant par 0 ou 1. Un chiffre est en trop. A verifier sur la Banque-Carrefour des Entreprises avant publication.",
  ) as Field<string>,

  address: todo(
    "Le client a fourni « Schaarbeeklei », qui est une rue (Vilvoorde / Machelen). Numero, code postal et commune manquants. Requis pour les mentions legales et le referencement local.",
  ) as Field<Address>,

  motorwayZone: todo(
    "Le client annonce « agree autoroute » sans preciser la zone. Le depannage autoroutier belge est concede par zone : la mention ne peut pas etre publiee telle quelle.",
  ) as Field<string>,
} as const;
```

- [ ] **Step 8: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run`
Expected: PASS — 32 tests

- [ ] **Step 8b: Vérifier types et lint avant de commiter**

```bash
npm run typecheck && npm run lint
```

Expected: les deux passent. Vitest transpile sans vérifier les types — une suite verte ne prouve pas que l'arbre compile.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: donnees entreprise avec todo non-rendables

Le type Field<T> rend la regle « aucune donnee inventee » executable :
lire .value exige isResolved(), donc afficher la TVA fausse devient une
erreur de compilation, pas un oubli de relecture.

TVA, adresse et zone autoroute restent todo avec la raison exacte.
Le perimetre est scinde : urgence locale, transport europeen."
```

---

### Task 3: Routage trilingue via `proxy.ts`

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/proxy.ts`
- Create: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Modify: `next.config.ts` (wrapper `createNextIntlPlugin` — voir Step 3b)
- Delete: `src/app/page.tsx`, `src/app/layout.tsx` (remplacés par les versions `[locale]`)
- Test: `src/i18n/routing.test.ts`

**Interfaces:**
- Consumes: `tokens` (Task 1)
- Produces: `routing` (`defineRouting`), `Locale = 'fr' | 'nl' | 'en'`, `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` depuis `@/i18n/navigation`

**Attention Next 16 :** le fichier s'appelle **`proxy.ts`**, pas `middleware.ts`. L'export nommé est `proxy`. Le runtime est `nodejs` et n'est pas configurable — l'edge n'est pas supporté ici.

- [ ] **Step 1: Écrire le test de routage qui échoue**

Créer `src/i18n/routing.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { routing } from './routing';

describe('Routage i18n', () => {
  it('expose les trois langues', () => {
    expect(routing.locales).toEqual(['fr', 'nl', 'en']);
  });

  it('a le francais par defaut', () => {
    expect(routing.defaultLocale).toBe('fr');
  });

  it('la langue par defaut fait partie des langues', () => {
    expect(routing.locales).toContain(routing.defaultLocale);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/i18n/routing.test.ts`
Expected: FAIL — `Failed to resolve import "./routing"`

- [ ] **Step 3: Implémenter le routage**

Créer `src/i18n/routing.ts` :

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'nl', 'en'],
  defaultLocale: 'fr',
});

export type Locale = (typeof routing.locales)[number];
```

Créer `src/i18n/navigation.ts` :

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

Créer `src/i18n/request.ts` :

```ts
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Le contenu est du TypeScript type (src/content), pas des messages
  // JSON : next-intl ne sert ici qu'au routage et a la negociation.
  return { locale, messages: {} };
});
```

- [ ] **Step 3b: Envelopper `next.config.ts` avec le plugin next-intl — obligatoire**

Modifier `next.config.ts` :

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    // Next 16 : defaut [75]. On ajoute 90 pour le poster du hero (LCP).
    qualities: [75, 90],
  },
};

// Sans ce wrapper, next-intl/config (importe en interne par
// NextIntlClientProvider et getRequestConfig) reste un stub qui leve
// "Couldn't find next-intl config file" : c'est ce plugin qui alias
// next-intl/config vers src/i18n/request.ts (detecte par defaut).
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

> **Ne pas sauter cette étape.** La documentation next-intl laisse entendre qu'aucun plugin n'est nécessaire pour un routage i18n de base — c'est faux. Sans le wrapper, `typecheck`, `lint` et les tests passent tous, et le site renvoie une **500 à l'exécution** : `Couldn't find next-intl config file`. L'échec ne se voit qu'en lançant réellement le serveur, d'où le contrôle manuel du Step 8.

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/i18n/routing.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Créer `proxy.ts` (pas `middleware.ts`)**

Créer `src/proxy.ts` :

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Next 16 : ce fichier s'appelle proxy.ts, pas middleware.ts, et l'export
 * nomme est `proxy`. Le runtime est nodejs et n'est pas configurable —
 * l'edge n'est pas supporte ici.
 */
export const proxy = createMiddleware(routing);
export default proxy;

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
```

- [ ] **Step 6: Créer le layout `[locale]`**

Supprimer les fichiers racine remplacés :

```bash
rm -f src/app/page.tsx src/app/layout.tsx
```

Créer `src/app/[locale]/layout.tsx` :

```tsx
import type { Metadata } from 'next';
import { Inter, Syncopate } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'ALB Dépannage',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next 16 : params est une Promise, l'acces sync est supprime.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${syncopate.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg text-text antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> Pas de `data-scroll-behavior="smooth"` : Next 16 n'override plus `scroll-behavior`, et on ne veut pas de scroll fluide au palier Static. L'attribut sera ajouté au Plan 2, gaté par le palier.

- [ ] **Step 7: Créer une page d'accueil provisoire**

Créer `src/app/[locale]/page.tsx` :

```tsx
import { setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="p-8">
      <h1 className="font-display text-2xl">ALB Dépannage — {locale}</h1>
    </main>
  );
}
```

- [ ] **Step 8: Vérifier les trois routes à la main**

```bash
npm run dev
```

Ouvrir et vérifier :
- `http://localhost:3000/` → redirige vers `/fr`
- `http://localhost:3000/fr` → « ALB Dépannage — fr »
- `http://localhost:3000/nl` → « ALB Dépannage — nl »
- `http://localhost:3000/en` → « ALB Dépannage — en »
- `http://localhost:3000/de` → 404

Arrêter le serveur.

- [ ] **Step 9: Vérifier le build et commiter**

```bash
npm run typecheck && npm test && npm run build
```

Expected: build OK, les 3 locales prérendues (`/fr`, `/nl`, `/en`).

```bash
git add -A
git commit -m "feat: routage trilingue fr/nl/en via proxy.ts

Next 16 a renomme middleware.ts en proxy.ts, export nomme `proxy`.
Le runtime y est nodejs et n'est pas configurable.

params est une Promise : l'acces sync est supprime en Next 16.
next-intl ne sert qu'au routage ; le contenu reste du TS type."
```

---

### Task 4: Modèle de contenu trilingue typé

**Files:**
- Create: `src/content/types.ts`, `src/content/fr.ts`, `src/content/nl.ts`, `src/content/en.ts`, `src/content/index.ts`
- Test: `src/content/index.test.ts`

**Interfaces:**
- Consumes: `Locale` (Task 3), `company` (Task 2)
- Produces: `SiteContent` (interface), `getContent(locale: Locale): SiteContent`, `SERVICE_IDS` (readonly tuple des identifiants de service)

**Pourquoi du TS et pas des messages JSON :** la spec exige qu'« une clé manquante dans une langue soit une erreur de compilation, pas un trou en production ». Un objet typé par une interface partagée donne ça gratuitement ; du JSON ne le donne pas.

- [ ] **Step 1: Écrire le test de contenu qui échoue**

Créer `src/content/index.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { getContent, SERVICE_IDS } from './index';

const LOCALES = routing.locales;

describe('getContent', () => {
  it('retourne du contenu pour chaque langue', () => {
    for (const locale of LOCALES) {
      expect(getContent(locale)).toBeDefined();
    }
  });

  it('chaque langue declare tous les services, dans le meme ordre', () => {
    for (const locale of LOCALES) {
      const ids = getContent(locale).services.map((s) => s.id);
      expect(ids).toEqual([...SERVICE_IDS]);
    }
  });
});

describe('Completude du contenu', () => {
  /**
   * Le typage attrape les cles manquantes a la compilation. Ce test
   * attrape les chaines vides, qui passent le typage mais laissent un
   * trou visible en production.
   */
  it('aucune chaine vide dans aucune langue', () => {
    const emptyPaths: string[] = [];

    const walk = (node: unknown, path: string) => {
      if (typeof node === 'string') {
        if (node.trim() === '') emptyPaths.push(path);
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((item, i) => walk(item, `${path}[${i}]`));
        return;
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          walk(value, `${path}.${key}`);
        }
      }
    };

    for (const locale of LOCALES) {
      walk(getContent(locale), locale);
    }

    expect(emptyPaths).toEqual([]);
  });

  it('les trois langues ont exactement la meme forme', () => {
    const shape = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(shape);
      if (node && typeof node === 'object') {
        return Object.fromEntries(
          Object.keys(node)
            .sort()
            .map((k) => [k, shape((node as Record<string, unknown>)[k])]),
        );
      }
      return typeof node;
    };

    const fr = shape(getContent('fr'));
    for (const locale of LOCALES) {
      expect(shape(getContent(locale))).toEqual(fr);
    }
  });
});

describe('Perimetre annonce', () => {
  it('aucune langue ne promet une urgence a l echelle europeenne', () => {
    // La promesse "toute l'Europe" ne vaut que pour le transport.
    for (const locale of LOCALES) {
      const c = getContent(locale);
      expect(c.coverage.emergency.scope).toBe('brussels-region');
      expect(c.coverage.transport.scope).toBe('europe');
    }
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/content/index.test.ts`
Expected: FAIL — `Failed to resolve import "./index"`

- [ ] **Step 3: Définir l'interface de contenu**

Créer `src/content/types.ts` :

```ts
export const SERVICE_IDS = [
  'towing',
  'battery',
  'tyre',
  'fuel',
  'unlock',
  'transport',
  'heavy',
  'accident',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type Service = {
  id: ServiceId;
  title: string;
  description: string;
};

export type SiteContent = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    transport: string;
    pricing: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    callCta: string;
    quoteCta: string;
    availability: string;
    posterAlt: string;
  };
  problem: {
    title: string;
    body: string;
  };
  services: readonly Service[];
  servicesSection: {
    title: string;
    subtitle: string;
  };
  proof: {
    title: string;
    approved: string;
    insured: string;
    available: string;
  };
  coverage: {
    title: string;
    emergency: {
      scope: 'brussels-region';
      title: string;
      body: string;
    };
    transport: {
      scope: 'europe';
      title: string;
      body: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    rangeLabel: string;
    perKmLabel: string;
    quoteLabel: string;
    disclaimer: string;
  };
  finalCta: {
    title: string;
    body: string;
    button: string;
  };
  footer: {
    rights: string;
    legal: string;
    terms: string;
    privacy: string;
  };
};
```

- [ ] **Step 4: Écrire le contenu français**

Créer `src/content/fr.ts` :

```ts
import type { SiteContent } from './types';

export const fr: SiteContent = {
  meta: {
    title: 'ALB Dépannage — Dépannage et remorquage 24h/24 à Bruxelles',
    description:
      "Dépannage auto et remorquage 24h/24, 7j/7 à Bruxelles et en périphérie. Batterie, crevaison, panne de carburant, ouverture de véhicule. Transport de véhicule dans toute l'Europe. Agréé et assuré.",
  },
  nav: {
    home: 'Accueil',
    transport: 'Transport Europe',
    pricing: 'Tarifs',
    contact: 'Contact',
  },
  hero: {
    eyebrow: 'Disponible 24h/24, 7j/7',
    title: 'En panne ? On arrive.',
    subtitle:
      'Dépannage et remorquage à Bruxelles et en périphérie. Un appel suffit — on vous sort de là.',
    callCta: 'Appeler maintenant',
    quoteCta: 'Demander un devis',
    availability: 'Nuit, week-end et jours fériés compris',
    posterAlt:
      "Route mouillée de nuit éclairée par le gyrophare ambre d'une dépanneuse",
  },
  problem: {
    title: 'Personne ne prévoit de tomber en panne',
    body: "Batterie morte un lundi matin, pneu crevé sur le ring, clés enfermées dans la voiture. Ça arrive toujours au pire moment. Vous appelez, on vient — de jour comme de nuit, week-end compris.",
  },
  servicesSection: {
    title: 'Ce qu’on fait',
    subtitle: 'Véhicules légers et poids lourds.',
  },
  services: [
    {
      id: 'towing',
      title: 'Remorquage',
      description:
        'Votre véhicule vers le garage de votre choix, ou vers le nôtre.',
    },
    {
      id: 'battery',
      title: 'Batterie',
      description: 'Démarrage sur place et remplacement si nécessaire.',
    },
    {
      id: 'tyre',
      title: 'Crevaison',
      description: 'Roue de secours montée sur place, ou remorquage.',
    },
    {
      id: 'fuel',
      title: 'Panne de carburant',
      description: 'Livraison sur place, essence ou diesel.',
    },
    {
      id: 'unlock',
      title: 'Ouverture de véhicule',
      description: 'Clés enfermées à l’intérieur ? On ouvre sans casse.',
    },
    {
      id: 'transport',
      title: 'Transport de véhicule',
      description:
        "Transport longue distance dans toute l'Europe, sur devis.",
    },
    {
      id: 'heavy',
      title: 'VL et poids lourds',
      description: 'Équipement adapté aux véhicules lourds.',
    },
    {
      id: 'accident',
      title: 'Véhicule accidenté',
      description: 'Enlèvement et prise en charge après accident.',
    },
  ],
  proof: {
    title: 'Pourquoi nous faire confiance',
    approved: 'Entreprise agréée',
    insured: 'Intervention assurée',
    available: 'Joignable 24h/24, 7j/7',
  },
  coverage: {
    title: 'Où nous intervenons',
    emergency: {
      scope: 'brussels-region',
      title: 'Urgence — Bruxelles et périphérie',
      body: "Pour un dépannage d'urgence, nous intervenons à Bruxelles et dans sa périphérie. C'est la zone où nous pouvons arriver vite — et vite, c'est tout ce qui compte quand vous êtes immobilisé.",
    },
    transport: {
      scope: 'europe',
      title: "Transport — toute l'Europe",
      body: "Pour le transport de véhicule, aucune limite de distance : nous livrons partout en Europe, sur devis.",
    },
  },
  pricing: {
    title: 'Nos tarifs',
    subtitle: 'Annoncés à l’avance. Pas de surprise sur la facture.',
    rangeLabel: 'Intervention à Bruxelles',
    perKmLabel: 'Hors Bruxelles',
    quoteLabel: 'Transport et cas particuliers',
    disclaimer:
      'Le prix final dépend du type d’intervention et de la distance. Il vous est confirmé avant tout déplacement.',
  },
  finalCta: {
    title: 'Immobilisé ? Ne restez pas là.',
    body: 'Un appel, et on est en route.',
    button: 'Appeler maintenant',
  },
  footer: {
    rights: 'Tous droits réservés.',
    legal: 'Mentions légales',
    terms: 'Conditions générales',
    privacy: 'Confidentialité',
  },
};
```

- [ ] **Step 5: Écrire le contenu néerlandais**

Créer `src/content/nl.ts` :

```ts
import type { SiteContent } from './types';

export const nl: SiteContent = {
  meta: {
    title: 'ALB Depannage — Pechverhelping en takeldienst 24/7 in Brussel',
    description:
      'Pechverhelping en takeldienst 24/7 in Brussel en omgeving. Batterij, lekke band, brandstofpech, voertuig openen. Voertuigtransport in heel Europa. Erkend en verzekerd.',
  },
  nav: {
    home: 'Home',
    transport: 'Transport Europa',
    pricing: 'Tarieven',
    contact: 'Contact',
  },
  hero: {
    eyebrow: '24/7 bereikbaar',
    title: 'Panne? Wij komen eraan.',
    subtitle:
      'Pechverhelping en takeldienst in Brussel en omgeving. Eén telefoontje volstaat — wij halen u eruit.',
    callCta: 'Bel nu',
    quoteCta: 'Offerte aanvragen',
    availability: "Ook 's nachts, in het weekend en op feestdagen",
    posterAlt:
      'Natte weg bij nacht, verlicht door het oranje zwaailicht van een takelwagen',
  },
  problem: {
    title: 'Niemand plant een panne in',
    body: 'Lege batterij op maandagochtend, lekke band op de ring, sleutels in de auto. Het gebeurt altijd op het slechtste moment. U belt, wij komen — dag en nacht, weekend inbegrepen.',
  },
  servicesSection: {
    title: 'Wat wij doen',
    subtitle: 'Lichte voertuigen en vrachtwagens.',
  },
  services: [
    {
      id: 'towing',
      title: 'Takelen',
      description: 'Uw voertuig naar de garage van uw keuze, of naar de onze.',
    },
    {
      id: 'battery',
      title: 'Batterij',
      description: 'Starthulp ter plaatse en vervanging indien nodig.',
    },
    {
      id: 'tyre',
      title: 'Lekke band',
      description: 'Reservewiel ter plaatse gemonteerd, of takelen.',
    },
    {
      id: 'fuel',
      title: 'Brandstofpech',
      description: 'Levering ter plaatse, benzine of diesel.',
    },
    {
      id: 'unlock',
      title: 'Voertuig openen',
      description: 'Sleutels binnen? Wij openen zonder schade.',
    },
    {
      id: 'transport',
      title: 'Voertuigtransport',
      description: 'Langeafstandstransport in heel Europa, op offerte.',
    },
    {
      id: 'heavy',
      title: 'Lichte en zware voertuigen',
      description: 'Uitrusting geschikt voor zware voertuigen.',
    },
    {
      id: 'accident',
      title: 'Ongevalvoertuig',
      description: 'Berging en afhandeling na een ongeval.',
    },
  ],
  proof: {
    title: 'Waarom op ons vertrouwen',
    approved: 'Erkend bedrijf',
    insured: 'Verzekerde interventie',
    available: '24/7 bereikbaar',
  },
  coverage: {
    title: 'Waar wij komen',
    emergency: {
      scope: 'brussels-region',
      title: 'Dringend — Brussel en omgeving',
      body: 'Voor dringende pechverhelping komen wij in Brussel en omgeving. Dat is de zone waar wij snel ter plaatse zijn — en snel is het enige wat telt als u stilstaat.',
    },
    transport: {
      scope: 'europe',
      title: 'Transport — heel Europa',
      body: 'Voor voertuigtransport geldt geen afstandsgrens: wij leveren overal in Europa, op offerte.',
    },
  },
  pricing: {
    title: 'Onze tarieven',
    subtitle: 'Vooraf aangekondigd. Geen verrassingen op de factuur.',
    rangeLabel: 'Interventie in Brussel',
    perKmLabel: 'Buiten Brussel',
    quoteLabel: 'Transport en bijzondere gevallen',
    disclaimer:
      'De eindprijs hangt af van het type interventie en de afstand. Hij wordt bevestigd vóór elke verplaatsing.',
  },
  finalCta: {
    title: 'Staat u stil? Blijf daar niet.',
    body: 'Eén telefoontje en wij zijn onderweg.',
    button: 'Bel nu',
  },
  footer: {
    rights: 'Alle rechten voorbehouden.',
    legal: 'Wettelijke vermeldingen',
    terms: 'Algemene voorwaarden',
    privacy: 'Privacy',
  },
};
```

- [ ] **Step 6: Écrire le contenu anglais**

Créer `src/content/en.ts` :

```ts
import type { SiteContent } from './types';

export const en: SiteContent = {
  meta: {
    title: 'ALB Depannage — 24/7 breakdown and towing in Brussels',
    description:
      'Car breakdown assistance and towing, 24/7, in Brussels and surroundings. Battery, flat tyre, out of fuel, vehicle unlocking. Vehicle transport across Europe. Approved and insured.',
  },
  nav: {
    home: 'Home',
    transport: 'Europe transport',
    pricing: 'Pricing',
    contact: 'Contact',
  },
  hero: {
    eyebrow: 'Available 24/7',
    title: 'Broken down? We are on our way.',
    subtitle:
      'Breakdown assistance and towing in Brussels and surroundings. One call is all it takes.',
    callCta: 'Call now',
    quoteCta: 'Request a quote',
    availability: 'Nights, weekends and public holidays included',
    posterAlt:
      'Wet road at night lit by the amber beacon of a tow truck',
  },
  problem: {
    title: 'Nobody plans a breakdown',
    body: 'Dead battery on a Monday morning, flat tyre on the ring road, keys locked inside. It always happens at the worst moment. You call, we come — day or night, weekends included.',
  },
  servicesSection: {
    title: 'What we do',
    subtitle: 'Light vehicles and heavy goods vehicles.',
  },
  services: [
    {
      id: 'towing',
      title: 'Towing',
      description: 'Your vehicle to the garage of your choice, or to ours.',
    },
    {
      id: 'battery',
      title: 'Battery',
      description: 'Jump start on site, replacement if needed.',
    },
    {
      id: 'tyre',
      title: 'Flat tyre',
      description: 'Spare wheel fitted on site, or towing.',
    },
    {
      id: 'fuel',
      title: 'Out of fuel',
      description: 'Delivered on site, petrol or diesel.',
    },
    {
      id: 'unlock',
      title: 'Vehicle unlocking',
      description: 'Keys locked inside? We open it without damage.',
    },
    {
      id: 'transport',
      title: 'Vehicle transport',
      description: 'Long-distance transport across Europe, on quote.',
    },
    {
      id: 'heavy',
      title: 'Light and heavy vehicles',
      description: 'Equipment suited to heavy goods vehicles.',
    },
    {
      id: 'accident',
      title: 'Accident recovery',
      description: 'Removal and handling after an accident.',
    },
  ],
  proof: {
    title: 'Why trust us',
    approved: 'Approved company',
    insured: 'Insured intervention',
    available: 'Reachable 24/7',
  },
  coverage: {
    title: 'Where we operate',
    emergency: {
      scope: 'brussels-region',
      title: 'Emergency — Brussels and surroundings',
      body: 'For emergency breakdown assistance we cover Brussels and its surroundings. That is the area we can reach quickly — and quickly is all that matters when you are stranded.',
    },
    transport: {
      scope: 'europe',
      title: 'Transport — across Europe',
      body: 'For vehicle transport there is no distance limit: we deliver anywhere in Europe, on quote.',
    },
  },
  pricing: {
    title: 'Our pricing',
    subtitle: 'Stated upfront. No surprises on the invoice.',
    rangeLabel: 'Intervention in Brussels',
    perKmLabel: 'Outside Brussels',
    quoteLabel: 'Transport and special cases',
    disclaimer:
      'The final price depends on the type of intervention and the distance. It is confirmed before we set off.',
  },
  finalCta: {
    title: 'Stranded? Do not stay there.',
    body: 'One call and we are on our way.',
    button: 'Call now',
  },
  footer: {
    rights: 'All rights reserved.',
    legal: 'Legal notice',
    terms: 'Terms and conditions',
    privacy: 'Privacy',
  },
};
```

- [ ] **Step 7: Implémenter getContent**

Créer `src/content/index.ts` :

```ts
import type { Locale } from '@/i18n/routing';
import { en } from './en';
import { fr } from './fr';
import { nl } from './nl';
import type { SiteContent } from './types';

const CONTENT: Record<Locale, SiteContent> = { fr, nl, en };

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}

export { SERVICE_IDS } from './types';
export type { Service, ServiceId, SiteContent } from './types';
```

- [ ] **Step 8: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run`
Expected: PASS — 40 tests

- [ ] **Step 9: Vérifier que le typage attrape une clé manquante**

Vérification manuelle de la garantie centrale de cette tâche. Commenter temporairement la clé `pricing` dans `src/content/nl.ts`, puis :

```bash
npm run typecheck
```

Expected: FAIL — `Property 'pricing' is missing in type ... but required in type 'SiteContent'`

**Restaurer la clé** et vérifier que `npm run typecheck` repasse. C'est ce qui prouve que la spec est tenue : une clé manquante est une erreur de compilation, pas un trou en production.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: contenu trilingue type fr/nl/en

Contenu en TypeScript plutot qu'en messages JSON : l'interface partagee
SiteContent fait d'une cle manquante une erreur de compilation, ce que
du JSON ne garantit pas.

Les tests attrapent en plus les chaines vides et les divergences de
forme entre langues, que le typage laisse passer.

Aucune langue ne promet d'urgence a l'echelle europeenne."
```

---

### Task 5: Shell — header, footer et barre d'appel persistante

**Files:**
- Create: `src/components/ui/CallButton.tsx`, `src/components/ui/StickyCallBar.tsx`, `src/components/ui/SiteHeader.tsx`, `src/components/ui/SiteFooter.tsx`, `src/components/ui/LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Test: `src/components/ui/CallButton.test.tsx`, `src/components/ui/StickyCallBar.test.tsx`

**Interfaces:**
- Consumes: `TEL_HREF`, `PHONE_NATIONAL` (Task 2), `getContent` (Task 4), `Link` (Task 3)
- Produces: `<CallButton label variant />` où `variant: 'primary' | 'bar'`, `<StickyCallBar locale />`, `<SiteHeader locale />`, `<SiteFooter locale />`

**C'est le cœur de la conversion.** La barre d'appel est le meilleur apport de l'approche C : visible sur 100 % des vues, à portée de pouce.

> **Trois corrections issues de la revue** (commit `4bf7490`), à intégrer aux étapes ci-dessous :
>
> 1. **Le footer porte aussi la navigation principale**, pas seulement les liens légaux. Un second `<nav aria-label="Navigation">` avec `/transport-europe`, `/tarifs`, `/contact` (clés `c.nav.*`, déjà traduites). Sans lui, le header masquant sa nav en `hidden md:flex`, ces trois pages étaient **inatteignables sur mobile** : le client en panne appelle, mais le prospect transport arrivait dans une impasse. Le footer est le repli conventionnel — zéro JS, zéro composant client.
> 2. **`src/components/ui/SiteFooter.test.tsx` verrouille le rendu des champs `todo`.** Tester que `company.vat.status === 'todo'` ne prouve pas que l'UI ne l'affiche pas. Le test de rendu ferme la boucle — c'est la raison d'être de ce footer.
> 3. **`tokens.test.ts` couvre la paire `cta` / `surface`** (6,23:1 mesuré) : le lien téléphone du footer l'utilise, et elle n'était verrouillée par aucun test.
>
> **Note d'infra :** Vitest 4 / Vite 8 ne résout pas `next/navigation` pour `next-intl` (paquet sans `exports`). Contourné par `test.server.deps.inline: ['next', 'next-intl']` dans `vitest.config.ts`. Sans ça, tout test rendant un composant qui importe `Link` échoue à la résolution. `next build` n'est pas affecté.

- [ ] **Step 1: Écrire le test du bouton d'appel qui échoue**

Créer `src/components/ui/CallButton.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallButton } from './CallButton';

describe('CallButton', () => {
  it('pointe vers le numero au format international', () => {
    render(<CallButton label="Appeler maintenant" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler maintenant/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('affiche le libelle fourni', () => {
    render(<CallButton label="Bel nu" variant="primary" />);
    expect(screen.getByRole('link', { name: /bel nu/i })).toBeInTheDocument();
  });

  it('respecte la cible tactile minimale de 44px', () => {
    render(<CallButton label="Appeler" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link.className).toMatch(/min-h-\[44px\]/);
  });

  it('utilise le texte sombre sur le CTA ambre, jamais blanc', () => {
    // Blanc sur #F97316 = 2,68:1, echec WCAG AA. Verrouille par
    // src/lib/tokens.test.ts ; ici on verifie que le composant applique
    // bien le token et ne le contourne pas.
    render(<CallButton label="Appeler" variant="primary" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link.className).toContain('text-cta-fg');
    expect(link.className).not.toContain('text-white');
  });
});
```

- [ ] **Step 2: Configurer le setup de test**

Créer `src/test/setup.ts` :

```ts
import '@testing-library/jest-dom/vitest';
```

Modifier `vitest.config.ts` pour ajouter `setupFiles` :

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/CallButton.test.tsx`
Expected: FAIL — `Failed to resolve import "./CallButton"`

- [ ] **Step 4: Implémenter CallButton**

Créer `src/components/ui/CallButton.tsx` :

```tsx
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

type Props = {
  label: string;
  variant: 'primary' | 'bar';
  showNumber?: boolean;
};

/**
 * L'element de conversion central du site.
 *
 * href toujours en E.164 : les clients du transport europeen appellent
 * depuis l'etranger. text-cta-fg (sombre) et jamais text-white : blanc
 * sur l'ambre donne 2,68:1 et echoue WCAG AA.
 */
export function CallButton({ label, variant, showNumber = false }: Props) {
  const base =
    'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 ' +
    'bg-cta font-semibold text-cta-fg transition-opacity duration-200 ' +
    'hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2';

  const byVariant = {
    primary: 'rounded-md px-6 py-3 text-base',
    bar: 'w-full rounded-none px-4 py-4 text-lg',
  } as const;

  return (
    <a href={TEL_HREF} className={`${base} ${byVariant[variant]}`}>
      <PhoneIcon />
      <span>{label}</span>
      {showNumber ? (
        <span className="font-mono tabular-nums">{PHONE_NATIONAL}</span>
      ) : null}
    </a>
  );
}

/** Icone SVG, pas un emoji (regle : no-emoji-icons). */
function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/ui/CallButton.test.tsx`
Expected: PASS — 4 tests

- [ ] **Step 6: Écrire le test de la barre d'appel qui échoue**

Créer `src/components/ui/StickyCallBar.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCallBar } from './StickyCallBar';

describe('StickyCallBar', () => {
  it('contient un lien d appel fonctionnel', () => {
    render(<StickyCallBar locale="fr" />);
    const link = screen.getByRole('link', { name: /appeler/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('est fixee au bas de l ecran', () => {
    const { container } = render(<StickyCallBar locale="fr" />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('bottom-0');
  });

  it('est masquee sur desktop, ou le header porte deja le CTA', () => {
    const { container } = render(<StickyCallBar locale="fr" />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('md:hidden');
  });

  it('s affiche dans la langue demandee', () => {
    render(<StickyCallBar locale="nl" />);
    expect(screen.getByRole('link', { name: /bel nu/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/StickyCallBar.test.tsx`
Expected: FAIL — `Failed to resolve import "./StickyCallBar"`

- [ ] **Step 8: Implémenter StickyCallBar**

Créer `src/components/ui/StickyCallBar.tsx` :

```tsx
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';

/**
 * Barre d'appel fixee en bas sur mobile — le meilleur apport de
 * l'approche C. Visible sur 100% des vues, a portee de pouce.
 * Masquee sur desktop, ou le header porte deja le CTA.
 */
export function StickyCallBar({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden">
      <CallButton label={c.hero.callCta} variant="bar" showNumber />
    </div>
  );
}
```

- [ ] **Step 9: Implémenter header, footer et sélecteur de langue**

Créer `src/components/ui/LocaleSwitcher.tsx` :

```tsx
'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = { fr: 'FR', nl: 'NL', en: 'EN' };

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav aria-label="Langue" className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={
              'min-h-[44px] min-w-[44px] cursor-pointer rounded px-2 text-sm ' +
              'transition-colors duration-200 ' +
              (isActive
                ? 'text-text underline underline-offset-4'
                : 'text-muted hover:text-text')
            }
          >
            {LABELS[locale]}
          </button>
        );
      })}
    </nav>
  );
}
```

Créer `src/components/ui/SiteHeader.tsx` :

```tsx
import { getContent } from '@/content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { company } from '@/content/company';
import { CallButton } from './CallButton';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-sm font-bold tracking-widest text-text"
        >
          {company.displayName}
        </Link>

        <nav aria-label="Principale" className="hidden items-center gap-6 md:flex">
          <Link
            href="/transport-europe"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.transport}
          </Link>
          <Link
            href="/tarifs"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.pricing}
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <div className="hidden md:block">
            <CallButton label={c.hero.callCta} variant="primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
```

Créer `src/components/ui/SiteFooter.tsx` :

```tsx
import { company, isResolved } from '@/content/company';
import { getContent } from '@/content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

export function SiteFooter({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    // pb-24 sur mobile : la barre d'appel fixe ne doit pas masquer le footer.
    <footer className="border-t border-border bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-sm font-bold tracking-widest">
            {company.displayName}
          </p>
          <a
            href={TEL_HREF}
            className="mt-3 inline-block min-h-[44px] text-lg text-cta transition-opacity duration-200 hover:opacity-80"
          >
            {PHONE_NATIONAL}
          </a>
          {isResolved(company.email) ? (
            <a
              href={`mailto:${company.email.value}`}
              className="block text-sm text-muted transition-colors duration-200 hover:text-text"
            >
              {company.email.value}
            </a>
          ) : null}
        </div>

        <div>
          {/*
            L'adresse et la TVA ne s'affichent QUE si le client les a
            confirmees. isResolved() est la garde : le compilateur interdit
            de lire .value sans passer par elle.
          */}
          {isResolved(company.address) ? (
            <address className="text-sm not-italic text-muted">
              {company.address.value.street} {company.address.value.number}
              <br />
              {company.address.value.postalCode} {company.address.value.city}
              <br />
              {company.address.value.country}
            </address>
          ) : null}
          {isResolved(company.vat) ? (
            <p className="mt-2 text-sm text-muted">TVA {company.vat.value}</p>
          ) : null}
        </div>

        <nav aria-label="Légal" className="flex flex-col gap-2 text-sm">
          <Link
            href="/mentions-legales"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.legal}
          </Link>
          <Link
            href="/cgv"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.terms}
          </Link>
          <Link
            href="/confidentialite"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.privacy}
          </Link>
        </nav>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {company.displayName}. {c.footer.rights}
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: Brancher le shell dans le layout**

Modifier `src/app/[locale]/layout.tsx` — remplacer le contenu de `<body>` :

```tsx
      <body className="bg-bg text-text antialiased">
        <NextIntlClientProvider>
          <SiteHeader locale={locale} />
          {children}
          <SiteFooter locale={locale} />
          <StickyCallBar locale={locale} />
        </NextIntlClientProvider>
      </body>
```

Ajouter les imports en haut du fichier :

```tsx
import { SiteFooter } from '@/components/ui/SiteFooter';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { StickyCallBar } from '@/components/ui/StickyCallBar';
import type { Locale } from '@/i18n/routing';
```

Et typer le `locale` après la garde `hasLocale` :

```tsx
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
```

Puis utiliser `typedLocale` dans les trois composants.

- [ ] **Step 11: Lancer tous les tests, types et lint**

```bash
npm test && npm run typecheck && npm run lint
```

Expected: les trois passent (48 tests). Vitest transpile sans vérifier les types — une suite verte ne prouve pas que l'arbre compile.

- [ ] **Step 12: Vérifier à la main sur mobile**

```bash
npm run dev
```

Dans les DevTools, en 375px de large :
- La barre d'appel est visible en bas, sans scroll.
- Elle ne masque pas le bas du footer.
- Un clic déclenche bien `tel:+32467786456`.
- En 1024px, la barre disparaît et le CTA du header prend le relais.
- Le sélecteur de langue bascule `/fr` → `/nl` → `/en` en gardant la page.
- Ni adresse ni TVA n'apparaissent dans le footer (elles sont `todo`).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: shell — header, footer et barre d'appel persistante

La barre d'appel mobile est fixee en bas, a portee de pouce, visible
sur 100% des vues. Le footer porte pb-24 sur mobile pour ne pas passer
dessous.

Le footer n'affiche adresse et TVA que via isResolved() : les champs
todo sont invisibles par construction, pas par vigilance.

Icone SVG et non emoji. Cibles tactiles 44px verifiees par test."
```

---

### Task 6: Accueil — hero et sections de conversion

**Files:**
- Create: `src/components/ui/Hero.tsx`, `src/components/ui/ServicesSection.tsx`, `src/components/ui/ProofSection.tsx`, `src/components/ui/CoverageSection.tsx`, `src/components/ui/PricingSection.tsx`, `src/components/ui/FinalCta.tsx`, `src/components/ui/ServiceIcon.tsx`
- Create: `public/hero-poster.webp` (placeholder à remplacer)
- Modify: `src/app/[locale]/page.tsx`
- Test: `src/components/ui/Hero.test.tsx`, `src/components/ui/PricingSection.test.tsx`, `src/components/ui/CoverageSection.test.tsx`

**Interfaces:**
- Consumes: `getContent` (Task 4), `CallButton` (Task 5), `company` (Task 2)
- Produces: `<Hero locale />`, `<ServicesSection locale />`, `<ProofSection locale />`, `<CoverageSection locale />`, `<PricingSection locale />`, `<FinalCta locale />`, `<ServiceIcon id={ServiceId} />`

**Le poster du hero est le LCP.** C'est le pilier de l'architecture : au Plan 2, le canvas WebGL viendra par-dessus sans jamais le remplacer dans le chemin de rendu initial.

- [ ] **Step 1: Écrire le test du hero qui échoue**

Créer `src/components/ui/Hero.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('porte un seul h1', () => {
    const { container } = render(<Hero locale="fr" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('expose le lien d appel sans scroll', () => {
    render(<Hero locale="fr" />);
    const link = screen.getByRole('link', { name: /appeler maintenant/i });
    expect(link).toHaveAttribute('href', 'tel:+32467786456');
  });

  it('annonce la disponibilite 24/7', () => {
    render(<Hero locale="fr" />);
    expect(screen.getByText(/24h\/24/i)).toBeInTheDocument();
  });

  it('le poster porte un alt descriptif', () => {
    render(<Hero locale="fr" />);
    const img = screen.getByAltText(/gyrophare/i);
    expect(img).toBeInTheDocument();
  });

  it('le poster est prioritaire — c est le LCP', () => {
    // Pilier de l'architecture : le LCP ne depend jamais du WebGL.
    // Au Plan 2 le canvas se pose PAR-DESSUS ce poster, sans le
    // remplacer dans le chemin de rendu initial.
    render(<Hero locale="fr" />);
    const img = screen.getByAltText(/gyrophare/i);
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('n importe aucun module WebGL', async () => {
    // Garde-fou : si un jour Hero importe three, le palier Static casse.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('src/components/ui/Hero.tsx', 'utf8'),
    );
    expect(src).not.toMatch(/from ['"]three/);
    expect(src).not.toMatch(/@react-three/);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/Hero.test.tsx`
Expected: FAIL — `Failed to resolve import "./Hero"`

- [ ] **Step 3: Créer le poster provisoire**

Le poster définitif sera rendu depuis la scène WebGL au Plan 2, pour que les deux paliers montrent la même image. En attendant, générer un placeholder sombre :

```bash
mkdir -p public
node -e "
const fs=require('fs');
// Placeholder 1x1 WebP sombre, remplace au Plan 2 par un rendu de la scene.
const b64='UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
fs.writeFileSync('public/hero-poster.webp', Buffer.from(b64,'base64'));
"
```

> **TODO produit :** remplacer par un rendu réel de la scène « route de nuit » (1920×1080, WebP + AVIF) une fois le shader écrit au Plan 2.

- [ ] **Step 4: Implémenter le Hero**

Créer `src/components/ui/Hero.tsx` :

```tsx
import Image from 'next/image';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';
import { Link } from '@/i18n/navigation';

/**
 * Le poster est le LCP. Le WebGL (Plan 2) se posera PAR-DESSUS via le
 * canvas racine, sans jamais entrer dans le chemin de rendu initial.
 * C'est ce qui permet d'avoir l'ambition visuelle desktop sans sacrifier
 * le client immobilise en 4G degradee.
 *
 * Ce composant n'importe rien de Three.js. Verifie par test.
 */
export function Hero({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="relative isolate flex min-h-[85svh] items-center overflow-hidden">
      <Image
        src="/hero-poster.webp"
        alt={c.hero.posterAlt}
        fill
        priority
        fetchPriority="high"
        quality={90}
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />

      <div className="mx-auto w-full max-w-7xl px-4 py-16">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-cta">
          <span
            className="inline-block h-2 w-2 rounded-full bg-cta"
            aria-hidden="true"
          />
          {c.hero.eyebrow}
        </p>

        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {c.hero.title}
        </h1>

        {/* max-w-[60ch] : 65-75 caracteres par ligne max (regle UX) */}
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          {c.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <CallButton label={c.hero.callCta} variant="primary" showNumber />
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-6 py-3 text-base text-text transition-colors duration-200 hover:border-cta hover:text-cta"
          >
            {c.hero.quoteCta}
          </Link>
        </div>

        <p className="mt-4 text-sm text-muted">{c.hero.availability}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/ui/Hero.test.tsx`
Expected: PASS — 6 tests

- [ ] **Step 6: Écrire le test des tarifs qui échoue**

Créer `src/components/ui/PricingSection.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PricingSection } from './PricingSection';

describe('PricingSection', () => {
  /**
   * La base UX identifie "prix cache" comme un anti-pattern majeur du
   * secteur. Ces tests garantissent que les chiffres restent affiches.
   */
  it('affiche la fourchette bruxelloise', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/50/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('affiche le tarif kilometrique hors Bruxelles', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/2\s*€/)).toBeInTheDocument();
  });

  it('mentionne la possibilite de devis', () => {
    render(<PricingSection locale="fr" />);
    expect(screen.getByText(/devis/i)).toBeInTheDocument();
  });

  it('affiche les tarifs dans toutes les langues', () => {
    for (const locale of ['fr', 'nl', 'en'] as const) {
      const { unmount } = render(<PricingSection locale={locale} />);
      expect(screen.getByText(/50/)).toBeInTheDocument();
      unmount();
    }
  });
});
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/PricingSection.test.tsx`
Expected: FAIL — `Failed to resolve import "./PricingSection"`

- [ ] **Step 8: Implémenter les sections de conversion**

Créer `src/components/ui/ServiceIcon.tsx` :

```tsx
import type { ServiceId } from '@/content';

/**
 * Icones SVG, jamais d'emoji (regle no-emoji-icons).
 * viewBox 24x24 uniforme pour un rendu coherent.
 */
const PATHS: Record<ServiceId, string> = {
  towing: 'M3 17h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M5 17V7h9l4 4v6M14 7v4h4',
  battery: 'M4 9h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zm14 2h2v2h-2M7 11v2m3-2v2',
  tyre: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  fuel: 'M3 20h10V4H3v16zm0-9h10M16 8l3 3v7a2 2 0 0 1-4 0V6l-2-2',
  unlock: 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14v10H5V11z',
  transport: 'M2 8h11v9H2V8zm11 3h4l4 3v3h-8m-9 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
  heavy: 'M2 7h9v10H2V7zm9 4h5l4 4v2h-9m-9 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
  accident: 'M12 2 2 20h20L12 2zm0 6v6m0 3v1',
};

export function ServiceIcon({ id }: { id: ServiceId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-cta"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
```

Créer `src/components/ui/ServicesSection.tsx` :

```tsx
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { ServiceIcon } from './ServiceIcon';

export function ServicesSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {c.servicesSection.title}
      </h2>
      <p className="mt-2 max-w-[60ch] text-muted">{c.servicesSection.subtitle}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {c.services.map((service) => (
          <li
            key={service.id}
            className="rounded-lg border border-border bg-surface p-5 transition-colors duration-200 hover:border-cta"
          >
            <ServiceIcon id={service.id} />
            <h3 className="mt-3 font-semibold text-text">{service.title}</h3>
            <p className="mt-1 text-sm text-muted">{service.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Créer `src/components/ui/ProofSection.tsx` :

```tsx
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/**
 * La base UX identifie "absence de certifications" comme un anti-pattern
 * majeur du secteur. On affiche agrement, assurance et disponibilite.
 *
 * La zone d'agrement autoroute reste todo : elle n'apparait pas ici tant
 * que le client ne l'a pas precisee.
 */
export function ProofSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const items = [c.proof.approved, c.proof.insured, c.proof.available];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {c.proof.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-text">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-cta"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
```

Créer `src/components/ui/CoverageSection.tsx` :

```tsx
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/**
 * La distinction porte tout le positionnement : l'urgence est locale,
 * le transport est europeen. Annoncer "toute l'Europe" pour l'urgence
 * serait une promesse intenable — un camion ne traverse pas l'Europe
 * pour une batterie a plat.
 *
 * Au Plan 2, la carte WebGL des trajets remplace le placeholder du bloc
 * transport. Elle est non-decorative : elle dit ce que le texte dit moins
 * bien.
 */
export function CoverageSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {c.coverage.title}
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border border-cta/40 bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-cta">
            {c.hero.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-lg font-bold">
            {c.coverage.emergency.title}
          </h3>
          <p className="mt-3 max-w-[60ch] text-muted">
            {c.coverage.emergency.body}
          </p>
        </article>

        <article className="rounded-lg border border-border bg-surface p-6">
          <h3 className="mt-2 font-display text-lg font-bold">
            {c.coverage.transport.title}
          </h3>
          <p className="mt-3 max-w-[60ch] text-muted">
            {c.coverage.transport.body}
          </p>
        </article>
      </div>
    </section>
  );
}
```

Créer `src/components/ui/PricingSection.tsx` :

```tsx
import { company } from '@/content/company';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

export function PricingSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const p = company.pricing;

  const rows = [
    { label: c.pricing.rangeLabel, value: `${p.minEur} € – ${p.maxEur} €` },
    { label: c.pricing.perKmLabel, value: `+ ${p.perKmOutsideBrusselsEur} € / km` },
    { label: c.pricing.quoteLabel, value: c.hero.quoteCta },
  ];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {c.pricing.title}
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted">{c.pricing.subtitle}</p>

        <dl className="mt-10 divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 py-4"
            >
              <dt className="text-text">{row.label}</dt>
              <dd className="font-display text-xl font-bold text-cta">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 max-w-[60ch] text-sm text-muted">
          {c.pricing.disclaimer}
        </p>
      </div>
    </section>
  );
}
```

Créer `src/components/ui/FinalCta.tsx` :

```tsx
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';

export function FinalCta({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
        {c.finalCta.title}
      </h2>
      <p className="mx-auto mt-3 max-w-[60ch] text-muted">{c.finalCta.body}</p>
      <div className="mt-8 flex justify-center">
        <CallButton label={c.finalCta.button} variant="primary" showNumber />
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Écrire le test de couverture qui échoue**

Créer `src/components/ui/CoverageSection.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoverageSection } from './CoverageSection';

describe('CoverageSection', () => {
  it('distingue l urgence locale du transport europeen', () => {
    render(<CoverageSection locale="fr" />);
    expect(screen.getByText(/Urgence — Bruxelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Transport — toute l'Europe/i)).toBeInTheDocument();
  });

  it('ne promet jamais une urgence europeenne', () => {
    // La promesse intenable qu'on refuse de faire.
    const { container } = render(<CoverageSection locale="fr" />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/urgence.{0,30}toute l'Europe/i);
  });
});
```

- [ ] **Step 10: Assembler la page d'accueil**

Remplacer `src/app/[locale]/page.tsx` :

```tsx
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { CoverageSection } from '@/components/ui/CoverageSection';
import { FinalCta } from '@/components/ui/FinalCta';
import { Hero } from '@/components/ui/Hero';
import { PricingSection } from '@/components/ui/PricingSection';
import { ProofSection } from '@/components/ui/ProofSection';
import { ServicesSection } from '@/components/ui/ServicesSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return { title: c.meta.title, description: c.meta.description };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = getContent(l);

  return (
    <main>
      <Hero locale={l} />

      {/* Section "probleme" : la situation du client, avant les services. */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="max-w-[60ch] font-display text-2xl font-bold tracking-tight md:text-3xl">
          {c.problem.title}
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg text-muted">{c.problem.body}</p>
      </section>

      <ServicesSection locale={l} />
      <ProofSection locale={l} />
      <CoverageSection locale={l} />
      <PricingSection locale={l} />
      <FinalCta locale={l} />
    </main>
  );
}
```

- [ ] **Step 11: Lancer tous les tests**

Run: `npx vitest run`
Expected: PASS — 60 tests

- [ ] **Step 12: Vérifier build et rendu**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: tout passe, `/fr`, `/nl`, `/en` prérendus en statique.

```bash
npm run dev
```

Vérifier en 375px et 1440px : pas de scroll horizontal, le numéro visible sans scroll, la barre d'appel présente sur mobile.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: accueil — hero et sections de conversion

Le poster du hero est le LCP (priority + fetchPriority=high). C'est le
pilier de l'architecture : au Plan 2 le canvas WebGL se posera par-dessus
sans jamais entrer dans le chemin de rendu initial.

Un test verifie que Hero n'importe aucun module Three.js : c'est ce qui
rend le palier Static reellement fonctionnel plutot que suppose.

Tarifs affiches et certifications visibles — les deux anti-patterns
majeurs du secteur selon la base UX.

La zone autoroute reste absente : elle est todo."
```

---

### Task 7: Pages Transport Europe et Tarifs

**Files:**
- Create: `src/app/[locale]/transport-europe/page.tsx`, `src/app/[locale]/tarifs/page.tsx`
- Create: `src/components/ui/EuropeRoutesStatic.tsx`
- Modify: `src/content/types.ts`, `src/content/{fr,nl,en}.ts` (ajout des clés de page)
- Test: `src/components/ui/EuropeRoutesStatic.test.tsx`

**Interfaces:**
- Consumes: `getContent` (Task 4), `CallButton` (Task 5), `PricingSection` (Task 6)
- Produces: `<EuropeRoutesStatic />` — la carte SVG du palier Static, remplacée au Plan 2 par la version WebGL

- [ ] **Step 1: Étendre l'interface de contenu**

Ajouter à `src/content/types.ts`, dans le type `SiteContent` :

```ts
  transportPage: {
    title: string;
    intro: string;
    mapAlt: string;
    routesTitle: string;
    ctaTitle: string;
  };
  pricingPage: {
    title: string;
    intro: string;
  };
```

- [ ] **Step 2: Vérifier que le typage attrape les trois langues**

Run: `npm run typecheck`
Expected: FAIL — trois erreurs, une par langue : `Property 'transportPage' is missing`.

C'est précisément la garantie recherchée : impossible d'ajouter une section sans la traduire.

- [ ] **Step 3: Ajouter le contenu dans les trois langues**

Dans `src/content/fr.ts`, avant `footer` :

```ts
  transportPage: {
    title: "Transport de véhicule dans toute l'Europe",
    intro:
      "Voiture achetée à l'étranger, véhicule de collection, engin à déplacer, flotte à repositionner : nous transportons partout en Europe. Chaque trajet fait l'objet d'un devis, calculé sur la distance et le type de véhicule.",
    mapAlt:
      "Carte de l'Europe montrant les principaux trajets de transport au départ de Bruxelles",
    routesTitle: 'Nos trajets fréquents',
    ctaTitle: 'Un véhicule à déplacer ?',
  },
  pricingPage: {
    title: 'Tarifs',
    intro:
      "Nos prix sont annoncés à l'avance et confirmés avant tout déplacement. Pas de mauvaise surprise sur la facture.",
  },
```

Dans `src/content/nl.ts` :

```ts
  transportPage: {
    title: 'Voertuigtransport in heel Europa',
    intro:
      'Auto gekocht in het buitenland, oldtimer, machine te verplaatsen, vloot te herpositioneren: wij transporteren overal in Europa. Elk traject krijgt een offerte, berekend op afstand en voertuigtype.',
    mapAlt:
      'Kaart van Europa met de belangrijkste transporttrajecten vanuit Brussel',
    routesTitle: 'Onze frequente trajecten',
    ctaTitle: 'Een voertuig te verplaatsen?',
  },
  pricingPage: {
    title: 'Tarieven',
    intro:
      'Onze prijzen worden vooraf aangekondigd en bevestigd vóór elke verplaatsing. Geen onaangename verrassingen op de factuur.',
  },
```

Dans `src/content/en.ts` :

```ts
  transportPage: {
    title: 'Vehicle transport across Europe',
    intro:
      'Car bought abroad, classic vehicle, machinery to move, fleet to reposition: we transport anywhere in Europe. Every trip is quoted, based on distance and vehicle type.',
    mapAlt:
      'Map of Europe showing the main transport routes from Brussels',
    routesTitle: 'Our frequent routes',
    ctaTitle: 'A vehicle to move?',
  },
  pricingPage: {
    title: 'Pricing',
    intro:
      'Our prices are stated upfront and confirmed before we set off. No unpleasant surprises on the invoice.',
  },
```

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Écrire le test de la carte qui échoue**

Créer `src/components/ui/EuropeRoutesStatic.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EuropeRoutesStatic } from './EuropeRoutesStatic';

describe('EuropeRoutesStatic', () => {
  it('expose un role image avec un label accessible', () => {
    render(<EuropeRoutesStatic alt="Carte des trajets" />);
    expect(screen.getByRole('img', { name: /carte des trajets/i })).toBeInTheDocument();
  });

  it('liste les villes en texte, pas seulement en graphique', () => {
    // La couleur et le graphique ne sont jamais les seuls porteurs
    // d'information (regle a11y).
    render(<EuropeRoutesStatic alt="Carte" />);
    expect(screen.getByText(/Bruxelles/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/EuropeRoutesStatic.test.tsx`
Expected: FAIL — `Failed to resolve import "./EuropeRoutesStatic"`

- [ ] **Step 6: Implémenter la carte statique**

Créer `src/components/ui/EuropeRoutesStatic.tsx` :

```tsx
/**
 * Carte des trajets, palier Static. Au Plan 2, la version WebGL animee
 * se pose par-dessus quand le palier le permet — celle-ci reste le
 * fallback et le rendu SSR.
 *
 * Les villes sont listees en texte sous la carte : le graphique n'est
 * jamais le seul porteur d'information.
 */
const CITIES = [
  { name: 'Bruxelles', x: 300, y: 210 },
  { name: 'Paris', x: 250, y: 260 },
  { name: 'Amsterdam', x: 315, y: 175 },
  { name: 'Cologne', x: 355, y: 210 },
  { name: 'Milan', x: 375, y: 330 },
  { name: 'Madrid', x: 130, y: 390 },
  { name: 'Berlin', x: 425, y: 175 },
  { name: 'Vienne', x: 460, y: 265 },
] as const;

const HUB = CITIES[0];

export function EuropeRoutesStatic({ alt }: { alt: string }) {
  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 600 450"
        role="img"
        aria-label={alt}
        className="h-auto w-full"
      >
        {CITIES.slice(1).map((city) => (
          <line
            key={city.name}
            x1={HUB.x}
            y1={HUB.y}
            x2={city.x}
            y2={city.y}
            stroke="#F97316"
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
        ))}

        {CITIES.map((city) => (
          <g key={city.name}>
            <circle
              cx={city.x}
              cy={city.y}
              r={city.name === HUB.name ? 6 : 3}
              fill={city.name === HUB.name ? '#F97316' : '#94A3B8'}
            />
            <text
              x={city.x + 9}
              y={city.y + 4}
              fill="#94A3B8"
              fontSize={11}
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="sr-only">
        {alt}. Trajets au départ de {HUB.name} vers{' '}
        {CITIES.slice(1)
          .map((c) => c.name)
          .join(', ')}
        .
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/ui/EuropeRoutesStatic.test.tsx`
Expected: PASS — 2 tests

- [ ] **Step 8: Créer la page Transport Europe**

Créer `src/app/[locale]/transport-europe/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { CallButton } from '@/components/ui/CallButton';
import { EuropeRoutesStatic } from '@/components/ui/EuropeRoutesStatic';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return { title: c.transportPage.title, description: c.transportPage.intro };
}

export default async function TransportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  return (
    <main className="mx-auto max-w-7xl px-4 py-20">
      <h1 className="max-w-[60ch] font-display text-3xl font-bold tracking-tight md:text-5xl">
        {c.transportPage.title}
      </h1>
      <p className="mt-6 max-w-[60ch] text-lg text-muted">
        {c.transportPage.intro}
      </p>

      <h2 className="mt-16 font-display text-xl font-bold">
        {c.transportPage.routesTitle}
      </h2>
      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <EuropeRoutesStatic alt={c.transportPage.mapAlt} />
      </div>

      <section className="mt-16 text-center">
        <h2 className="font-display text-2xl font-bold">
          {c.transportPage.ctaTitle}
        </h2>
        <div className="mt-6 flex justify-center">
          <CallButton label={c.hero.callCta} variant="primary" showNumber />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 9: Créer la page Tarifs**

Créer `src/app/[locale]/tarifs/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { FinalCta } from '@/components/ui/FinalCta';
import { PricingSection } from '@/components/ui/PricingSection';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return { title: c.pricingPage.title, description: c.pricingPage.intro };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = getContent(l);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 pt-20">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          {c.pricingPage.title}
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          {c.pricingPage.intro}
        </p>
      </div>
      <div className="mt-12">
        <PricingSection locale={l} />
      </div>
      <FinalCta locale={l} />
    </main>
  );
}
```

- [ ] **Step 10: Vérifier et commiter**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: tout passe. 9 routes prérendues (3 pages × 3 langues).

```bash
git add -A
git commit -m "feat: pages Transport Europe et Tarifs

La carte des trajets est un SVG au palier Static ; les villes sont
listees en texte sous le graphique, qui n'est jamais le seul porteur
d'information. Au Plan 2, la version WebGL se posera par-dessus.

L'ajout de transportPage a bien fait echouer le typecheck sur les trois
langues avant traduction : la garantie du modele de contenu tient."
```

---

### Task 8: Contact et demande de devis

**Files:**
- Create: `src/app/[locale]/contact/page.tsx`, `src/components/ui/QuoteForm.tsx`, `src/app/[locale]/contact/actions.ts`, `src/lib/quote.ts`, `.env.example`
- Modify: `src/content/types.ts`, `src/content/{fr,nl,en}.ts`
- Test: `src/components/ui/QuoteForm.test.tsx`, `src/lib/quote.test.ts`, `src/app/[locale]/contact/actions.test.ts`

**Interfaces:**
- Consumes: `getContent` (Task 4), `CallButton` (Task 5), `SERVICE_IDS`, `ServiceId` (Task 4)
- Produces:
  - `type Quote = { name: string; phone: string; email: string | null; service: ServiceId; location: string; message: string }`
  - `type ParseResult = { ok: true; data: Quote } | { ok: false; field: 'name' | 'phone' | 'email' | 'service' }`
  - `parseQuote(formData: FormData): ParseResult`, `renderQuoteEmail(q: Quote): string`
  - `submitQuote(prev: QuoteState, formData: FormData): Promise<QuoteState>` où `QuoteState = { status: 'idle' | 'success' | 'error'; field?: string }`
  - `<QuoteForm locale />`

**Variables d'environnement requises :** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — à fournir par le client. Leur absence est un échec testé, pas un crash.

**Décision :** le formulaire utilise une Server Action qui envoie réellement l'email, via **SMTP (nodemailer)** sur la boîte existante `contact@alb-depannage.com`. Choix du client : pas de service tiers, pas de DNS à modifier.

**Deux conséquences à traiter dans le code, pas à espérer :**

1. **SMTP en serverless est lent et faillible.** Une connexion SMTP depuis une fonction Vercel peut prendre plusieurs secondes ou expirer. L'action doit avoir un timeout explicite et, en cas d'échec, renvoyer l'utilisateur vers le téléphone — jamais afficher un faux succès.
2. **Les identifiants n'existent pas encore.** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` sont à fournir par le client. Le code est écrit et testé avec nodemailer mocké ; l'absence d'identifiants est un échec explicite et testé, pas un crash.

**Sécurité :** aucune donnée du formulaire n'est interpolée dans du HTML d'email. Le corps est en texte brut, ce qui supprime la question de l'injection HTML. Les en-têtes (`Reply-To`) sont validés avant usage : un `\r\n` dans un champ email permettrait une injection d'en-tête SMTP.

- [ ] **Step 1: Étendre le contenu**

Ajouter à `SiteContent` dans `src/content/types.ts` :

```ts
  contactPage: {
    title: string;
    intro: string;
    urgentTitle: string;
    urgentBody: string;
    formTitle: string;
    fields: {
      name: string;
      phone: string;
      email: string;
      service: string;
      location: string;
      message: string;
    };
    submit: string;
    success: string;
    /** Echec d'envoi SMTP — oriente vers le telephone. */
    error: string;
    /** Erreur de validation d'un champ — distincte d'un echec d'envoi. */
    invalidFields: string;
  };
```

- [ ] **Step 2: Traduire dans les trois langues**

Dans `src/content/fr.ts` :

```ts
  contactPage: {
    title: 'Nous contacter',
    intro: "Pour une urgence, appelez — c'est toujours plus rapide. Pour un devis de transport ou une question, le formulaire suffit.",
    urgentTitle: 'C’est urgent ?',
    urgentBody: 'Ne remplissez pas le formulaire. Appelez, on décroche.',
    formTitle: 'Demander un devis',
    fields: {
      name: 'Votre nom',
      phone: 'Votre téléphone',
      email: 'Votre email',
      service: 'Type d’intervention',
      location: 'Où êtes-vous ?',
      message: 'Détails',
    },
    submit: 'Envoyer la demande',
    success: 'Demande reçue. Nous vous rappelons rapidement.',
    error: 'L’envoi a échoué. Appelez-nous, c’est plus sûr.',
    invalidFields: 'Vérifiez les champs du formulaire.',
  },
```

Dans `src/content/nl.ts` :

```ts
  contactPage: {
    title: 'Contact',
    intro: 'Bij een noodgeval belt u beter — dat gaat altijd sneller. Voor een transportofferte of een vraag volstaat het formulier.',
    urgentTitle: 'Is het dringend?',
    urgentBody: 'Vul het formulier niet in. Bel ons, wij nemen op.',
    formTitle: 'Offerte aanvragen',
    fields: {
      name: 'Uw naam',
      phone: 'Uw telefoon',
      email: 'Uw e-mail',
      service: 'Type interventie',
      location: 'Waar bent u?',
      message: 'Details',
    },
    submit: 'Aanvraag versturen',
    success: 'Aanvraag ontvangen. Wij bellen u snel terug.',
    error: 'Verzenden mislukt. Bel ons, dat is zekerder.',
    invalidFields: 'Controleer de velden van het formulier.',
  },
```

Dans `src/content/en.ts` :

```ts
  contactPage: {
    title: 'Contact us',
    intro: 'For an emergency, call — it is always faster. For a transport quote or a question, the form is enough.',
    urgentTitle: 'Is it urgent?',
    urgentBody: 'Do not fill in the form. Call us, we pick up.',
    formTitle: 'Request a quote',
    fields: {
      name: 'Your name',
      phone: 'Your phone',
      email: 'Your email',
      service: 'Type of intervention',
      location: 'Where are you?',
      message: 'Details',
    },
    submit: 'Send request',
    success: 'Request received. We will call you back shortly.',
    error: 'Sending failed. Call us, it is safer.',
    invalidFields: 'Please check the form fields.',
  },
```

- [ ] **Step 3: Écrire le test du formulaire qui échoue**

Créer `src/components/ui/QuoteForm.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteForm } from './QuoteForm';

describe('QuoteForm', () => {
  it('chaque champ a un label associe', () => {
    // Regle a11y CRITICAL : label avec for. getByLabelText echoue si
    // l'association est absente.
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/votre téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/votre email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type d/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/où êtes-vous/i)).toBeInTheDocument();
  });

  it('le champ telephone utilise le bon type', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre téléphone/i)).toHaveAttribute('type', 'tel');
  });

  it('le champ email utilise le bon type', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre email/i)).toHaveAttribute('type', 'email');
  });

  it('les champs obligatoires sont marques', () => {
    render(<QuoteForm locale="fr" />);
    expect(screen.getByLabelText(/votre nom/i)).toBeRequired();
    expect(screen.getByLabelText(/votre téléphone/i)).toBeRequired();
  });

  it('propose tous les services', () => {
    render(<QuoteForm locale="fr" />);
    const select = screen.getByLabelText(/type d/i);
    expect(select.querySelectorAll('option').length).toBeGreaterThanOrEqual(8);
  });

  it('le bouton de soumission respecte la cible tactile', () => {
    render(<QuoteForm locale="fr" />);
    const button = screen.getByRole('button', { name: /envoyer/i });
    expect(button.className).toMatch(/min-h-\[44px\]/);
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/QuoteForm.test.tsx`
Expected: FAIL — `Failed to resolve import "./QuoteForm"`

- [ ] **Step 5a: Installer nodemailer et écrire le test de validation**

```bash
npm install nodemailer@^7.0.0
npm install -D @types/nodemailer@^6.4.17
```

Créer `src/lib/quote.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { parseQuote, renderQuoteEmail } from './quote';

const valid = () => {
  const fd = new FormData();
  fd.set('name', 'Jean Dupont');
  fd.set('phone', '0470 12 34 56');
  fd.set('email', 'jean@example.com');
  fd.set('service', 'towing');
  fd.set('location', 'Ring de Bruxelles, sortie 9');
  fd.set('message', 'Voiture immobilisee, roue avant droite.');
  return fd;
};

describe('parseQuote', () => {
  it('accepte une demande complete', () => {
    const r = parseQuote(valid());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe('Jean Dupont');
  });

  it('rejette un nom trop court', () => {
    const fd = valid();
    fd.set('name', 'J');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('name');
  });

  it('rejette un telephone trop court', () => {
    const fd = valid();
    fd.set('phone', '123');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('phone');
  });

  it('rejette un service inconnu', () => {
    const fd = valid();
    fd.set('service', 'teleportation');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('service');
  });

  it('accepte une demande sans email — le telephone suffit', () => {
    const fd = valid();
    fd.delete('email');
    expect(parseQuote(fd).ok).toBe(true);
  });

  /**
   * Injection d'en-tete SMTP : un \r\n dans un champ qui finit en
   * Reply-To permettrait d'ajouter des en-tetes arbitraires (Bcc vers
   * une liste de spam, par exemple). Le champ email doit etre rejete,
   * pas nettoye — une adresse contenant un retour chariot n'est pas une
   * adresse.
   */
  it('rejette un email contenant un retour chariot', () => {
    const fd = valid();
    fd.set('email', 'a@b.com\r\nBcc: victime@example.com');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('email');
  });

  it('rejette un email contenant un saut de ligne', () => {
    const fd = valid();
    fd.set('email', 'a@b.com\nBcc: victime@example.com');
    expect(parseQuote(fd).ok).toBe(false);
  });

  it('rejette un email sans arobase', () => {
    const fd = valid();
    fd.set('email', 'pas-une-adresse');
    const r = parseQuote(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe('email');
  });
});

describe('renderQuoteEmail', () => {
  it('produit du texte brut contenant les champs', () => {
    const r = parseQuote(valid());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const body = renderQuoteEmail(r.data);
    expect(body).toContain('Jean Dupont');
    expect(body).toContain('0470 12 34 56');
    expect(body).toContain('Ring de Bruxelles');
  });

  /**
   * Le corps est en texte brut : pas de HTML, donc pas de question
   * d'echappement. Ce test verrouille ce choix — si quelqu'un passe
   * l'email en HTML sans echapper, il devra d'abord casser ce test.
   */
  it('n interpole jamais de HTML', () => {
    const fd = valid();
    fd.set('message', '<img src=x onerror=alert(1)>');
    const r = parseQuote(fd);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const body = renderQuoteEmail(r.data);
    // Le contenu arrive tel quel dans un corps text/plain : ni balise
    // interpretee, ni echappement HTML a maintenir.
    expect(body).toContain('<img src=x onerror=alert(1)>');
    expect(body).not.toContain('&lt;');
  });
});
```

- [ ] **Step 5b: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/quote.test.ts`
Expected: FAIL — `Failed to resolve import "./quote"`

- [ ] **Step 5c: Implémenter la validation et le rendu**

Créer `src/lib/quote.ts` :

```ts
import { SERVICE_IDS, type ServiceId } from '@/content';

export type Quote = {
  name: string;
  phone: string;
  email: string | null;
  service: ServiceId;
  location: string;
  message: string;
};

export type ParseResult =
  | { ok: true; data: Quote }
  | { ok: false; field: 'name' | 'phone' | 'email' | 'service' };

/** Rejette tout ce qui pourrait injecter un en-tete SMTP. */
const hasHeaderInjection = (value: string) => /[\r\n]/.test(value);

export function parseQuote(formData: FormData): ParseResult {
  const get = (key: string) => String(formData.get(key) ?? '').trim();

  const name = get('name');
  if (name.length < 2) return { ok: false, field: 'name' };

  const phone = get('phone');
  if (phone.replace(/[\s.\-()+]/g, '').length < 6) {
    return { ok: false, field: 'phone' };
  }

  const rawEmail = get('email');
  let email: string | null = null;
  if (rawEmail.length > 0) {
    // Rejeter, pas nettoyer : une adresse avec un retour chariot n'est
    // pas une adresse mal formatee, c'est une tentative d'injection.
    if (hasHeaderInjection(rawEmail)) return { ok: false, field: 'email' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return { ok: false, field: 'email' };
    }
    email = rawEmail;
  }

  const service = get('service');
  if (!SERVICE_IDS.includes(service as ServiceId)) {
    return { ok: false, field: 'service' };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      service: service as ServiceId,
      location: get('location'),
      message: get('message'),
    },
  };
}

/**
 * Corps en texte brut. Aucun HTML n'est genere, ce qui supprime la
 * question de l'echappement : le contenu utilisateur ne peut pas
 * devenir du balisage.
 */
export function renderQuoteEmail(q: Quote): string {
  return [
    'Nouvelle demande de devis — alb-depannage.com',
    '',
    `Nom        : ${q.name}`,
    `Telephone  : ${q.phone}`,
    `Email      : ${q.email ?? '(non fourni)'}`,
    `Service    : ${q.service}`,
    `Localisation : ${q.location || '(non fournie)'}`,
    '',
    'Message :',
    q.message || '(aucun)',
  ].join('\n');
}
```

- [ ] **Step 5d: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/quote.test.ts`
Expected: PASS — 11 tests

- [ ] **Step 5e: Écrire le test de la Server Action qui échoue**

Créer `src/app/[locale]/contact/actions.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

import { submitQuote } from './actions';

const valid = () => {
  const fd = new FormData();
  fd.set('name', 'Jean Dupont');
  fd.set('phone', '0470 12 34 56');
  fd.set('service', 'towing');
  return fd;
};

const withSmtpEnv = () => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('SMTP_PORT', '587');
  vi.stubEnv('SMTP_USER', 'contact@alb-depannage.com');
  vi.stubEnv('SMTP_PASS', 'secret');
};

describe('submitQuote', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    sendMail.mockReset();
  });

  it('renvoie une erreur de champ sans tenter d envoyer', async () => {
    withSmtpEnv();
    const fd = valid();
    fd.set('name', 'J');
    const r = await submitQuote({ status: 'idle' }, fd);
    expect(r.status).toBe('error');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('envoie et renvoie success quand SMTP repond', async () => {
    withSmtpEnv();
    sendMail.mockResolvedValue({ messageId: '1' });
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('success');
    expect(sendMail).toHaveBeenCalledOnce();
  });

  /**
   * Le coeur du sujet : SMTP en serverless echoue reellement. Si l'envoi
   * rate, l'utilisateur DOIT etre renvoye vers le telephone, jamais voir
   * un faux succes — sinon il attend un rappel qui ne viendra pas.
   */
  it('renvoie error si SMTP echoue', async () => {
    withSmtpEnv();
    sendMail.mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('error');
  });

  it('renvoie error si les identifiants SMTP sont absents', async () => {
    // Pas de withSmtpEnv() : simule un deploiement mal configure.
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).toBe('error');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('n affiche jamais success quand sendMail n a pas ete appele', async () => {
    const r = await submitQuote({ status: 'idle' }, valid());
    expect(r.status).not.toBe('success');
  });
});
```

- [ ] **Step 5f: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/app/[locale]/contact/actions.test.ts`
Expected: FAIL — `Failed to resolve import "./actions"`

- [ ] **Step 5g: Implémenter la Server Action**

Créer `src/app/[locale]/contact/actions.ts` :

```ts
'use server';

import nodemailer from 'nodemailer';
import { parseQuote, renderQuoteEmail } from '@/lib/quote';

export type QuoteState = {
  status: 'idle' | 'success' | 'error';
  field?: string;
};

/** SMTP en serverless peut pendre : on coupe court plutot que faire attendre. */
const SMTP_TIMEOUT_MS = 8_000;

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;
  return { host, port: Number(port), user, pass };
}

/**
 * Envoie la demande de devis par SMTP sur la boite existante.
 *
 * Regle non negociable : on ne renvoie 'success' QUE si sendMail a
 * resolu. Un faux succes laisse le client attendre un rappel qui ne
 * viendra jamais — pour une entreprise de depannage, c'est un client
 * perdu et une reputation abimee. En cas d'echec, l'UI renvoie vers le
 * telephone.
 */
export async function submitQuote(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const parsed = parseQuote(formData);
  if (!parsed.ok) {
    return { status: 'error', field: parsed.field };
  }

  const config = readSmtpConfig();
  if (!config) {
    console.error('[quote] identifiants SMTP absents — envoi impossible');
    return { status: 'error', field: 'smtp' };
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  try {
    await transport.sendMail({
      from: config.user,
      to: config.user,
      // parseQuote a rejete tout \r\n : pas d'injection d'en-tete possible.
      replyTo: parsed.data.email ?? undefined,
      subject: `Devis — ${parsed.data.service} — ${parsed.data.name}`,
      text: renderQuoteEmail(parsed.data),
    });
    return { status: 'success' };
  } catch (error) {
    console.error('[quote] echec SMTP', error);
    return { status: 'error', field: 'smtp' };
  }
}
```

- [ ] **Step 5h: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/app/[locale]/contact/actions.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5i: Documenter les variables d'environnement**

Créer `.env.example` :

```bash
# SMTP de la boite contact@alb-depannage.com.
# A fournir par le client — sans eux, le formulaire de devis renvoie
# une erreur et oriente vers le telephone (comportement teste, pas un crash).
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=contact@alb-depannage.com
SMTP_PASS=

# URL publique, utilisee pour les canonical et le sitemap.
NEXT_PUBLIC_SITE_URL=https://alb-depannage.com
```

Vérifier que `.gitignore` contient bien `.env*.local`.

- [ ] **Step 6: Implémenter le formulaire**

Créer `src/components/ui/QuoteForm.tsx` :

```tsx
'use client';

import { useActionState } from 'react';
import { submitQuote, type QuoteState } from '@/app/[locale]/contact/actions';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

const INITIAL: QuoteState = { status: 'idle' };

export function QuoteForm({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const [state, formAction, pending] = useActionState(submitQuote, INITIAL);

  const field =
    'mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text ' +
    'placeholder:text-muted focus-visible:border-cta';

  return (
    <form action={formAction} className="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm text-muted">
            {c.contactPage.fields.name} *
          </label>
          <input id="name" name="name" type="text" required className={field} />
        </div>

        <div>
          <label htmlFor="phone" className="text-sm text-muted">
            {c.contactPage.fields.phone} *
          </label>
          <input id="phone" name="phone" type="tel" required className={field} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="email" className="text-sm text-muted">
          {c.contactPage.fields.email}
        </label>
        <input id="email" name="email" type="email" className={field} />
      </div>

      <div className="mt-4">
        <label htmlFor="service" className="text-sm text-muted">
          {c.contactPage.fields.service} *
        </label>
        <select id="service" name="service" required className={field}>
          {c.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="location" className="text-sm text-muted">
          {c.contactPage.fields.location}
        </label>
        <input id="location" name="location" type="text" className={field} />
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="text-sm text-muted">
          {c.contactPage.fields.message}
        </label>
        <textarea id="message" name="message" rows={4} className={field} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-md bg-cta px-6 py-3 font-semibold text-cta-fg transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '…' : c.contactPage.submit}
      </button>

      {/*
        aria-live : le retour est annonce aux lecteurs d'ecran.

        Un echec d'envoi et un champ invalide ne disent pas la meme chose.
        Afficher « l'envoi a echoue, appelez-nous » parce qu'un nom fait
        une lettre enverrait le client au telephone pour rien.
      */}
      <p aria-live="polite" className="mt-4 text-sm">
        {state.status === 'success' ? (
          <span className="text-secondary">{c.contactPage.success}</span>
        ) : null}
        {state.status === 'error' ? (
          <span className="text-cta">
            {state.field === 'smtp'
              ? c.contactPage.error
              : c.contactPage.invalidFields}
          </span>
        ) : null}
      </p>
    </form>
  );
}
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/ui/QuoteForm.test.tsx`
Expected: PASS — 6 tests

- [ ] **Step 8: Créer la page contact**

Créer `src/app/[locale]/contact/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { CallButton } from '@/components/ui/CallButton';
import { QuoteForm } from '@/components/ui/QuoteForm';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return { title: c.contactPage.title, description: c.contactPage.intro };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = getContent(l);

  return (
    <main className="mx-auto max-w-7xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
        {c.contactPage.title}
      </h1>
      <p className="mt-6 max-w-[60ch] text-lg text-muted">
        {c.contactPage.intro}
      </p>

      {/* L'urgence passe AVANT le formulaire : c'est le chemin le plus court. */}
      <section className="mt-10 rounded-lg border border-cta/40 bg-surface p-6">
        <h2 className="font-display text-xl font-bold">
          {c.contactPage.urgentTitle}
        </h2>
        <p className="mt-2 text-muted">{c.contactPage.urgentBody}</p>
        <div className="mt-5">
          <CallButton label={c.hero.callCta} variant="primary" showNumber />
        </div>
        {isResolved(company.email) ? (
          <a
            href={`mailto:${company.email.value}`}
            className="mt-4 inline-block text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {company.email.value}
          </a>
        ) : null}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-xl font-bold">
          {c.contactPage.formTitle}
        </h2>
        <div className="mt-6">
          <QuoteForm locale={l} />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 9: Vérifier et commiter**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

```bash
git add -A
git commit -m "feat: page contact et demande de devis par SMTP

L'urgence passe avant le formulaire : appeler est toujours plus rapide
que remplir six champs quand on est immobilise.

Envoi via SMTP (nodemailer) sur la boite existante. 'success' n'est
renvoye QUE si sendMail resout : un faux succes laisse le client
attendre un rappel qui ne viendra jamais. SMTP en serverless echoue
reellement — timeout explicite a 8s, et l'echec oriente vers le
telephone.

Le corps de l'email est en text/plain : le contenu utilisateur ne peut
pas devenir du balisage, la question de l'echappement disparait.
Les emails contenant \\r\\n sont rejetes, pas nettoyes : c'est une
injection d'en-tete SMTP, pas une faute de frappe.

Champ invalide et echec d'envoi affichent des messages distincts.

Sans identifiants SMTP, l'action echoue proprement et oriente vers le
telephone — comportement teste, pas un crash."
```

---

### Task 9: Pages légales

**Files:**
- Create: `src/app/[locale]/mentions-legales/page.tsx`, `src/app/[locale]/cgv/page.tsx`, `src/app/[locale]/confidentialite/page.tsx`
- Create: `src/components/ui/PendingDataNotice.tsx`
- Modify: `src/content/types.ts`, `src/content/{fr,nl,en}.ts`
- Test: `src/components/ui/PendingDataNotice.test.tsx`

**Interfaces:**
- Consumes: `company`, `isResolved` (Task 2), `getContent` (Task 4)
- Produces: `<PendingDataNotice fields={Array<{label: string; reason: string}>} />`

**Contrainte légale :** en Belgique, des mentions légales incomplètes exposent l'entreprise. Ces pages **ne peuvent pas être publiées** tant que TVA et adresse sont `todo`. Plutôt que d'inventer, la page affiche un encart visible listant ce qui manque — et un test `noindex` empêche l'indexation d'une page incomplète.

- [ ] **Step 1: Étendre le contenu**

Ajouter à `SiteContent` dans `src/content/types.ts` :

```ts
  legal: {
    noticeTitle: string;
    termsTitle: string;
    privacyTitle: string;
    publisher: string;
    pendingTitle: string;
    pendingBody: string;
    privacyBody: string;
    termsBody: string;
  };
```

- [ ] **Step 2: Traduire dans les trois langues**

Dans `src/content/fr.ts` :

```ts
  legal: {
    noticeTitle: 'Mentions légales',
    termsTitle: 'Conditions générales',
    privacyTitle: 'Politique de confidentialité',
    publisher: 'Éditeur du site',
    pendingTitle: 'Informations en attente de confirmation',
    pendingBody:
      "Cette page est incomplète. Les informations ci-dessous doivent être confirmées par l'entreprise avant la mise en ligne publique du site.",
    privacyBody:
      "Ce site ne dépose aucun cookie de mesure d'audience et ne pratique aucun suivi publicitaire. Les données transmises via le formulaire de devis (nom, téléphone, email, localisation) servent uniquement à traiter votre demande et ne sont jamais cédées à des tiers. Vous pouvez demander leur suppression par email à tout moment.",
    termsBody:
      "Le prix final d'une intervention dépend du type de dépannage et de la distance parcourue. Il est confirmé au client avant tout déplacement. Toute intervention hors de Bruxelles fait l'objet d'un supplément kilométrique.",
  },
```

Dans `src/content/nl.ts` :

```ts
  legal: {
    noticeTitle: 'Wettelijke vermeldingen',
    termsTitle: 'Algemene voorwaarden',
    privacyTitle: 'Privacybeleid',
    publisher: 'Uitgever van de website',
    pendingTitle: 'Gegevens in afwachting van bevestiging',
    pendingBody:
      'Deze pagina is onvolledig. De onderstaande gegevens moeten door het bedrijf bevestigd worden vóór de publieke lancering van de website.',
    privacyBody:
      'Deze website plaatst geen analytische cookies en doet niet aan advertentietracking. De gegevens die via het offerteformulier worden verzonden (naam, telefoon, e-mail, locatie) dienen uitsluitend om uw aanvraag te behandelen en worden nooit aan derden doorgegeven. U kunt op elk moment per e-mail om verwijdering vragen.',
    termsBody:
      'De eindprijs van een interventie hangt af van het type pechverhelping en de afgelegde afstand. Hij wordt aan de klant bevestigd vóór elke verplaatsing. Elke interventie buiten Brussel brengt een kilometertoeslag met zich mee.',
  },
```

Dans `src/content/en.ts` :

```ts
  legal: {
    noticeTitle: 'Legal notice',
    termsTitle: 'Terms and conditions',
    privacyTitle: 'Privacy policy',
    publisher: 'Website publisher',
    pendingTitle: 'Information pending confirmation',
    pendingBody:
      'This page is incomplete. The information below must be confirmed by the company before the website goes public.',
    privacyBody:
      'This website sets no analytics cookies and performs no advertising tracking. Data submitted through the quote form (name, phone, email, location) is used solely to handle your request and is never shared with third parties. You may request its deletion by email at any time.',
    termsBody:
      'The final price of an intervention depends on the type of assistance and the distance travelled. It is confirmed to the customer before any journey. Any intervention outside Brussels incurs a per-kilometre supplement.',
  },
```

- [ ] **Step 3: Écrire le test de l'encart qui échoue**

Créer `src/components/ui/PendingDataNotice.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PendingDataNotice } from './PendingDataNotice';

describe('PendingDataNotice', () => {
  it('ne rend rien si tout est confirme', () => {
    const { container } = render(
      <PendingDataNotice title="T" body="B" fields={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('liste chaque donnee manquante avec sa raison', () => {
    render(
      <PendingDataNotice
        title="En attente"
        body="Incomplet."
        fields={[{ label: 'TVA', reason: 'Un chiffre en trop.' }]}
      />,
    );
    expect(screen.getByText(/TVA/)).toBeInTheDocument();
    expect(screen.getByText(/un chiffre en trop/i)).toBeInTheDocument();
  });

  it('utilise un role alert', () => {
    render(
      <PendingDataNotice
        title="En attente"
        body="Incomplet."
        fields={[{ label: 'TVA', reason: 'Manquant.' }]}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ui/PendingDataNotice.test.tsx`
Expected: FAIL — `Failed to resolve import "./PendingDataNotice"`

- [ ] **Step 5: Implémenter l'encart**

Créer `src/components/ui/PendingDataNotice.tsx` :

```tsx
type PendingField = { label: string; reason: string };

/**
 * Rend visible ce qui manque, plutot que de le combler avec du plausible.
 *
 * En Belgique, des mentions legales fausses ou incompletes exposent
 * l'entreprise. La bonne reponse n'est pas d'inventer une TVA vraisemblable
 * pour faire propre : c'est de montrer le trou jusqu'a ce qu'il soit comble.
 */
export function PendingDataNotice({
  title,
  body,
  fields,
}: {
  title: string;
  body: string;
  fields: readonly PendingField[];
}) {
  if (fields.length === 0) return null;

  return (
    <div
      role="alert"
      className="my-8 rounded-lg border border-cta bg-surface p-5"
    >
      <h2 className="font-display text-base font-bold text-cta">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <ul className="mt-4 space-y-2">
        {fields.map((f) => (
          <li key={f.label} className="text-sm">
            <span className="font-semibold text-text">{f.label}</span>
            <span className="text-muted"> — {f.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Créer la page mentions légales**

Créer `src/app/[locale]/mentions-legales/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { PendingDataNotice } from '@/components/ui/PendingDataNotice';
import { PHONE_INTERNATIONAL } from '@/lib/phone';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * noindex tant que la page est incomplete : une page de mentions legales
 * fausse, indexee, est pire qu'absente.
 */
function isComplete() {
  return isResolved(company.vat) && isResolved(company.address);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.legal.noticeTitle,
    robots: isComplete() ? undefined : { index: false, follow: false },
  };
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  const pending = [
    !isResolved(company.vat)
      ? { label: 'Numéro de TVA', reason: company.vat.reason }
      : null,
    !isResolved(company.address)
      ? { label: 'Adresse du siège', reason: company.address.reason }
      : null,
    !isResolved(company.motorwayZone)
      ? { label: 'Zone d’agrément autoroute', reason: company.motorwayZone.reason }
      : null,
  ].filter((f): f is { label: string; reason: string } => f !== null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {c.legal.noticeTitle}
      </h1>

      <PendingDataNotice
        title={c.legal.pendingTitle}
        body={c.legal.pendingBody}
        fields={pending}
      />

      <h2 className="mt-10 font-display text-lg font-bold">
        {c.legal.publisher}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="inline text-muted">Nom : </dt>
          <dd className="inline text-text">{company.displayName}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Téléphone : </dt>
          <dd className="inline text-text">{PHONE_INTERNATIONAL}</dd>
        </div>
        {isResolved(company.email) ? (
          <div>
            <dt className="inline text-muted">Email : </dt>
            <dd className="inline text-text">{company.email.value}</dd>
          </div>
        ) : null}
        {isResolved(company.vat) ? (
          <div>
            <dt className="inline text-muted">TVA : </dt>
            <dd className="inline text-text">{company.vat.value}</dd>
          </div>
        ) : null}
        {isResolved(company.address) ? (
          <div>
            <dt className="inline text-muted">Siège : </dt>
            <dd className="inline text-text">
              {company.address.value.street} {company.address.value.number},{' '}
              {company.address.value.postalCode} {company.address.value.city},{' '}
              {company.address.value.country}
            </dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}
```

- [ ] **Step 7: Créer les pages CGV et confidentialité**

Créer `src/app/[locale]/cgv/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { title: getContent(locale as Locale).legal.termsTitle };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {c.legal.termsTitle}
      </h1>
      <p className="mt-6 text-muted">{c.legal.termsBody}</p>
    </main>
  );
}
```

Créer `src/app/[locale]/confidentialite/page.tsx` :

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { title: getContent(locale as Locale).legal.privacyTitle };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {c.legal.privacyTitle}
      </h1>
      <p className="mt-6 text-muted">{c.legal.privacyBody}</p>
    </main>
  );
}
```

- [ ] **Step 8: Vérifier et commiter**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

```bash
git add -A
git commit -m "feat: pages legales avec encart de donnees manquantes

Les mentions legales affichent ce qui manque au lieu de le combler avec
du plausible, et passent en noindex tant qu'elles sont incompletes : une
page de mentions legales fausse et indexee est pire qu'absente.

En Belgique, des mentions incompletes exposent l'entreprise. L'encart
disparait automatiquement des que le client confirme TVA et adresse."
```

---

### Task 10: SEO — hreflang, schema.org, sitemap

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts`, `src/components/seo/LocalBusinessJsonLd.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Test: `src/lib/seo.test.ts`, `src/components/seo/LocalBusinessJsonLd.test.tsx`

**Interfaces:**
- Consumes: `routing` (Task 3), `company`, `isResolved` (Task 2), `getContent` (Task 4)
- Produces: `SITE_URL`, `alternatesFor(path: string): {canonical: string; languages: Record<string, string>}`, `<LocalBusinessJsonLd locale />`

- [ ] **Step 1: Écrire le test SEO qui échoue**

Créer `src/lib/seo.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { alternatesFor, SITE_URL } from './seo';

describe('alternatesFor', () => {
  it('declare une alternative par langue', () => {
    const alt = alternatesFor('/tarifs');
    for (const locale of routing.locales) {
      expect(alt.languages[locale]).toBe(`${SITE_URL}/${locale}/tarifs`);
    }
  });

  it('declare x-default vers la langue par defaut', () => {
    const alt = alternatesFor('/tarifs');
    expect(alt.languages['x-default']).toBe(`${SITE_URL}/fr/tarifs`);
  });

  it('gere la racine sans double slash', () => {
    const alt = alternatesFor('/');
    expect(alt.languages.fr).toBe(`${SITE_URL}/fr`);
    expect(alt.languages.fr).not.toContain('//fr');
  });

  it('produit des URL absolues', () => {
    const alt = alternatesFor('/contact');
    for (const url of Object.values(alt.languages)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: FAIL — `Failed to resolve import "./seo"`

- [ ] **Step 3: Implémenter seo.ts**

Créer `src/lib/seo.ts` :

```ts
import { routing } from '@/i18n/routing';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alb-depannage.com';

/**
 * hreflang pour les trois langues + x-default vers le francais.
 * Sans x-default, Google choisit lui-meme quelle version servir aux
 * visiteurs dont la langue ne correspond a aucune des notres.
 */
export function alternatesFor(path: string) {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${SITE_URL}/${locale}${clean}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${clean}`;

  return {
    canonical: `${SITE_URL}/${routing.defaultLocale}${clean}`,
    languages,
  };
}

export const ROUTES = [
  '/',
  '/transport-europe',
  '/tarifs',
  '/contact',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
] as const;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Écrire le test JSON-LD qui échoue**

Créer `src/components/seo/LocalBusinessJsonLd.test.tsx` :

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocalBusinessJsonLd } from './LocalBusinessJsonLd';

function parse(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? '{}');
}

describe('LocalBusinessJsonLd', () => {
  it('declare un AutoRepair avec telephone', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data['@type']).toBe('AutoRepair');
    expect(data.telephone).toBe('+32467786456');
  });

  it('declare une ouverture 24/7', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.openingHoursSpecification.opens).toBe('00:00');
    expect(data.openingHoursSpecification.closes).toBe('23:59');
  });

  /**
   * Une TVA ou une adresse inventee dans un schema.org est pire qu'absente :
   * c'est structure, machine-lisible, et Google le croit.
   */
  it('n emet AUCUNE adresse tant qu elle est todo', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.address).toBeUndefined();
  });

  it('n emet AUCUN identifiant TVA tant qu il est todo', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(data.vatID).toBeUndefined();
    expect(data.taxID).toBeUndefined();
  });

  it('declare la zone desservie pour l urgence, pas toute l Europe', () => {
    const { container } = render(<LocalBusinessJsonLd locale="fr" />);
    const data = parse(container);
    expect(JSON.stringify(data.areaServed)).toMatch(/Brussels/i);
  });
});
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/seo/LocalBusinessJsonLd.test.tsx`
Expected: FAIL — `Failed to resolve import "./LocalBusinessJsonLd"`

- [ ] **Step 7: Implémenter le JSON-LD**

Créer `src/components/seo/LocalBusinessJsonLd.tsx` :

```tsx
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import type { Locale } from '@/i18n/routing';
import { PHONE_E164 } from '@/lib/phone';
import { SITE_URL } from '@/lib/seo';

/**
 * Une adresse ou une TVA inventee dans un schema.org est pire qu'absente :
 * c'est structure, machine-lisible, et les moteurs la croient sur parole.
 * Les champs todo ne sont donc simplement pas emis.
 *
 * areaServed decrit la zone d'URGENCE (Bruxelles), pas le transport : le
 * schema decrit le service local, et promettre l'Europe entière ici serait
 * trompeur pour un moteur de recherche local.
 */
export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: company.displayName,
    url: `${SITE_URL}/${locale}`,
    telephone: PHONE_E164,
    description: c.meta.description,
    priceRange: `€${company.pricing.minEur}-€${company.pricing.maxEur}`,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Brussels-Capital Region',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
  };

  if (isResolved(company.email)) {
    data.email = company.email.value;
  }

  if (isResolved(company.address)) {
    const a = company.address.value;
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: `${a.street} ${a.number}`,
      postalCode: a.postalCode,
      addressLocality: a.city,
      addressCountry: a.country,
    };
  }

  if (isResolved(company.vat)) {
    data.vatID = company.vat.value;
  }

  return (
    <script
      type="application/ld+json"
      // Contenu statique issu de notre propre code, jamais d'entree
      // utilisateur : pas de vecteur d'injection ici.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 8: Créer sitemap et robots**

Créer `src/app/sitemap.ts` :

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { company, isResolved } from '@/content/company';
import { ROUTES, SITE_URL } from '@/lib/seo';

/**
 * Les mentions legales ne sont listees que si elles sont completes :
 * inutile d'inviter Google sur une page qu'on met nous-memes en noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const legalComplete =
    isResolved(company.vat) && isResolved(company.address);

  const routes = ROUTES.filter(
    (r) => r !== '/mentions-legales' || legalComplete,
  );

  return routes.flatMap((route) =>
    routing.locales.map((locale) => {
      const clean = route === '/' ? '' : route;
      return {
        url: `${SITE_URL}/${locale}${clean}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '/' ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE_URL}/${l}${clean}`]),
          ),
        },
      };
    }),
  );
}
```

Créer `src/app/robots.ts` :

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 9: Brancher hreflang et JSON-LD dans le layout**

Dans `src/app/[locale]/layout.tsx`, remplacer l'export `metadata` statique par :

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: c.meta.title, template: `%s — ${company.displayName}` },
    description: c.meta.description,
    alternates: alternatesFor('/'),
    openGraph: {
      title: c.meta.title,
      description: c.meta.description,
      url: `${SITE_URL}/${locale}`,
      siteName: company.displayName,
      locale,
      type: 'website',
    },
  };
}
```

Ajouter les imports nécessaires :

```tsx
import { getContent } from '@/content';
import { company } from '@/content/company';
import { alternatesFor, SITE_URL } from '@/lib/seo';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
```

Et insérer le JSON-LD dans `<body>`, juste avant `<SiteHeader>` :

```tsx
        <LocalBusinessJsonLd locale={typedLocale} />
```

- [ ] **Step 10: Vérifier le rendu SEO**

```bash
npm run build && npm start
```

Vérifier :
- `http://localhost:3000/sitemap.xml` — 18 URLs (6 routes × 3 langues ; mentions légales exclue car incomplète).
- `http://localhost:3000/robots.txt` — pointe vers le sitemap.
- Dans le source de `/fr` : `<link rel="alternate" hreflang="nl" ...>` et `hreflang="x-default"`.
- Le JSON-LD ne contient **ni `address` ni `vatID`**.
- `/fr/mentions-legales` porte `<meta name="robots" content="noindex, nofollow">`.

- [ ] **Step 11: Lancer tous les tests et commiter**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: PASS — 79 tests

```bash
git add -A
git commit -m "feat: SEO — hreflang, JSON-LD et sitemap

x-default pointe vers le francais : sans lui, Google choisit lui-meme
quelle version servir aux visiteurs d'une autre langue.

Le JSON-LD n'emet ni adresse ni TVA tant qu'elles sont todo. Une donnee
inventee dans un schema.org est pire qu'absente : c'est machine-lisible
et les moteurs la croient.

areaServed decrit la zone d'urgence (Bruxelles), pas le transport : le
schema decrit le service local.

Le sitemap exclut les mentions legales tant qu'elles sont en noindex."
```

---

### Task 11: Vérification finale — accessibilité, responsive, performance

**Files:**
- Create: `playwright.config.ts`, `e2e/conversion.spec.ts`, `e2e/a11y.spec.ts`
- Modify: `package.json` (scripts e2e)

**Interfaces:**
- Consumes: le site complet des tâches 1 à 10
- Produces: aucune interface applicative — c'est le filet de sécurité du plan

**Cette tâche vérifie les promesses de la spec**, plutôt que de les supposer tenues. Elle est la dernière parce qu'elle a besoin du site entier.

- [ ] **Step 1: Installer Playwright et axe**

```bash
npm install -D @playwright/test@latest @axe-core/playwright@latest
npx playwright install chromium
```

Ajouter à `package.json`, dans `scripts` :

```json
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
```

- [ ] **Step 2: Configurer Playwright**

Créer `playwright.config.ts` :

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000/fr',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 3: Écrire le test e2e de conversion**

Créer `e2e/conversion.spec.ts` :

```ts
import { expect, test } from '@playwright/test';

const LOCALES = ['fr', 'nl', 'en'] as const;

test.describe('Chemin de conversion', () => {
  for (const locale of LOCALES) {
    test(`[${locale}] le numero est atteignable sans scroll`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);
      const callLinks = page.locator('a[href="tel:+32467786456"]');
      await expect(callLinks.first()).toBeInViewport();
    });

    test(`[${locale}] aucun scroll horizontal`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  }

  test('la racine redirige vers le francais', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
  });

  test('le selecteur de langue conserve la page', async ({ page }) => {
    await page.goto('/fr/tarifs');
    await page.getByRole('button', { name: 'NL' }).click();
    await expect(page).toHaveURL(/\/nl\/tarifs/);
  });
});

test.describe('Barre d appel mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile uniquement');

  test('reste visible apres un scroll en bas de page', async ({ page }) => {
    await page.goto('/fr');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = page.locator('a[href="tel:+32467786456"]').last();
    await expect(bar).toBeInViewport();
  });

  test('ne masque pas le bas du footer', async ({ page }) => {
    await page.goto('/fr');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByText(/tous droits réservés/i),
    ).toBeInViewport();
  });
});

test.describe('Donnees non confirmees', () => {
  test('la TVA fausse n apparait nulle part', async ({ page }) => {
    await page.goto('/fr/mentions-legales');
    await expect(page.getByText('BE06922715996')).toHaveCount(0);
  });

  test('les mentions legales incompletes sont en noindex', async ({ page }) => {
    await page.goto('/fr/mentions-legales');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});
```

- [ ] **Step 4: Écrire le test e2e d'accessibilité**

Créer `e2e/a11y.spec.ts` :

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/fr',
  '/fr/transport-europe',
  '/fr/tarifs',
  '/fr/contact',
  '/fr/mentions-legales',
  '/nl',
  '/en',
];

for (const path of PAGES) {
  test(`${path} n a aucune violation axe (wcag2a, wcag2aa)`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('le parcours d appel est accessible au clavier', async ({ page }) => {
  await page.goto('/fr');

  // On tabule jusqu'a atteindre un lien d'appel : il doit etre
  // joignable sans souris.
  let found = false;
  for (let i = 0; i < 15 && !found; i++) {
    await page.keyboard.press('Tab');
    const href = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement)?.href ?? '',
    );
    if (href === 'tel:+32467786456') found = true;
  }
  expect(found).toBe(true);
});

test('le focus est visible', async ({ page }) => {
  await page.goto('/fr');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return getComputedStyle(el).outlineStyle;
  });
  expect(outline).not.toBe('none');
});
```

- [ ] **Step 5: Lancer les tests e2e**

Run: `npm run e2e`
Expected: PASS sur mobile et desktop.

En cas d'échec axe, **corriger le composant fautif** — ne jamais relâcher le test. Les violations les plus probables : contraste sur un état hover non prévu, ou ordre de titres (h1 → h3 sans h2).

- [ ] **Step 6: Mesurer Lighthouse sur mobile bridé**

```bash
npm run build && npm start
```

Dans un autre terminal :

```bash
npx lighthouse http://localhost:3000/fr \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=./lighthouse-desktop.json --quiet --chrome-flags="--headless"

npx lighthouse http://localhost:3000/fr \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=./lighthouse-mobile.json --quiet --chrome-flags="--headless"
```

Lire les scores :

```bash
node -e "
for (const f of ['lighthouse-mobile.json','lighthouse-desktop.json']) {
  const r = JSON.parse(require('fs').readFileSync(f));
  console.log('---', f);
  for (const [k,v] of Object.entries(r.categories)) console.log(k, Math.round(v.score*100));
  console.log('LCP', r.audits['largest-contentful-paint'].displayValue);
  console.log('CLS', r.audits['cumulative-layout-shift'].displayValue);
}
"
```

**Cibles de la spec :** LCP mobile < 1,5 s · CLS < 0,1 · accessibilité 100.

Ces mesures tournent en local, sans la latence réseau réelle. **Si le LCP dépasse 1,5 s ici, il ne passera jamais en 4G réelle** — corriger avant d'aller plus loin. Le suspect n° 1 sera le poster placeholder, à remplacer par un vrai WebP optimisé.

Ajouter les rapports au `.gitignore` :

```bash
printf '\n# Lighthouse\nlighthouse-*.json\n' >> .gitignore
```

- [ ] **Step 7: Vérifier les breakpoints à la main**

```bash
npm run dev
```

À 375, 768, 1024 et 1440 px, sur `/fr`, `/fr/contact` et `/fr/tarifs` :
- Pas de scroll horizontal.
- Pas de contenu masqué par le header sticky ni par la barre d'appel.
- Les cartes de service s'empilent proprement.
- Le texte reste à 16 px minimum sur mobile.

- [ ] **Step 8: Vérifier le palier Static — la promesse centrale de la spec**

Le site doit être entièrement fonctionnel sans JavaScript, puisque au Plan 2 le WebGL ne sera qu'une couche optionnelle. Dans les DevTools Chrome, désactiver JavaScript (`Ctrl+Shift+P` → « Disable JavaScript »), puis recharger `/fr` :

- Le hero, les services, les tarifs et le footer s'affichent.
- Le lien d'appel fonctionne.
- La barre d'appel est présente.

Seuls le sélecteur de langue et la soumission du formulaire cessent de fonctionner — c'est attendu, ce sont des composants client.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "test: e2e conversion, accessibilite et budgets de performance

Les promesses de la spec sont desormais verifiees plutot que supposees :
le numero est atteignable sans scroll dans les 3 langues, la barre
d'appel ne masque pas le footer, la TVA fausse n'apparait nulle part,
et axe ne remonte aucune violation wcag2a/wcag2aa sur 7 pages.

Le parcours d'appel est joignable au clavier seul.

Ces mesures tournent sans latence reseau : un LCP limite en local ne
passera pas en 4G reelle."
```

---

## Self-Review

**1. Couverture de la spec**

| Exigence de la spec | Tâche |
|---|---|
| §1 Données entreprise + TODO non inventés | 2, 9, 10 |
| §1 Urgence locale / transport européen | 2, 4, 6, 7 |
| §1 Tarifs affichés | 2, 6, 7 |
| §2 Numéro atteignable < 1 s | 5, 6, 11 |
| §2 LCP < 1,5 s | 6, 11 |
| §2 Fonctionnel sans WebGL | 1 (règle ESLint), 6 (test anti-import), 11 (step 8) |
| §2 Trilingue SEO propre | 3, 4, 10 |
| §3 SSR toujours en Static | 6 (le poster est le LCP) |
| §4 Fallback Static de la carte Europe | 7 |
| §5 Stack, `proxy.ts`, contraintes Next 16 | 1, 3 |
| §5 Contenu typé, clé manquante = erreur compile | 4 (step 9 le prouve) |
| §5 Pages | 6, 7, 8, 9 |
| §6 Barre d'appel mobile | 5, 11 |
| §6 `tel:` international | 2, 5 |
| §7 Tokens + contraste | 1 |
| §7 Syncopate / Inter | 3 |
| §8 Accessibilité | 1 (focus, reduced-motion), 5, 8, 11 |
| §9 Budgets perf | 11 |
| §10 Tests | toutes |

**Lacunes assumées, hors périmètre de ce plan :**
- Paliers Full/Lite, détection de capacité, Zustand, canvas R3F → **Plan 2**.
- Poster réel du hero → dépend du shader (Plan 2). Placeholder + `TODO` en Task 6.
- Identifiants SMTP → à fournir par le client. Le code est complet et testé avec nodemailer mocké ; leur absence produit un échec propre orientant vers le téléphone. Bloque la mise en ligne du formulaire, pas l'implémentation.
- Section avis clients → attend la réponse du client (question ouverte n° 5).
- Wordmark → question ouverte n° 4 ; le header utilise le nom en Syncopate.

**2. Placeholders** — les trois `TODO` restants sont des dépendances externes explicites (poster/Plan 2, email/décision client, données/client), pas des trous de plan. Chacun est nommé, expliqué, et gardé par un test ou un comportement sûr.

**3. Cohérence des types** — vérifiée : `Field<T>`/`isResolved` (T2) utilisés identiquement en T5, T9, T10 · `getContent(locale)` (T4) partout · `CallButton` avec `variant: 'primary' | 'bar'` (T5) réutilisé en T6, T7, T8 · `Locale` (T3) uniforme · `SERVICE_IDS` (T4) consommé en T8.

---

## Execution Handoff

Plan complet, sauvegardé dans `docs/superpowers/plans/2026-07-16-fondation-site-statique.md`.

**Plan 2 — Couche WebGL** sera écrit après validation de celui-ci : il dépend du site statique existant, et son premier travail sera de lever le risque d'intégration R3F / React 19.2.7 identifié dans la spec.
