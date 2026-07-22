/**
 * Source unique des couleurs. Le CSS (globals.css) et les tests lisent
 * les memes valeurs. Ratios verifies par tokens.test.ts, pas estimes.
 */
export const tokens = {
  bg: '#0A0E14',
  surface: '#141A23',
  text: '#F8FAFC',
  muted: '#94A3B8',
  cta: '#2DFF00',
  ctaFg: '#0A0E14',
  secondary: '#2DFF00',
  border: '#1E293B',
} as const;

export type TokenName = keyof typeof tokens;
