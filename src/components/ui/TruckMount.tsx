'use client';

import dynamic from 'next/dynamic';
import { useTier } from '@/components/canvas/useTier';

/**
 * Frontiere client du camion filaire — meme role que SceneMount pour le
 * canvas WebGL.
 *
 * Palier Full UNIQUEMENT, et c'est un contrat, pas une optimisation :
 * le camion tourne en continu (d3.timer), or la regle CSS globale
 * prefers-reduced-motion ne peut pas arreter une animation canvas.
 * Le seul moyen d'honorer la preference est de ne jamais monter le
 * composant. Full exclut aussi les pointeurs grossiers : les
 * interactions du camion (drag, molette) supposent une souris, et sur
 * mobile le hero n'a pas la place.
 *
 * L'import dynamique sans SSR sort d3-timer et la geometrie du bundle
 * initial : le LCP du hero ne connait pas ce composant.
 */
const RotatingTowTruck = dynamic(
  () => import('./wireframe-dotted-tow-truck'),
  { ssr: false },
);

export function TruckMount() {
  const tier = useTier();
  if (tier !== 'full') return null;
  return <RotatingTowTruck width={560} height={430} />;
}
