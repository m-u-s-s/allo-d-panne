'use client';

import dynamic from 'next/dynamic';
import { useTier } from '@/components/canvas/useTier';
import type { DescentItem } from '@/components/canvas/tunnel-podium-footer';

/**
 * Frontiere client de la descente WebGL (meme role que SceneMount et
 * TruckMount). Palier Full : l'experience complete, chargee apres
 * hydratation — three/fiber/postprocessing n'entrent jamais dans le
 * bundle initial. Tous les autres paliers (Lite, Static, reduced-motion,
 * sans JS) recoivent la MEME <nav> de canaux reels, sans canvas : les
 * liens existent toujours, personne n'a besoin de la descente pour
 * joindre l'entreprise — exigence d'accessibilite du brief, et contrat
 * de conversion du site.
 */
const TunnelPodiumFooter = dynamic(
  () => import('@/components/canvas/tunnel-podium-footer'),
  { ssr: false },
);

export function DescentFooterMount({
  items,
  ariaLabel,
  prevLabel,
  nextLabel,
}: {
  items: DescentItem[];
  ariaLabel: string;
  /** Libelles localises des fleches du carrousel (palier Full). */
  prevLabel: string;
  nextLabel: string;
}) {
  const tier = useTier();

  if (tier === 'static') {
    return (
      <nav
        aria-label={ariaLabel}
        className="border-t border-border bg-surface"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-10 font-mono text-sm uppercase tracking-widest">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              {...(item.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="flex min-h-[44px] items-center px-3 text-muted transition-colors duration-200 hover:text-text"
            >
              [ {item.label} ]
            </a>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <TunnelPodiumFooter
      items={items}
      ariaLabel={ariaLabel}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      lite={tier === 'lite'}
    />
  );
}
