/**
 * Les trois paliers de rendu (spec section 3.2).
 *
 * Le palier Static n'est pas une avarie : c'est le contrat du site. Le
 * rendu serveur produit TOUJOURS ce palier, et les deux autres viennent
 * s'y ajouter une fois la page utilisable. Un visiteur qui reste en
 * Static voit un site complet et convertit — il ne voit pas un site
 * casse. C'est ce qui autorise l'ambition visuelle en Full sans sacrifier
 * le client immobilise en 4G degradee.
 */
export type Tier = 'full' | 'lite' | 'static';

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

export function supportsWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    // Certains navigateurs jettent plutot que de renvoyer null quand le
    // WebGL est desactive par politique. Un throw ici signifie « pas de
    // WebGL », pas « bug » : on retrograde, on ne remonte pas l'erreur.
    return false;
  }
}

/**
 * Detection synchrone. La batterie est volontairement absente : son API
 * est asynchrone, donc elle est traitee dans useTier.
 */
export function detectTier(): Tier {
  // matchMedia absent : environnement de test jsdom ou navigateur
  // exotique. Dans le doute, le palier sur — c'est le contrat du site.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'static';
  }

  // prefers-reduced-motion d'abord, et sans appel : c'est une demande
  // explicite de l'utilisateur, pas une heuristique de capacite. Aucune
  // mesure de puissance machine ne doit pouvoir la contredire.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'static';
  }

  const nav = navigator as NavigatorWithHints;

  // save-data est, lui aussi, une demande explicite : l'utilisateur a dit
  // qu'il paie ses megaoctets. On ne lui envoie pas un shader.
  if (nav.connection?.saveData) return 'static';

  if (!supportsWebGL2()) return 'static';

  const link = nav.connection?.effectiveType;
  if (link === 'slow-2g' || link === '2g') return 'static';
  if (link === '3g') return 'lite';

  // deviceMemory est absent sur Safari : l'optimisme (8) y est deliberé,
  // le garde-fou pointer:coarse juste en dessous rattrape l'iPhone.
  if ((nav.deviceMemory ?? 8) <= 4) return 'lite';
  if (window.matchMedia('(pointer: coarse)').matches) return 'lite';

  return 'full';
}

/** Seuil sous lequel on coupe le WebGL pour ne pas vider une batterie deja basse. */
export const LOW_BATTERY = 0.2;
