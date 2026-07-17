import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { isLegalComplete } from '@/content/company';
import { ROUTES, SITE_URL } from '@/lib/seo';

/**
 * Les mentions legales ne sont listees que si elles sont completes :
 * inutile d'inviter Google sur une page qu'on met nous-memes en noindex.
 * `isLegalComplete()` est la meme fonction que celle utilisee par la page
 * des mentions legales pour decider son `noindex` : une seule source de
 * verite, pas deux copies qui peuvent diverger.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const legalComplete = isLegalComplete();

  const routes = ROUTES.filter(
    (r) => r !== '/mentions-legales' || legalComplete,
  );

  return routes.flatMap((route) =>
    routing.locales.map((locale) => {
      const clean = route === '/' ? '' : route;
      return {
        url: `${SITE_URL}/${locale}${clean}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '/' ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE_URL}/${l}${clean}`]),
          ),
        },
      };
    }),
  );
}
