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
