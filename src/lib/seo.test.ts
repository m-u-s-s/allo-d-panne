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
