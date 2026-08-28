'use client';

/**
 * Effet radar (composant 21st.dev, adapte a ce depot).
 *
 * Adaptations, dans l'ordre ou elles s'imposent :
 *
 * - `tailwind-merge` NON installe (le depot n'embarque ni clsx ni
 *   tailwind-merge, cf. expandable-gallery) : meme `cn` local minimal.
 *   Les classes de ce composant ne se contredisent jamais entre elles,
 *   la fusion intelligente de twMerge n'apporterait rien.
 * - `react-icons` NON installe : le depot n'utilise AUCUNE librairie
 *   d'icones, tout est en SVG inline. `icon` reste une prop `ReactNode`,
 *   l'appelant passe le SVG qu'il veut (voir EuropeRadar).
 * - Couleurs : la version d'origine est cablee en dur pour un fond noir
 *   (neutral-200, slate-700/800, sky-600). Ici, tout passe par les jetons
 *   du site en THEME CLAIR — anneaux en `--color-muted` degrade en
 *   transparence via color-mix, balayage en `--color-secondary` (le vert
 *   lisible) avec halo `--color-cta`, tuiles en bg/border.
 * - Mouvement : les keyframes de rotation vivent dans globals.css
 *   (`.radar-sweep`) et non dans une balise <style> dupliquee a chaque
 *   instance. La regle globale prefers-reduced-motion les fige donc
 *   automatiquement, comme le reste des animations CSS du site ; les
 *   apparitions framer, elles, sont neutralisees par useReducedMotion.
 */

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export function Circle({
  className,
  idx = 0,
  style,
}: {
  className?: string;
  /** Rang de l'anneau : pilote le decalage d'apparition. */
  idx?: number;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      style={style}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : idx * 0.1, duration: 0.2 }}
      className={cn(
        'absolute inset-0 left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 transform rounded-full',
        className,
      )}
    />
  );
}

export function Radar({
  className,
  rings = 8,
}: {
  className?: string;
  /** Nombre d'anneaux concentriques. */
  rings?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative flex h-20 w-20 items-center justify-center rounded-full',
        className,
      )}
    >
      {/* Le balayage. transformOrigin a droite : le trait pivote autour de
          l'extremite posee au centre du radar, comme l'aiguille d'un vrai
          scope. DEUX couches superposees — un halo vert vif large et tres
          dilue qui donne la matiere, un filet net en vert lisible qui donne
          l'arete. Sur fond clair, le vif seul disparaissait : c'est le
          `secondary` (#157a00) qui porte le trait, le `cta` ne fait que
          l'auréoler. */}
      <div
        style={{ transformOrigin: 'right center' }}
        className="radar-sweep absolute right-1/2 top-1/2 z-40 h-[14px] w-[360px]"
      >
        {/* Le degrade court du BORD (gauche, extremite du faisceau) vers le
            PIVOT (droite, centre du scope) : le signal est le plus dense
            pres de l'antenne et s'eteint en s'eloignant. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--color-cta) 32%, transparent) 40%, color-mix(in srgb, var(--color-cta) 62%, transparent) 100%)',
            filter: 'blur(6px)',
          }}
        />
        <div
          className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--color-secondary) 35%, transparent) 32%, color-mix(in srgb, var(--color-secondary) 72%, transparent) 100%)',
          }}
        />
      </div>

      {/* Les anneaux concentriques, de plus en plus efface vers l'exterieur. */}
      {Array.from({ length: rings }, (_, idx) => (
        <Circle
          key={`ring-${idx}`}
          idx={idx}
          style={{
            height: `${(idx + 1) * 5}rem`,
            width: `${(idx + 1) * 5}rem`,
            border: `1px solid color-mix(in srgb, var(--color-muted) ${Math.max(
              6,
              46 - idx * 5,
            )}%, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

export function IconContainer({
  icon,
  text,
  delay = 0,
}: {
  icon: React.ReactNode;
  text: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: reduced ? 0 : delay }}
      className="relative z-50 flex flex-col items-center justify-center space-y-2"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg text-secondary shadow-sm">
        {icon}
      </div>
      {/* Le nom reste VISIBLE des le mobile (l'original le masquait sous
          md) : une pastille sans son nom ne dit rien, et la ville est
          l'information, pas la decoration. */}
      <div className="rounded-md px-1 py-0.5">
        <div className="text-center text-[10px] font-bold text-muted md:text-xs">
          {text}
        </div>
      </div>
    </motion.div>
  );
}
