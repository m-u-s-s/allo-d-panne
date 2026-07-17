import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'nl', 'en'],
  defaultLocale: 'fr',
  // La negociation Accept-Language (comportement par defaut de next-intl)
  // est deliberement conservee : l'entreprise est en peripherie bruxelloise
  // bilingue (Vilvoorde/Machelen neerlandophones a cote) et transporte des
  // vehicules dans toute l'Europe. Un visiteur flamand doit atterrir en
  // neerlandais, un client de transport allemand ou anglophone en anglais.
  // Le francais reste le fallback pour toute langue non servie. Ne pas
  // desactiver via localeDetection: false pour satisfaire un test — c'est
  // le test qui doit verifier la negociation, pas l'inverse.
});

export type Locale = (typeof routing.locales)[number];
