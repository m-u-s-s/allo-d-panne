'use client';

/**
 * Galerie « pile → grille » (composant 21st.dev, adapte a ce depot).
 *
 * Adaptations : framer-motion (deja installe) au lieu de `motion/react` ;
 * `cn` local minimal (le depot n'embarque ni clsx ni tailwind-merge) ; fleches
 * en SVG inline (le depot n'utilise aucune librairie d'icones) ; bouton stylise
 * maison (pas de primitive shadcn) ; jetons du design system du site
 * (text-text, text-muted, bg-surface, bg-cta…) ; enfin, contenu ON-BRAND :
 * vraies photos de missions de depannage + copie FR (le demo « composants »
 * anglophone n'aurait aucun sens sur un site de depannage).
 */

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import React, { useState, useId, useRef } from 'react';
import Image from 'next/image';
import { useOutsideClick } from '@/hooks/use-outside-click';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type Photo = {
  id: string;
  src: string;
  alt: string;
  rotation?: number;
  x?: number;
  y?: number;
  zIndex?: number;
};

// Photos de missions (public/missions). Les trois premieres forment la pile
// visible au repos (rotation/decalage/z), les six autres completent la grille.
const PHOTOS: Photo[] = [
  { id: 'remorquage', src: '/missions/remorquage.jpg', alt: 'Remorquage de nuit sous la pluie', rotation: -15, x: -90, y: 10, zIndex: 10 },
  { id: 'depannage', src: '/missions/depannage.jpg', alt: 'Dépannage sur le bord de la route', rotation: -3, x: -10, y: -15, zIndex: 20 },
  { id: 'accident', src: '/missions/accident.jpg', alt: 'Enlèvement après accident', rotation: 12, x: 75, y: 5, zIndex: 30 },
  { id: 'transport', src: '/missions/transport.jpg', alt: 'Transport de véhicule sur autoroute' },
  { id: 'ville', src: '/missions/ville.jpg', alt: 'Intervention de dépannage en ville' },
  { id: 'moto', src: '/missions/moto.jpg', alt: 'Remorquage de moto' },
  { id: 'camionnette', src: '/missions/camionnette.jpg', alt: 'Assistance à une camionnette' },
  { id: 'hiver', src: '/missions/hiver.jpg', alt: 'Dépannage hivernal sous la neige' },
  { id: 'poids-lourd', src: '/missions/poids-lourd.jpg', alt: 'Dépannage de poids lourd' },
];

const transition = {
  type: 'spring',
  stiffness: 160,
  damping: 18,
  mass: 1,
} as const;

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function ExpandableGallery() {
  const [isExpanded, setIsExpanded] = useState(false);
  const layoutGroupId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => {
    if (isExpanded) setIsExpanded(false);
  });

  return (
    <section className="relative flex min-h-[850px] w-full flex-col items-center justify-start overflow-hidden bg-background px-4 py-20 md:px-8">
      <LayoutGroup id={layoutGroupId}>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <div className="mb-2 flex h-12 w-full items-center justify-between px-4">
            <AnimatePresence>
              {isExpanded && (
                <motion.button
                  key="back-button"
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setIsExpanded(false)}
                  className="group z-50 flex items-center gap-2 text-muted transition-all hover:text-text"
                >
                  <div className="rounded-full bg-surface p-2 text-text transition-colors group-hover:bg-border">
                    <ChevronLeft />
                  </div>
                  <span className="font-medium">Retour</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            ref={containerRef}
            layout
            className={cn(
              'relative w-full',
              isExpanded
                ? 'grid grid-cols-2 gap-6 px-4 md:gap-8 lg:grid-cols-3'
                : 'flex flex-col items-center justify-start pt-4',
            )}
            transition={transition}
          >
            <div
              className={cn(
                'relative',
                isExpanded
                  ? 'contents'
                  : 'mb-8 flex h-[450px] w-full items-center justify-center',
              )}
            >
              {PHOTOS.map((photo, index) => {
                const isPrimary = index < 3;
                if (!isPrimary && !isExpanded) return null;

                return (
                  <motion.div
                    key={`card-${photo.id}`}
                    layoutId={`card-container-${photo.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: !isExpanded ? photo.rotation || 0 : 0,
                      x: !isExpanded ? photo.x || 0 : 0,
                      y: !isExpanded ? photo.y || 0 : 0,
                      zIndex: !isExpanded ? photo.zIndex || index : 10,
                    }}
                    transition={transition}
                    whileHover={
                      !isExpanded
                        ? {
                            scale: 1.05,
                            y: (photo.y || 0) - 15,
                            rotate: (photo.rotation || 0) * 0.8,
                            zIndex: 50,
                            transition: { type: 'spring', stiffness: 400, damping: 25 },
                          }
                        : { scale: 1.02 }
                    }
                    className={cn(
                      'cursor-pointer overflow-hidden bg-surface',
                      isExpanded
                        ? 'relative aspect-square rounded-[2rem] border-4 border-background shadow-lg md:rounded-[3rem] md:border-[6px]'
                        : 'absolute h-44 w-44 rounded-[2.5rem] border-[6px] border-background shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:h-60 md:w-60 md:rounded-[3rem]',
                    )}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                  >
                    <motion.div
                      layoutId={`image-inner-${photo.id}`}
                      layout="position"
                      className="relative h-full w-full"
                      transition={transition}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="pointer-events-none select-none object-cover"
                        sizes={isExpanded ? '(max-width: 1024px) 50vw, 33vw' : '240px'}
                        priority={isPrimary}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {!isExpanded && (
                <motion.div
                  key="stack-content"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-2xl space-y-8 text-center"
                >
                  <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-text/90 md:text-4xl">
                    On ne se souvient pas de la panne.{' '}
                    <br className="hidden md:block" />
                    On se souvient de qui est arrivé.
                  </h2>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-cta px-8 py-3.5 font-semibold text-cta-fg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Voir nos interventions
                      <ChevronRight />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </LayoutGroup>
    </section>
  );
}

export default ExpandableGallery;
