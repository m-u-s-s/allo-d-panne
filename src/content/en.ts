import type { SiteContent } from './types';

export const en: SiteContent = {
  meta: {
    title: 'ALB Depannage — 24/7 breakdown and towing in Brussels',
    // "Approved and insured" deliberately dropped: this closing sentence
    // of the description feeds schema.org (LocalBusinessJsonLd.description)
    // and search snippets — machine-readable surfaces. Belgian motorway
    // approval is zone-conceded (see company.motorwayZone), so the
    // unqualified claim is misleading there. The rest of the description
    // stays factual and useful; ProofSection carries the human-facing
    // version, deliberately left as-is (see its comment).
    description:
      'Car breakdown assistance and towing, 24/7, in Brussels and surroundings. Battery, flat tyre, out of fuel, vehicle unlocking. Vehicle transport across Europe.',
  },
  nav: {
    home: 'Home',
    transport: 'Europe transport',
    pricing: 'Pricing',
    contact: 'Contact',
    primaryLabel: 'Primary',
  },
  localeSwitcher: {
    label: 'Language',
  },
  hero: {
    eyebrow: 'Available 24/7',
    title: 'Broken down? We are on our way.',
    subtitle:
      'Breakdown assistance and towing in Brussels and surroundings. One call is all it takes.',
    callCta: 'Call now',
    quoteCta: 'Request a quote',
    availability: 'Nights, weekends and public holidays included',
    posterAlt:
      'Wet road at night lit by the amber beacon of a tow truck',
  },
  problem: {
    title: 'Nobody plans a breakdown',
    body: 'Dead battery on a Monday morning, flat tyre on the ring road, keys locked inside. It always happens at the worst moment. You call, we come — day or night, weekends included.',
  },
  servicesSection: {
    title: 'What we do',
    subtitle: 'Light vehicles and heavy goods vehicles.',
  },
  services: [
    {
      id: 'towing',
      title: 'Towing',
      description: 'Your vehicle to the garage of your choice, or to ours.',
    },
    {
      id: 'battery',
      title: 'Battery',
      description: 'Jump start on site, replacement if needed.',
    },
    {
      id: 'tyre',
      title: 'Flat tyre',
      description: 'Spare wheel fitted on site, or towing.',
    },
    {
      id: 'fuel',
      title: 'Out of fuel',
      description: 'Delivered on site, petrol or diesel.',
    },
    {
      id: 'unlock',
      title: 'Vehicle unlocking',
      description: 'Keys locked inside? We open it without damage.',
    },
    {
      id: 'transport',
      title: 'Vehicle transport',
      description: 'Long-distance transport across Europe, on quote.',
    },
    {
      id: 'heavy',
      title: 'Light and heavy vehicles',
      description: 'Equipment suited to heavy goods vehicles.',
    },
    {
      id: 'accident',
      title: 'Accident recovery',
      description: 'Removal and handling after an accident.',
    },
  ],
  proof: {
    title: 'Why trust us',
    approved: 'Approved company',
    insured: 'Insured intervention',
    available: 'Reachable 24/7',
  },
  coverage: {
    title: 'Where we operate',
    emergency: {
      scope: 'brussels-region',
      title: 'Emergency — Brussels and surroundings',
      body: 'For emergency breakdown assistance we cover Brussels and its surroundings. That is the area we can reach quickly — and quickly is all that matters when you are stranded.',
    },
    transport: {
      scope: 'europe',
      title: 'Transport — across Europe',
      body: 'For vehicle transport there is no distance limit: we deliver anywhere in Europe, on quote.',
    },
  },
  pricing: {
    title: 'Our pricing',
    subtitle: 'Stated upfront. No surprises on the invoice.',
    rangeLabel: 'Intervention in Brussels',
    perKmLabel: 'Outside Brussels',
    quoteLabel: 'Transport and special cases',
    disclaimer:
      'The final price depends on the type of intervention and the distance. It is confirmed before we set off.',
  },
  finalCta: {
    title: 'Stranded? Do not stay there.',
    body: 'One call and we are on our way.',
    button: 'Call now',
  },
  transportPage: {
    title: 'Vehicle transport across Europe',
    intro:
      'Car bought abroad, classic vehicle, machinery to move, fleet to reposition: we transport anywhere in Europe. Every trip is quoted, based on distance and vehicle type.',
    mapAlt:
      'Map of Europe showing the main transport routes from Brussels',
    routesTitle: 'Our frequent routes',
    ctaTitle: 'A vehicle to move?',
    routesCaptionFrom: 'Trips from',
    routesCaptionTo: 'to',
  },
  pricingPage: {
    title: 'Pricing',
    intro:
      'Our prices are stated upfront and confirmed before we set off. No unpleasant surprises on the invoice.',
  },
  contactPage: {
    title: 'Contact us',
    intro: 'For an emergency, call — it is always faster. For a transport quote or a question, the form is enough.',
    urgentTitle: 'Is it urgent?',
    urgentBody: 'Do not fill in the form. Call us, we pick up.',
    formTitle: 'Request a quote',
    fields: {
      name: 'Your name',
      phone: 'Your phone',
      email: 'Your email',
      service: 'Type of intervention',
      location: 'Where are you?',
      message: 'Details',
    },
    submit: 'Send request',
    success: 'Request received. We will call you back shortly.',
    error: 'Sending failed. Call us, it is safer.',
    invalidFields: 'Please check the form fields.',
  },
  footer: {
    rights: 'All rights reserved.',
    legal: 'Legal notice',
    terms: 'Terms and conditions',
    privacy: 'Privacy',
    navLabel: 'Navigation',
    legalNavLabel: 'Legal',
  },
  legal: {
    noticeTitle: 'Legal notice',
    termsTitle: 'Terms and conditions',
    privacyTitle: 'Privacy policy',
    publisher: 'Website publisher',
    pendingTitle: 'Information pending confirmation',
    pendingBody:
      'This page is incomplete. The information below must be confirmed by the company before the website goes public.',
    privacyBody:
      'This website sets no analytics cookies and performs no advertising tracking. Data submitted through the quote form (name, phone, email, location) is used solely to handle your request and is never shared with third parties. You may request its deletion by email at any time.',
    termsBody:
      'The final price of an intervention depends on the type of assistance and the distance travelled. It is confirmed to the customer before any journey. Any intervention outside Brussels incurs a per-kilometre supplement.',
    pendingVatLabel: 'VAT number',
    pendingAddressLabel: 'Registered office address',
    pendingMotorwayZoneLabel: 'Motorway approval zone',
    publisherNameLabel: 'Name: ',
    publisherPhoneLabel: 'Phone: ',
    publisherEmailLabel: 'Email: ',
    publisherVatLabel: 'VAT: ',
    publisherAddressLabel: 'Registered office: ',
  },
};
