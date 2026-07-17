'use client';

import { ContainerInset, ContainerScroll } from './hero-video';

/**
 * Le hublot video du CTA final : une pastille arrondie qui s'ouvre en
 * plein cadre a mesure que la page defile (clip-path pilote par
 * scrollYProgress, transform/clip uniquement — jamais de layout).
 *
 * La video est purement decorative : muette, en boucle, aria-hidden —
 * axe ne la soumet donc pas a l'exigence de sous-titres, et aucun
 * lecteur d'ecran ne s'y arrete. La source est celle fournie par le
 * brief d'integration (Pexels, licence libre) ; a remplacer par des
 * images reelles de la depanneuse du client quand elles existeront.
 */
export default function VideoReveal() {
  return (
    <ContainerScroll>
      <ContainerInset className="mx-auto max-w-5xl">
        <video
          width="100%"
          height="100%"
          loop
          playsInline
          autoPlay
          muted
          preload="metadata"
          aria-hidden="true"
          className="relative z-10 block h-auto max-h-full max-w-full object-contain align-middle"
        >
          <source
            src="https://videos.pexels.com/video-files/34231503/14507483_1920_1080_30fps.mp4"
            type="video/mp4"
          />
        </video>
      </ContainerInset>
    </ContainerScroll>
  );
}
