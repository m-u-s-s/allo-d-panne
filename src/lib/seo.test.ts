import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { alternatesFor, ogLocaleFor, SITE_URL } from './seo';

describe('alternatesFor', () => {
  it('declare une alternative par langue', () => {
    const alt = alternatesFor('/tarifs', 'fr');
    for (const locale of routing.locales) {
      expect(alt.languages[locale]).toBe(`${SITE_URL}/${locale}/tarifs`);
    }
  });

  it('declare x-default vers la langue par defaut', () => {
    const alt = alternatesFor('/tarifs', 'nl');
    expect(alt.languages['x-default']).toBe(`${SITE_URL}/fr/tarifs`);
  });

  it('gere la racine sans double slash', () => {
    const alt = alternatesFor('/', 'fr');
    expect(alt.languages.fr).toBe(`${SITE_URL}/fr`);
    expect(alt.languages.fr).not.toContain('//fr');
  });

  it('produit des URL absolues', () => {
    const alt = alternatesFor('/contact', 'en');
    for (const url of Object.values(alt.languages)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  describe('canonical auto-referent (pas de fuite inter-langue)', () => {
    it.each(routing.locales)(
      'la racine en %s a un canonical qui pointe vers sa propre langue',
      (locale) => {
        const alt = alternatesFor('/', locale);
        expect(alt.canonical).toBe(`${SITE_URL}/${locale}`);
      },
    );

    it.each(routing.locales)(
      'une sous-page en %s a un canonical qui pointe vers sa propre langue',
      (locale) => {
        const alt = alternatesFor('/tarifs', locale);
        expect(alt.canonical).toBe(`${SITE_URL}/${locale}/tarifs`);
      },
    );

    it('ne pointe jamais vers une langue differente de celle demandee', () => {
      for (const locale of routing.locales) {
        const alt = alternatesFor('/cgv', locale);
        expect(alt.canonical).toBe(`${SITE_URL}/${locale}/cgv`);
        for (const other of routing.locales) {
          if (other === locale) continue;
          expect(alt.canonical).not.toBe(`${SITE_URL}/${other}/cgv`);
        }
      }
    });

    it('reste auto-referent meme quand x-default pointe ailleurs (nl)', () => {
      // Avant le correctif, canonical et x-default etaient tous deux figes
      // sur le francais. x-default DOIT rester sur le francais ; canonical
      // ne doit plus le suivre.
      const alt = alternatesFor('/tarifs', 'nl');
      expect(alt.canonical).toBe(`${SITE_URL}/nl/tarifs`);
      expect(alt.languages['x-default']).toBe(`${SITE_URL}/fr/tarifs`);
    });
  });
});

describe('ogLocaleFor', () => {
  it('mappe chaque langue vers language_TERRITORY', () => {
    expect(ogLocaleFor('fr')).toBe('fr_BE');
    expect(ogLocaleFor('nl')).toBe('nl_BE');
    expect(ogLocaleFor('en')).toBe('en_GB');
  });
});
