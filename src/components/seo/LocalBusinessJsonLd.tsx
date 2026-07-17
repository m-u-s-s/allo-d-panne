import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import type { Locale } from '@/i18n/routing';
import { PHONE_E164 } from '@/lib/phone';
import { SITE_URL } from '@/lib/seo';

/**
 * Une adresse ou une TVA inventee dans un schema.org est pire qu'absente :
 * c'est structure, machine-lisible, et les moteurs la croient sur parole.
 * Les champs todo ne sont donc simplement pas emis.
 *
 * areaServed decrit la zone d'URGENCE (Bruxelles), pas le transport : le
 * schema decrit le service local, et promettre l'Europe entière ici serait
 * trompeur pour un moteur de recherche local.
 */
export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: company.displayName,
    url: `${SITE_URL}/${locale}`,
    telephone: PHONE_E164,
    description: c.meta.description,
    priceRange: `€${company.pricing.minEur}-€${company.pricing.maxEur}`,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Brussels-Capital Region',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
  };

  if (isResolved(company.email)) {
    data.email = company.email.value;
  }

  if (isResolved(company.address)) {
    const a = company.address.value;
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: `${a.street} ${a.number}`,
      postalCode: a.postalCode,
      addressLocality: a.city,
      addressCountry: a.country,
    };
  }

  if (isResolved(company.vat)) {
    data.vatID = company.vat.value;
  }

  return (
    <script
      type="application/ld+json"
      // Contenu statique issu de notre propre code, jamais d'entree
      // utilisateur : pas de vecteur d'injection ici.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
