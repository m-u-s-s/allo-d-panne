'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
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
 * interactions du camion (drag, molette) supposent une souris.
 *
 * La taille vient de la MESURE du conteneur (ResizeObserver), pas d'une
 * constante : le camion occupe tout l'espace que le hero lui laisse, a
 * n'importe quelle largeur d'ecran. Effet de bord voulu : quand la zone
 * est masquee par CSS (< xl), la mesure vaut zero et le camion n'est
 * jamais monte — avant ce changement, son timer tournait pour un canvas
 * invisible.
 *
 * L'import dynamique sans SSR sort d3-timer et la geometrie du bundle
 * initial : le LCP du hero ne connait pas ce composant.
 */
const RotatingTowTruck = dynamic(
  () => import('./wireframe-dotted-tow-truck'),
  { ssr: false },
);

/** En deca, la zone est soit masquee soit inutilisable — on ne monte pas. */
const MIN_WIDTH = 360;

/* Le camion est long et plat : au-dela de ~0.55 de ratio, la hauteur
   supplementaire n'agrandit plus le vehicule (la largeur est la
   contrainte), elle n'ajoute que du noir. */
const CARD_RATIO = 0.55;

export function TruckMount() {
  const tier = useTier();
  const zone = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (tier !== 'full') return;
    const el = zone.current;
    if (!el) return;

    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w < MIN_WIDTH || h < 200) {
        setSize(null);
        return;
      }
      const cardW = w;
      const cardH = Math.min(h, Math.round(w * CARD_RATIO));
      // Grille de 16 px : chaque changement de taille reconstruit le
      // canvas (regeneration du nuage) — on ne le fait pas au pixel pres
      // pendant un redimensionnement de fenetre.
      setSize({
        w: Math.round(cardW / 16) * 16,
        h: Math.round(cardH / 16) * 16,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tier]);

  if (tier !== 'full') return null;

  return (
    <div
      ref={zone}
      className="flex h-full w-full items-center justify-center"
    >
      {size && <RotatingTowTruck width={size.w} height={size.h} />}
    </div>
  );
}
