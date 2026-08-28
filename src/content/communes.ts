import type { Locale } from '@/i18n/routing';

/**
 * Les 19 communes de la Region de Bruxelles-Capitale, dans leurs deux
 * graphies officielles.
 *
 * SOURCE UNIQUE, deliberement : la meme liste sert le texte visible de la
 * page /zones et le `areaServed` du schema.org. Deux copies divergeraient —
 * et une zone promise a un moteur mais absente de la page (ou l'inverse)
 * est exactement le genre d'ecart qui se paie en referencement local.
 *
 * Ce n'est PAS une promesse nouvelle : company.emergencyScope vaut deja
 * 'brussels-region'. On explicite ce que le site dit depuis toujours.
 */
export const COMMUNES: ReadonlyArray<{ fr: string; nl: string }> = [
  { fr: 'Anderlecht', nl: 'Anderlecht' },
  { fr: 'Auderghem', nl: 'Oudergem' },
  { fr: 'Berchem-Sainte-Agathe', nl: 'Sint-Agatha-Berchem' },
  { fr: 'Bruxelles-Ville', nl: 'Brussel-Stad' },
  { fr: 'Etterbeek', nl: 'Etterbeek' },
  { fr: 'Evere', nl: 'Evere' },
  { fr: 'Forest', nl: 'Vorst' },
  { fr: 'Ganshoren', nl: 'Ganshoren' },
  { fr: 'Ixelles', nl: 'Elsene' },
  { fr: 'Jette', nl: 'Jette' },
  { fr: 'Koekelberg', nl: 'Koekelberg' },
  { fr: 'Molenbeek-Saint-Jean', nl: 'Sint-Jans-Molenbeek' },
  { fr: 'Saint-Gilles', nl: 'Sint-Gillis' },
  { fr: 'Saint-Josse-ten-Noode', nl: 'Sint-Joost-ten-Node' },
  { fr: 'Schaerbeek', nl: 'Schaarbeek' },
  { fr: 'Uccle', nl: 'Ukkel' },
  { fr: 'Watermael-Boitsfort', nl: 'Watermaal-Bosvoorde' },
  { fr: 'Woluwe-Saint-Lambert', nl: 'Sint-Lambrechts-Woluwe' },
  { fr: 'Woluwe-Saint-Pierre', nl: 'Sint-Pieters-Woluwe' },
] as const;

/**
 * Le nom a afficher dans la langue de la page. L'anglais garde la forme
 * francaise : c'est celle qu'un anglophone lit sur les panneaux et tape
 * dans une recherche (« Ixelles », pas « Elsene » ni une traduction).
 */
export function communeName(
  commune: { fr: string; nl: string },
  locale: Locale,
): string {
  return locale === 'nl' ? commune.nl : commune.fr;
}

/** Les deux graphies, sans doublon — pour le `areaServed` du schema.org. */
export function allCommuneNames(): string[] {
  const names = new Set<string>();
  for (const c of COMMUNES) {
    names.add(c.fr);
    names.add(c.nl);
  }
  return [...names];
}
