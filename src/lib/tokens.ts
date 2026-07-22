/**
 * Source unique des couleurs. Le CSS (globals.css) et les tests lisent
 * les memes valeurs. Ratios verifies par tokens.test.ts, pas estimes.
 */
export const tokens = {
  // Theme CLAIR (retour client 2026-07-22) : fond blanc, texte sombre,
  // accent vert vif #2DFF00 en REMPLISSAGE (texte sombre par-dessus — le
  // vert sur blanc est illisible en texte, cf. tokens.test.ts). Le vert
  // "lisible" pour du texte (secondary) est une declinaison foncee.
  bg: '#FFFFFF',
  surface: '#F1F3EA',
  text: '#15171C',
  muted: '#555B65',
  cta: '#2DFF00',
  ctaFg: '#0A0E14',
  secondary: '#157A00',
  border: '#E4E6DB',
} as const;

export type TokenName = keyof typeof tokens;
