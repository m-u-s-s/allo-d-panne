'use client';

import { useEffect, useState } from 'react';
import { supportsWebGL2 } from './tier';
import { useTier } from './useTier';

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

/**
 * Outil de support, invisible en usage normal : n'affiche rien tant que
 * l'URL ne contient pas ?debug.
 *
 * Raison d'etre : la degradation par paliers est INVISIBLE par
 * construction — c'est sa qualite. Mais quand un palier bas se declenche
 * sur la machine d'un client (« le site ne bouge pas », « pas de fond
 * lumineux »), impossible de diagnostiquer a distance sans voir la
 * decision et ses entrees. Ce badge les affiche sur SA machine, sans
 * DevTools : il suffit de lui faire ouvrir /fr?debug et lire.
 */
export function TierBadge() {
  const tier = useTier();
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return;

    const nav = navigator as NavigatorWithHints;
    const base = [
      `palier applique : ${tier.toUpperCase()}`,
      `webgl2 : ${supportsWebGL2() ? 'oui' : 'NON — pas de fond anime possible'}`,
      `reduced-motion : ${window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ACTIF — animations coupees par l OS' : 'non'}`,
      `save-data : ${nav.connection?.saveData ? 'ACTIF — economie de donnees' : 'non'}`,
      `connexion : ${nav.connection?.effectiveType ?? 'inconnue'}`,
      `memoire : ${nav.deviceMemory ?? '?'} Go`,
      `pointeur tactile : ${window.matchMedia('(pointer: coarse)').matches ? 'oui' : 'non'}`,
    ];

    if (!nav.getBattery) {
      setLines([...base, 'batterie : API indisponible']);
      return;
    }
    let cancelled = false;
    nav
      .getBattery()
      .then((b) => {
        if (cancelled) return;
        setLines([
          ...base,
          `batterie : ${Math.round(b.level * 100)} %${b.charging ? ' (en charge)' : ''}`,
        ]);
      })
      .catch(() => {
        if (!cancelled) setLines([...base, 'batterie : lecture refusee']);
      });
    return () => {
      cancelled = true;
    };
  }, [tier]);

  if (!lines) return null;

  return (
    <pre
      // role=status : les diagnostics arrivent apres coup ; un lecteur
      // d'ecran en est informe sans etre interrompu.
      role="status"
      className="fixed bottom-2 left-2 z-[9999] rounded-md border border-border bg-surface/95 p-3 font-mono text-xs leading-relaxed text-text shadow-lg"
    >
      {lines.join('\n')}
    </pre>
  );
}
