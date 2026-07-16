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
