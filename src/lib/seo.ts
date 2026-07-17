import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alb-depannage.com';

/**
 * hreflang pour les trois langues + x-default vers le francais, et un
 * canonical AUTO-REFERENT pour la langue effectivement rendue.
 *
 * Un canonical fige sur la langue par defaut dirait a Google que /nl/tarifs
 * est un doublon de /fr/tarifs et ne doit pas etre indexe separement — ce
 * qui jetterait l'indexation NL et EN alors que le site est trilingue par
 * design. Seul x-default reste sur le francais ; le canonical, lui, suit
 * la locale demandee.
 */
export function alternatesFor(path: string, locale: Locale) {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};

  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${clean}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${clean}`;

  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages,
  };
}

/**
 * Open Graph attend language_TERRITORY, pas une simple langue. La societe
 * est belge et son anglais cible un lectorat europeen (transport
 * Europe) plutot qu'americain, d'ou en_GB plutot que en_US.
 */
const OG_LOCALES: Record<Locale, string> = {
  fr: 'fr_BE',
  nl: 'nl_BE',
  en: 'en_GB',
};

export function ogLocaleFor(locale: Locale): string {
  return OG_LOCALES[locale];
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
