'use client';

import { useEffect, useState } from 'react';
import { detectTier, LOW_BATTERY, type Tier } from './tier';

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

/**
 * Part TOUJOURS de 'static' et ne remonte qu'apres montage.
 *
 * Ce n'est pas une precaution SSR de pure forme : c'est le pilier de
 * l'architecture. Le premier rendu — celui qui porte le LCP — ne contient
 * jamais de WebGL, donc le poster du hero ne peut pas etre retarde par la
 * detection. Le palier monte ensuite, une fois la page utilisable.
 *
 * Suit aussi prefers-reduced-motion a chaud : un utilisateur qui active
 * l'option pendant sa visite doit voir l'animation s'arreter, pas
 * attendre un rechargement.
 */
export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>('static');

  useEffect(() => {
    let cancelled = false;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resolve = () => {
      const base = detectTier();
      if (base === 'static') {
        if (!cancelled) setTier('static');
        return;
      }

      const nav = navigator as NavigatorWithBattery;
      if (!nav.getBattery) {
        if (!cancelled) setTier(base);
        return;
      }

      nav
        .getBattery()
        .then((b) => {
          if (cancelled) return;
          // En charge, une batterie basse n'est plus un probleme : c'est
          // l'appareil sur batterie et bientot a plat qu'on protege.
          setTier(b.level < LOW_BATTERY && !b.charging ? 'static' : base);
        })
        .catch(() => {
          // getBattery peut etre bloque par politique de permissions. Un
          // refus n'est pas une batterie basse : on garde le palier detecte.
          if (!cancelled) setTier(base);
        });
    };

    resolve();
    motion.addEventListener('change', resolve);
    return () => {
      cancelled = true;
      motion.removeEventListener('change', resolve);
    };
  }, []);

  return tier;
}
