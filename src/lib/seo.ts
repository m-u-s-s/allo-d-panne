import { routing } from '@/i18n/routing';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alb-depannage.com';

/**
 * hreflang pour les trois langues + x-default vers le francais.
 * Sans x-default, Google choisit lui-meme quelle version servir aux
 * visiteurs dont la langue ne correspond a aucune des notres.
 */
export function alternatesFor(path: string) {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${SITE_URL}/${locale}${clean}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${clean}`;

  return {
    canonical: `${SITE_URL}/${routing.defaultLocale}${clean}`,
    languages,
  };
}

export const ROUTES = [
  '/',
  '/transport-europe',
  '/tarifs',
  '/contact',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
] as const;
