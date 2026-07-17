'use client';

import dynamic from 'next/dynamic';

/**
 * Le point de montage, et la raison d'etre de ce fichier.
 *
 * Le layout racine est un composant serveur, ou `dynamic(..., { ssr:
 * false })` est interdit depuis Next 15. Il faut donc une frontiere client
 * pour porter l'import dynamique — d'ou ce composant, volontairement
 * reduit a cela.
 *
 * `ssr: false` fait le vrai travail : Three.js et R3F sortent du bundle
 * initial et ne sont demandes qu'apres l'hydratation. Le budget « JS
 * initial hors WebGL < 100 ko gzip » (spec section 9) tient par cette
 * ligne, pas par discipline.
 *
 * Aucun `loading` : le canvas n'a rien a montrer en attendant. Le poster
 * du hero, lui, est deja la — c'est lui le LCP, et il n'attend personne.
 */
const SceneCanvas = dynamic(
  () => import('./SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false },
);

export function SceneMount() {
  return <SceneCanvas />;
}
