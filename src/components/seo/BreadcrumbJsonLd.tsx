import { getContent, type SiteContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/seo';

/**
 * Fil d'Ariane machine-lisible (schema.org BreadcrumbList).
 *
 * Ce que ca change concretement : dans un resultat de recherche, Google
 * remplace l'URL brute (« allo-depannage.com › fr › tarifs ») par le
 * chemin nomme (« Accueil › Tarifs »). C'est la meme page, mais le
 * resultat devient lisible — et il est lisible DANS LA LANGUE de la page,
 * ce qu'une URL ne sait pas faire ici puisque les segments restent
 * francais dans les trois langues.
 *
 * L'accueil n'en emet pas : un fil d'Ariane a un seul maillon ne dit rien
 * et Google l'ignore.
 */
const LABELS: Record<string, (c: SiteContent) => string> = {
  '/services': (c) => c.servicesSection.title,
  '/zones': (c) => c.coverage.title,
  '/pourquoi': (c) => c.proof.title,
  '/transport-europe': (c) => c.nav.transport,
  '/tarifs': (c) => c.nav.pricing,
  '/contact': (c) => c.nav.contact,
  '/mentions-legales': (c) => c.legal.noticeTitle,
  '/cgv': (c) => c.legal.termsTitle,
  '/confidentialite': (c) => c.legal.privacyTitle,
};

export function BreadcrumbJsonLd({
  locale,
  path,
}: {
  locale: Locale;
  /** Chemin sans prefixe de langue, tel que le passe PageShell. */
  path: string;
}) {
  const label = LABELS[path];
  if (!label) return null;

  const c = getContent(locale);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: c.nav.home,
        item: `${SITE_URL}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: label(c),
        item: `${SITE_URL}/${locale}${path}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Contenu statique issu de notre propre code, jamais d'entree
      // utilisateur : pas de vecteur d'injection ici.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
