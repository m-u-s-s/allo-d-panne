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
