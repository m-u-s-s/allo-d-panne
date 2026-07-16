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
