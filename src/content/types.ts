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
  footer: {
    rights: string;
    legal: string;
    terms: string;
    privacy: string;
  };
};
