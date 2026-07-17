'use client';

import dynamic from 'next/dynamic';
import { useTier } from '@/components/canvas/useTier';

/**
 * Frontiere client du hublot video — meme role que TruckMount pour le
 * camion. Deux raisons de ne pas rendre hero-video directement dans un
 * composant serveur :
 *
 * 1. Les conteneurs framer-motion rendent leur etat initial CACHE
 *    (inline-style au SSR) : sans JavaScript, le contenu resterait
 *    invisible — inacceptable pour tout ce qui vit dans une section de
 *    conversion. Ici, sans JS ou en palier Static, le bloc n'existe pas
 *    du tout et la section reste completement fonctionnelle.
 * 2. L'import dynamique sans SSR garde framer-motion hors du bundle
 *    initial (budget spec §9) — comme gsap, lenis et three.
 *
 * Full et Lite : l'animation est du clip-path/transform lie au scroll,
 * assez legere pour les mobiles recents. Static (reduced-motion,
 * save-data, materiel faible) : rien.
 */
const VideoReveal = dynamic(() => import('./VideoReveal'), { ssr: false });

export function VideoRevealMount() {
  const tier = useTier();
  if (tier === 'static') return null;
  return <VideoReveal />;
}
