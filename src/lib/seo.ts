import type { SiteContent } from '@/content';
import { company } from '@/content/company';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://allo-depannage.com';

/** URL absolue d'une page pour une locale donnee — factorise entre alternatesFor et openGraphFor. */
function absoluteUrl(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return `${SITE_URL}/${locale}${clean}`;
}

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
  const languages: Record<string, string> = {};

  for (const l of routing.locales) {
    languages[l] = absoluteUrl(path, l);
  }
  languages['x-default'] = absoluteUrl(path, routing.defaultLocale);

  return {
    canonical: absoluteUrl(path, locale),
    languages,
  };
}

/**
 * openGraph complet (pas seulement `url`) pour une page donnee.
 *
 * Next.js ne fusionne PAS `openGraph` en profondeur entre layout et page :
 * des qu'une page definit son propre `openGraph`, l'objet entier du layout
 * est remplace (voir la doc Next.js sur le merge des metadonnees). Un
 * `openGraph: { url }` isole sur la page ferait donc disparaitre
 * title/description/siteName/locale/type herites du layout — pire que le
 * bug qu'on corrige. D'ou cette fonction : meme raisonnement que le
 * fallback fige de layout.tsx (une valeur fausse est pire qu'absente), donc
 * chaque page emet un openGraph complet et auto-referent plutot que de
 * dependre d'un heritage partiel qui ne fonctionne pas pour cette cle.
 */
export function openGraphFor(c: SiteContent, path: string, locale: Locale) {
  return {
    title: c.meta.title,
    description: c.meta.description,
    url: absoluteUrl(path, locale),
    siteName: company.displayName,
    locale: ogLocaleFor(locale),
    type: 'website' as const,
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
  '/services',
  '/zones',
  '/pourquoi',
  '/transport-europe',
  '/tarifs',
  '/contact',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
] as const;
