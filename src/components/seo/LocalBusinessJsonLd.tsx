import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { allCommuneNames } from '@/content/communes';
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
const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * Autres graphies du nom, fautes de frappe courantes comprises. Elles
 * partent dans `alternateName` — le champ prevu pour ca — et nulle part
 * dans le texte visible.
 */
const BRAND_VARIANTS = [
  'Allo Dépannage',
  'Allo-Depannage',
  'Allo Depannage',
  'Allo-Dépanage',
  'Allo Depanage',
  'Alo Dépannage',
  'Alo-Depannage',
  'Alo Depannage',
  'Allo Dépannage Bruxelles',
  'Allo Depannage Brussel',
] as const;

export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    // DEUX types : l'activite est un metier de l'automobile ET un service
    // d'urgence. Les deux sont des sous-types de LocalBusiness, un moteur
    // peut donc rattacher l'entreprise aux deux intentions de recherche
    // (« garage / depannage » et « urgence 24h/24 »).
    '@type': ['AutoRepair', 'EmergencyService'],
    // Ancre d'entite : toutes les pages parlent de la MEME entreprise.
    // Sans @id stable, chaque page peut etre lue comme un commerce
    // different.
    '@id': `${SITE_URL}/#business`,
    name: company.displayName,
    /*
     * Les graphies que le public tape reellement — trait d'union ou non,
     * accent ou non, et les fautes courantes (« depanage », « alo »).
     * C'est ICI que ces variantes servent a quelque chose : un champ
     * machine-lisible prevu pour les autres noms d'une entite, lu par les
     * moteurs, invisible pour le visiteur. Les mettre dans le texte
     * visible ferait l'inverse : un site qui ecrit mal son propre metier
     * perd la confiance qu'il essaie de gagner.
     */
    alternateName: BRAND_VARIANTS,
    url: `${SITE_URL}/${locale}`,
    telephone: PHONE_E164,
    description: c.meta.description,
    image: `${SITE_URL}/og-cover.webp`,
    logo: `${SITE_URL}/og-cover.webp`,
    priceRange: `€${company.pricing.minEur}-€${company.pricing.maxEur}`,
    currenciesAccepted: 'EUR',
    /* Les trois langues reellement servies par le site. */
    knowsLanguage: ['fr-BE', 'nl-BE', 'en'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'emergency',
      telephone: PHONE_E164,
      availableLanguage: ['French', 'Dutch', 'English'],
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAYS,
        opens: '00:00',
        closes: '23:59',
      },
    },
    /*
     * La region ET ses 19 communes. La region seule laisse un moteur
     * deviner la couverture commune par commune ; les nommer est la
     * meme promesse, en explicite — et c'est ce que tape un habitant
     * (« depannage Schaerbeek »). Rien n'est ajoute au-dela de ce que le
     * site promet deja : la zone d'URGENCE, pas le transport europeen.
     */
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: 'Brussels-Capital Region',
      },
      ...allCommuneNames().map((name) => ({ '@type': 'City', name })),
    ],
    /* Le catalogue reel, dans la langue de la page. */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: c.servicesSection.title,
      itemListElement: c.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.description,
        },
      })),
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS,
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
