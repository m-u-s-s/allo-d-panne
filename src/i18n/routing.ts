import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'nl', 'en'],
  defaultLocale: 'fr',
  // Sans ceci, next-intl negocie la langue via l'en-tete Accept-Language :
  // un visiteur avec un navigateur/OS regle en anglais (frequent meme chez
  // des francophones, ordinateurs professionnels...) atterrirait sur /en
  // des la racine. Le francais est la langue par defaut du marche cible
  // (Bruxelles) ; la racine doit y mener de facon deterministe, pas au gre
  // d'un en-tete HTTP. Le selecteur de langue reste le seul moyen explicite
  // de changer de langue.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
