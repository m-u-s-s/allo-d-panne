/**
 * Carte des trajets, palier Static. Au Plan 2, la version WebGL animee
 * se pose par-dessus quand le palier le permet — celle-ci reste le
 * fallback et le rendu SSR.
 *
 * Les villes sont listees en texte sous la carte : le graphique n'est
 * jamais le seul porteur d'information.
 */
export const CITIES = [
  { name: 'Bruxelles', x: 300, y: 210 },
  { name: 'Paris', x: 250, y: 260 },
  { name: 'Amsterdam', x: 315, y: 175 },
  { name: 'Cologne', x: 355, y: 210 },
  { name: 'Milan', x: 375, y: 330 },
  { name: 'Madrid', x: 130, y: 390 },
  { name: 'Berlin', x: 425, y: 175 },
  { name: 'Vienne', x: 460, y: 265 },
] as const;

const HUB = CITIES[0];

export function EuropeRoutesStatic({
  alt,
  fromLabel,
  toLabel,
}: {
  alt: string;
  /** Connecteur localise avant le nom de la ville de depart ("Trajets au depart de"). */
  fromLabel: string;
  /** Connecteur localise avant la liste des villes de destination ("vers"). */
  toLabel: string;
}) {
  return (
    <figure className="w-full">
      <svg
        viewBox="0 0 600 450"
        role="img"
        aria-label={alt}
        className="h-auto w-full"
      >
        {CITIES.slice(1).map((city) => (
          <line
            key={city.name}
            x1={HUB.x}
            y1={HUB.y}
            x2={city.x}
            y2={city.y}
            stroke="#F97316"
            strokeWidth={1}
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
        ))}

        {CITIES.map((city) => (
          <g key={city.name}>
            <circle
              cx={city.x}
              cy={city.y}
              r={city.name === HUB.name ? 6 : 3}
              fill={city.name === HUB.name ? '#F97316' : '#94A3B8'}
            />
            <text
              x={city.x + 9}
              y={city.y + 4}
              fill="#94A3B8"
              fontSize={11}
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>

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
