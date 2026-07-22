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

  /**
   * THEME CLAIR : le CTA vert vif (#2DFF00) est un REMPLISSAGE (fond de
   * bouton) avec texte sombre par-dessus — jamais du texte vert sur blanc
   * (~1,4:1, illisible). Le contraste qui compte est ctaFg-sur-cta (teste
   * plus bas). Pour du TEXTE vert lisible (ex. message de succes du
   * formulaire), c'est `secondary`, une declinaison FONCEE du vert — verte
   * pour rester dans la marque, foncee pour passer AA sur blanc/surface.
   */
  it('vert lisible (secondary) sur fond passe AA', () => {
    expect(contrastRatio(tokens.secondary, tokens.bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('vert lisible (secondary) sur surface passe AA', () => {
    expect(contrastRatio(tokens.secondary, tokens.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
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
