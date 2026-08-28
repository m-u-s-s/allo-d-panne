'use client';

/**
 * Radar des trajets europeens — remplace la carte schematique
 * `EuropeRoutesStatic` (SVG de lignes Bruxelles → villes), demande client.
 *
 * Pourquoi un radar plutot qu'une carte : la promesse de la page n'est pas
 * geographique (« voici l'Europe »), elle est operationnelle (« depuis
 * Bruxelles, on va jusque la »). Le scope dit exactement ca — un centre
 * unique, des villes detectees autour, un balayage qui ne s'arrete pas.
 *
 * CONTRAT D'ACCESSIBILITE repris tel quel de l'ancienne carte, et couvert
 * par EuropeRadar.test.tsx :
 *  - le visuel entier est UN seul `role="img"` porteur du `alt` localise ;
 *  - le figcaption sr-only liste TOUTES les villes en texte, avec les
 *    connecteurs localises (fromLabel/toLabel) — le graphique n'est jamais
 *    le seul porteur de l'information ;
 *  - l'animation est en CSS (`.radar-sweep`), donc figee par la regle
 *    globale prefers-reduced-motion ; les apparitions framer sont
 *    neutralisees par useReducedMotion dans radar-effect.
 */

import { IconContainer, Radar } from './radar-effect';

/**
 * Bruxelles en tete : c'est le HUB, pose au centre du radar. Les suivantes
 * sont les destinations, rangees par `ring` — 3 = les plus lointaines (en
 * haut, loin du centre), 1 = les plus proches (juste au-dessus du scope).
 * L'eloignement a l'ecran rejoue l'eloignement reel : la disposition porte
 * du sens, elle n'est pas decorative.
 */
export const CITIES = [
  { name: 'Bruxelles', ring: 0 },
  { name: 'Madrid', ring: 3 },
  { name: 'Vienne', ring: 3 },
  { name: 'Milan', ring: 3 },
  { name: 'Berlin', ring: 2 },
  { name: 'Paris', ring: 2 },
  { name: 'Amsterdam', ring: 1 },
  { name: 'Cologne', ring: 1 },
] as const;

const HUB = CITIES[0];

/** Epingle de carte, en SVG inline : le depot n'embarque aucune librairie d'icones. */
function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const ringOf = (ring: number) => CITIES.filter((c) => c.ring === ring);

/** Les villes d'un meme anneau, sur une rangee. */
function CityRow({
  ring,
  maxWidth,
  delayFrom,
}: {
  ring: number;
  maxWidth: string;
  delayFrom: number;
}) {
  return (
    <div className={`mx-auto w-full ${maxWidth}`}>
      <div className="flex w-full items-start justify-center gap-8 sm:justify-between sm:gap-0">
        {ringOf(ring).map((city, i) => (
          <IconContainer
            key={city.name}
            text={city.name}
            delay={delayFrom + i * 0.1}
            icon={<PinIcon />}
          />
        ))}
      </div>
    </div>
  );
}

export function EuropeRadar({
  alt,
  fromLabel,
  toLabel,
}: {
  /** Alternative textuelle localisee du visuel entier. */
  alt: string;
  /** Connecteur localise avant la ville de depart ("Trajets au depart de"). */
  fromLabel: string;
  /** Connecteur localise avant la liste des destinations ("vers"). */
  toLabel: string;
}) {
  return (
    <figure className="w-full">
      {/* role="img" + aria-label : le bloc entier compte pour UNE image aux
          technologies d'assistance, exactement comme l'ancien <svg>. Le
          texte, lui, passe par le figcaption. */}
      <div
        role="img"
        aria-label={alt}
        className="relative flex h-[24rem] w-full flex-col items-center justify-start gap-5 overflow-hidden rounded-md px-2 pt-4 sm:h-[26rem] sm:px-4"
        style={{
          // Lueur au SOL, sous le hub : le scope emet, il n'est pas un
          // simple schema pose a plat. Tres dilue — la matiere avant la
          // decoration.
          background:
            'radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, var(--color-cta) 10%, transparent) 0%, transparent 62%)',
        }}
      >
        <CityRow ring={3} maxWidth="max-w-2xl" delayFrom={0.1} />
        <CityRow ring={2} maxWidth="max-w-xs sm:max-w-sm" delayFrom={0.4} />
        <CityRow ring={1} maxWidth="max-w-[15rem] sm:max-w-md" delayFrom={0.6} />

        {/* Le HUB, pose au centre du scope : remplissage vert + encre sombre,
            le seul contraste fort du visuel — l'oeil part de la. */}
        <div className="absolute bottom-3 left-1/2 z-50 -translate-x-1/2">
          <span className="inline-flex min-h-[28px] items-center rounded-full bg-cta px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-cta-fg">
            {HUB.name}
          </span>
        </div>

        <Radar className="absolute -bottom-14" />

        {/* Ligne d'horizon : ferme le scope par le bas, sinon les anneaux
            semblent flotter hors cadre. */}
        <div
          className="absolute bottom-0 z-[41] h-px w-full"
          style={{
            background:
              'linear-gradient(to right, transparent, var(--color-muted), transparent)',
          }}
        />
      </div>

      <figcaption className="sr-only">
        {alt}. {fromLabel} {HUB.name} {toLabel}{' '}
        {CITIES.slice(1)
          .map((c) => c.name)
          .join(', ')}
        .
      </figcaption>
    </figure>
  );
}

export default EuropeRadar;
