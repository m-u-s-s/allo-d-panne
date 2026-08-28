import { describe, expect, it } from 'vitest';
import { getContent } from './index';
import { SEO_PAGES } from './types';
import { routing } from '@/i18n/routing';
import { ROUTES } from '@/lib/seo';

const LOCALES = routing.locales;

/**
 * Ce que ces tests protegent : avant, chaque page reprenait un titre
 * d'interface et un bout de copie comme description — et les trois pages
 * legales partageaient mot pour mot la description du site. Des titres et
 * des descriptions dupliques, c'est un moteur qui choisit lui-meme quelle
 * page montrer, ou n'en montre aucune.
 */
describe('metadonnees de recherche', () => {
  it('couvre chaque route : accueil + une entree seo par page', () => {
    // Si une route s'ajoute sans son couple titre/description, le compte
    // ne tombe plus juste — c'est le seul moment ou on peut encore s'en
    // apercevoir avant la mise en ligne.
    expect(SEO_PAGES).toHaveLength(ROUTES.length - 1);
  });

  for (const locale of LOCALES) {
    describe(locale, () => {
      const c = getContent(locale);
      const entries = [
        { key: 'home', ...c.meta },
        ...SEO_PAGES.map((p) => ({ key: p, ...c.seo[p] })),
      ];

      it('donne a chaque page un titre UNIQUE', () => {
        const titles = entries.map((e) => e.title);
        expect(new Set(titles).size).toBe(titles.length);
      });

      it('donne a chaque page une description UNIQUE', () => {
        const descriptions = entries.map((e) => e.description);
        expect(new Set(descriptions).size).toBe(descriptions.length);
      });

      it('tient dans ce que les moteurs affichent', () => {
        for (const e of entries) {
          // L'accueil porte deja la marque dans son titre ; les autres se
          // la font ajouter par le template Next (« — Allo-Dépannage »,
          // 17 caracteres), d'ou le plafond plus bas.
          const maxTitle = e.key === 'home' ? 62 : 42;
          expect(
            e.title.length,
            `titre trop long (${e.title.length}) : ${e.key} — ${e.title}`,
          ).toBeLessThanOrEqual(maxTitle);
          expect(e.title.length).toBeGreaterThan(8);

          expect(
            e.description.length,
            `description trop longue (${e.description.length}) : ${e.key}`,
          ).toBeLessThanOrEqual(158);
          expect(
            e.description.length,
            `description trop courte (${e.description.length}) : ${e.key}`,
          ).toBeGreaterThanOrEqual(100);
        }
      });

      it('garde les termes de recherche, fautes comprises', () => {
        // Demande client explicite : etre trouve meme quand le metier ou
        // le nom est mal ecrit. Sans ce test, un « nettoyage » bien
        // intentionne les supprime en croyant corriger des fautes.
        expect(c.searchTerms.length).toBeGreaterThanOrEqual(20);
        expect(c.searchTerms.some((t) => /depanage|depannage/i.test(t))).toBe(
          true,
        );
        expect(c.searchTerms.some((t) => /alo depannage|allo depanage/i.test(t))).toBe(
          true,
        );
      });

      it('ne laisse AUCUNE faute dans le texte visible', () => {
        /*
         * Le pendant du test precedent, et sa raison d'etre : les fautes
         * vivent dans searchTerms et dans alternateName du schema.org,
         * JAMAIS dans ce que lit un visiteur. Un site qui ecrit mal son
         * propre metier perd la confiance qu'il cherche a gagner.
         */
        const { searchTerms, ...visible } = c;
        void searchTerms;
        const texte = JSON.stringify(visible);
        for (const faute of [
          'depanage',
          'dépanage',
          'depaneuse',
          'remorcage',
          'epannage',
          'depanneur',
          'assistence',
          'recovry',
        ]) {
          expect(
            texte.toLowerCase(),
            `la faute « ${faute} » est passee dans le texte visible`,
          ).not.toContain(faute);
        }
      });
    });
  }
});
