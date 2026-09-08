import type { SiteContent } from './types';

export const en: SiteContent = {
  meta: {
    title: 'Allo-Dépannage — 24/7 breakdown and towing in Brussels',
    // "Approved and insured" deliberately dropped: this closing sentence
    // of the description feeds schema.org (LocalBusinessJsonLd.description)
    // and search snippets — machine-readable surfaces. Belgian motorway
    // approval is zone-conceded (see company.motorwayZone), so the
    // unqualified claim is misleading there. The rest of the description
    // stays factual and useful; ProofSection carries the human-facing
    // version, deliberately left as-is (see its comment).
    description:
      'Breakdown assistance and towing 24/7 in Brussels and surroundings: battery, flat tyre, out of fuel, vehicle unlocking. Call 0467 78 64 56.',
  },
  seo: {
    services: {
      title: 'Breakdown assistance and towing',
      description:
        'Towing, battery, flat tyre, out of fuel, vehicle unlocking, heavy goods vehicles and accident recovery: breakdown assistance 24/7 in Brussels.',
    },
    zones: {
      title: 'Service area: Brussels and around',
      description:
        'Emergency breakdown assistance across the 19 Brussels communes and the surrounding area, 24/7. Vehicle transport across Europe, priced on request.',
    },
    why: {
      title: 'Approved and insured tow service',
      description:
        'Approved company, insured call-outs, reachable day and night, weekends and public holidays included: why drivers in Brussels call Allo-Dépannage.',
    },
    transport: {
      title: 'Vehicle transport across Europe',
      description:
        'Transport of your car, classic vehicle or van from Brussels to Paris, Amsterdam, Berlin, Milan, Madrid and anywhere in Europe. Priced on request.',
    },
    pricing: {
      title: 'Towing prices from €50 in Brussels',
      description:
        'Call-out in Brussels from €50 to €250, plus €2 per kilometre outside Brussels, transport priced on request. Prices stated upfront and confirmed.',
    },
    contact: {
      title: 'Contact and breakdown quote',
      description:
        'Broken down, in an accident, or a vehicle to move? Call 0467 78 64 56, 24/7, or request a quote online. Brussels and surroundings.',
    },
    legalNotice: {
      title: 'Legal notice',
      description:
        'Legal notice for Allo-Dépannage: website publisher, contact details and the information still pending confirmation by the company.',
    },
    terms: {
      title: 'Terms and conditions',
      description:
        'Terms and conditions for Allo-Dépannage: how the price is set, the per-kilometre supplement outside Brussels and confirmation before any journey.',
    },
    privacy: {
      title: 'Privacy policy',
      description:
        'Privacy policy for Allo-Dépannage: no analytics cookies, no advertising tracking, and form data that is never shared with third parties.',
    },
  },
  /* English search terms, MISSPELLINGS INCLUDED (client request). See the
     comment on fr.searchTerms: they stay out of the visible copy. */
  searchTerms: [
    'towing Brussels',
    'tow truck Brussels',
    'breakdown assistance Brussels',
    'car recovery Brussels',
    'roadside assistance Brussels',
    '24/7 towing Belgium',
    'flat battery help Brussels',
    'flat tyre assistance Brussels',
    'car unlocking service Brussels',
    'accident recovery Brussels',
    'heavy goods vehicle towing',
    'vehicle transport Europe',
    'car shipping from Belgium',
    'depannage brussels',
    'depanage brussels',
    'towing bruxelles',
    'tow truck brussel',
    'breakdown assistence brussels',
    'car recovry brussels',
    'allo depannage',
    'allo depanage',
    'alo depannage brussels',
  ],
  nav: {
    home: 'Home',
    transport: 'Europe transport',
    pricing: 'Pricing',
    contact: 'Contact',
    primaryLabel: 'Primary',
    menuLabel: 'Menu',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },
  localeSwitcher: {
    label: 'Language',
  },
  hero: {
    eyebrow: 'Available 24/7',
    title: 'Broken down? We are on our way.',
    subtitle:
      'Breakdown assistance and towing in Brussels and surroundings. One call is all it takes — we will get you out of there.',
    callCta: 'Call now',
    quoteCta: 'Request a quote',
    availability: 'Nights, weekends and public holidays included',
    posterAlt:
      'Wet road at night lit by the amber beacon of a tow truck',
  },
  problem: {
    title: 'Nobody plans a breakdown',
    body: 'Dead battery on a Monday morning, flat tyre on the ring road, keys locked inside. It always happens at the worst possible moment. You call, we come — day or night, weekends included.',
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
      description: 'Delivery on site, petrol or diesel.',
    },
    {
      id: 'unlock',
      title: 'Vehicle unlocking',
      description: 'Keys locked inside? We open the car without damage.',
    },
    {
      id: 'transport',
      title: 'Vehicle transport',
      description: 'Long-distance transport across Europe, priced on request.',
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
    insured: 'Insured call-outs',
    available: 'Reachable 24/7',
  },
  coverage: {
    title: 'Where we operate',
    communesTitle: 'The 19 Brussels communes',
    communesBody:
      'Our tow trucks cover the whole Brussels-Capital Region and its immediate outskirts, day and night.',
    emergency: {
      scope: 'brussels-region',
      title: 'Emergency — Brussels and surroundings',
      body: 'For emergency breakdown assistance we cover Brussels and its surroundings. That is the area we can reach quickly — and quickly is all that matters when you are stranded.',
    },
    transport: {
      scope: 'europe',
      title: 'Transport — across Europe',
      body: 'For vehicle transport there is no distance limit: we transport anywhere in Europe, priced on request.',
    },
  },
  pricing: {
    title: 'Our pricing',
    subtitle: 'Stated upfront. No surprises on the invoice.',
    rangeLabel: 'Call-out in Brussels',
    perKmLabel: 'Outside Brussels',
    quoteLabel: 'Transport and special cases',
    disclaimer:
      'The final price depends on the type of call-out and the distance. It is confirmed before we set off.',
  },
  finalCta: {
    title: 'Stranded? Do not wait there.',
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
    urgentBody: 'Do not fill in the form. Call us — we answer.',
    formTitle: 'Request a quote',
    fields: {
      name: 'Your name',
      phone: 'Your phone',
      email: 'Your email',
      service: 'Type of service',
      location: 'Where are you?',
      message: 'Details',
    },
    submit: 'Send request',
    success: 'Request received. We will call you back shortly.',
    error: 'Sending failed. Call us — that is more reliable.',
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
      'The final price of a call-out depends on the type of assistance and the distance travelled. It is confirmed to the customer before any journey. Any call-out outside Brussels incurs a per-kilometre supplement.',
    pendingVatLabel: 'VAT number',
    pendingAddressLabel: 'Registered office address',
    pendingMotorwayZoneLabel: 'Motorway approval zone',
    publisherNameLabel: 'Name: ',
    publisherPhoneLabel: 'Phone: ',
    publisherEmailLabel: 'Email: ',
    publisherVatLabel: 'VAT: ',
    publisherAddressLabel: 'Registered office: ',
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'How much does roadside assistance cost in Brussels?',
        a: 'Between €50 and €250 depending on the job, plus €2 per kilometre outside Brussels. The price is quoted upfront and confirmed before we set off — no surprises.',
      },
      {
        q: 'Do you operate at night, on weekends and public holidays?',
        a: 'Yes. Allo-Dépannage is reachable 24/7, weekends and public holidays included, on 0467 78 64 56.',
      },
      {
        q: 'Which municipalities do you cover?',
        a: 'All 19 municipalities of the Brussels-Capital Region and the immediate outskirts, day and night.',
      },
      {
        q: 'Do you transport vehicles outside Belgium?',
        a: 'Yes: transport of cars, classic cars and vans from Brussels to Paris, Amsterdam, Berlin, Milan, Madrid and all of Europe, on quotation.',
      },
      {
        q: 'Are you an approved company?',
        a: 'Yes, Allo-Dépannage is an approved company and every intervention is insured.',
      },
      {
        q: 'Which languages can I call you in?',
        a: 'French, Dutch and English, at any hour.',
      },
    ],
  },
};
