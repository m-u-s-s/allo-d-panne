export const SERVICE_IDS = [
  'towing',
  'battery',
  'tyre',
  'fuel',
  'unlock',
  'transport',
  'heavy',
  'accident',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type Service = {
  id: ServiceId;
  title: string;
  description: string;
};

export type SiteContent = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    transport: string;
    pricing: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    callCta: string;
    quoteCta: string;
    availability: string;
    posterAlt: string;
  };
  problem: {
    title: string;
    body: string;
  };
  services: readonly Service[];
  servicesSection: {
    title: string;
    subtitle: string;
  };
  proof: {
    title: string;
    approved: string;
    insured: string;
    available: string;
  };
  coverage: {
    title: string;
    emergency: {
      scope: 'brussels-region';
      title: string;
      body: string;
    };
    transport: {
      scope: 'europe';
      title: string;
      body: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    rangeLabel: string;
    perKmLabel: string;
    quoteLabel: string;
    disclaimer: string;
  };
  finalCta: {
    title: string;
    body: string;
    button: string;
  };
  transportPage: {
    title: string;
    intro: string;
    mapAlt: string;
    routesTitle: string;
    ctaTitle: string;
  };
  pricingPage: {
    title: string;
    intro: string;
  };
  contactPage: {
    title: string;
    intro: string;
    urgentTitle: string;
    urgentBody: string;
    formTitle: string;
    fields: {
      name: string;
      phone: string;
      email: string;
      service: string;
      location: string;
      message: string;
    };
    submit: string;
    success: string;
    /** Echec d'envoi SMTP — oriente vers le telephone. */
    error: string;
    /** Erreur de validation d'un champ — distincte d'un echec d'envoi. */
    invalidFields: string;
  };
  footer: {
    rights: string;
    legal: string;
    terms: string;
    privacy: string;
  };
  legal: {
    noticeTitle: string;
    termsTitle: string;
    privacyTitle: string;
    publisher: string;
    pendingTitle: string;
    pendingBody: string;
    privacyBody: string;
    termsBody: string;
    /** Libellés des champs en attente de confirmation (mentions légales). */
    pendingVatLabel: string;
    pendingAddressLabel: string;
    pendingMotorwayZoneLabel: string;
    /** Libellés du bloc éditeur (dl), ponctuation finale incluse. */
    publisherNameLabel: string;
    publisherPhoneLabel: string;
    publisherEmailLabel: string;
    publisherVatLabel: string;
    publisherAddressLabel: string;
  };
};
