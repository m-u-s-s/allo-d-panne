'use client';

import { Canvas } from '@react-three/fiber';
import { HeroScene } from './HeroScene';
import { useTier } from './useTier';

/**
 * Le canvas unique et persistant de la spec (section 3.1).
 *
 * Il vit dans le layout racine et ne se demonte jamais entre les routes :
 * le contexte WebGL survit a la navigation, ce qui evite d'en payer la
 * creation a chaque page et rend les transitions continues.
 *
 * `position: fixed` le sort du flux : il ne peut donc pas provoquer de
 * CLS, quoi qu'il arrive a son chargement. `pointer-events: none` le rend
 * transparent a la souris — un decor plein ecran ne doit jamais intercepter
 * un clic destine au bouton d'appel.
 *
 * aria-hidden : c'est de l'ambiance, aucune information. Un lecteur
 * d'ecran n'a rien a y lire.
 */
export function SceneCanvas() {
  const tier = useTier();

  // Palier Static : rien du tout. Pas un canvas vide, pas un canvas en
  // pause — aucun canvas. C'est ce qui rend la couche WebGL reellement
  // supprimable plutot que theoriquement optionnelle.
  if (tier === 'static') return null;

  const full = tier === 'full';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      data-tier={tier}
    >
      <Canvas
        // DPR plafonne a 1.5 en Lite (spec) : au-dela, le cout de
        // remplissage d'un shader plein ecran explose sur mobile pour un
        // gain invisible a l'oeil.
        dpr={full ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          // Le plan couvre tout l'ecran a chaque frame : effacer le buffer
          // de profondeur au prealable ne sert a rien.
          depth: false,
          stencil: false,
          powerPreference: full ? 'high-performance' : 'low-power',
        }}
        // Pas de post-processing en Lite : c'est la principale economie du
        // palier, et elle est structurelle (aucune passe supplementaire),
        // pas un reglage.
        frameloop="always"
      >
        <HeroScene quality={full ? 1 : 0} />
      </Canvas>
    </div>
  );
}
