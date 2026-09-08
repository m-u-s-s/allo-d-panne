import type { SiteContent } from './types';

export const nl: SiteContent = {
  meta: {
    title: 'Allo-Dépannage — Pechverhelping en takeldienst 24/7 in Brussel',
    // "Erkend en verzekerd" bewust weggelaten : deze zin uit de
    // beschrijving voedt schema.org (LocalBusinessJsonLd.description) en
    // zoekresultaten, machineleesbare oppervlakken. De Belgische
    // snelwegerkenning is per zone toegekend (zie company.motorwayZone) —
    // de ongenuanceerde vermelding is daar misleidend. De rest van de
    // beschrijving blijft feitelijk en nuttig ; ProofSection draagt de
    // menselijke versie, bewust ongewijzigd gelaten (zie het commentaar
    // daar).
    description:
      'Pechverhelping en takeldienst 24/7 in Brussel en omgeving: batterij, lekke band, brandstofpech, voertuig openen. Bel 0467 78 64 56.',
  },
  seo: {
    services: {
      title: 'Pechverhelping en takelen in Brussel',
      description:
        'Takelen, batterij, lekke band, brandstofpech, voertuig openen, vrachtwagens en ongevalvoertuigen: pechverhelping 24/7 in Brussel en omgeving.',
    },
    zones: {
      title: 'Interventiezone Brussel en de Rand',
      description:
        'Dringende pechverhelping in de 19 gemeenten van Brussel en in de Rand, 24/7. Voertuigtransport in heel Europa. Eén telefoontje: 0467 78 64 56.',
    },
    why: {
      title: 'Erkende en verzekerde takeldienst',
      description:
        'Erkend bedrijf, verzekerde interventie, dag en nacht bereikbaar, ook in het weekend en op feestdagen: waarom u uw voertuig aan ons toevertrouwt.',
    },
    transport: {
      title: 'Voertuigtransport in heel Europa',
      description:
        'Transport van uw auto, oldtimer of bestelwagen vanuit Brussel naar Parijs, Amsterdam, Berlijn, Milaan, Madrid en heel Europa. Prijs op aanvraag.',
    },
    pricing: {
      title: 'Tarieven takelen vanaf € 50',
      description:
        'Interventie in Brussel van € 50 tot € 250, + € 2 per kilometer buiten Brussel, transport op aanvraag. Prijzen vooraf aangekondigd en bevestigd.',
    },
    contact: {
      title: 'Contact en offerte pechverhelping',
      description:
        'Pech, een ongeval of een voertuig te verplaatsen? Bel 0467 78 64 56, 24/7, of vraag online een offerte aan. Brussel en omgeving.',
    },
    legalNotice: {
      title: 'Wettelijke vermeldingen',
      description:
        'Wettelijke vermeldingen van Allo-Dépannage: uitgever van de website, contactgegevens en gegevens die nog door het bedrijf bevestigd worden.',
    },
    terms: {
      title: 'Algemene voorwaarden',
      description:
        'Algemene voorwaarden van Allo-Dépannage: hoe de prijs tot stand komt, de kilometertoeslag buiten Brussel en de bevestiging vóór elke verplaatsing.',
    },
    privacy: {
      title: 'Privacybeleid',
      description:
        'Privacybeleid van Allo-Dépannage: geen analytische cookies, geen advertentietracking en formuliergegevens die nooit aan derden worden doorgegeven.',
    },
  },
  /* Zoektermen van het Nederlands, MET SCHRIJFFOUTEN (klantvraag). Zie
     het commentaar bij fr.searchTerms: ze blijven buiten de zichtbare
     tekst. */
  searchTerms: [
    'takeldienst Brussel',
    'pechverhelping Brussel',
    'takelwagen Brussel',
    'sleepdienst Brussel',
    'autopech Brussel',
    'takelen 24/7 Brussel',
    'batterij leeg hulp Brussel',
    'lekke band hulp Brussel',
    'voertuig openen sleutels binnen',
    'ongevalvoertuig berging',
    'vrachtwagen takelen Brussel',
    'voertuigtransport Europa',
    'auto transporteren naar het buitenland',
    'depannage brussel',
    'depanage brussel',
    'dépanage brussel',
    'takeldiens brussel',
    'takelwage brussel',
    'sleepdiens brussel',
    'pechverhelpin brussel',
    'allo depannage',
    'allo depanage',
    'alo depannage brussel',
  ],
  nav: {
    home: 'Home',
    transport: 'Transport Europa',
    pricing: 'Tarieven',
    contact: 'Contact',
    primaryLabel: 'Hoofdnavigatie',
    menuLabel: 'Menu',
    menuOpen: 'Menu openen',
    menuClose: 'Menu sluiten',
  },
  localeSwitcher: {
    label: 'Taal',
  },
  hero: {
    eyebrow: '24/7 bereikbaar',
    title: 'Pech? Wij komen eraan.',
    subtitle:
      'Pechverhelping en takeldienst in Brussel en omgeving. Eén telefoontje volstaat — wij halen u eruit.',
    callCta: 'Bel nu',
    quoteCta: 'Offerte aanvragen',
    availability: "Ook 's nachts, in het weekend en op feestdagen",
    posterAlt:
      'Natte weg bij nacht, verlicht door het oranje zwaailicht van een takelwagen',
  },
  problem: {
    title: 'Niemand plant pech in',
    body: 'Lege batterij op maandagochtend, lekke band op de ring, sleutels opgesloten in de auto. Het gebeurt altijd op het slechtste moment. U belt, wij komen — dag en nacht, weekend inbegrepen.',
  },
  servicesSection: {
    title: 'Wat wij doen',
    subtitle: 'Lichte voertuigen en vrachtwagens.',
  },
  services: [
    {
      id: 'towing',
      title: 'Takelen',
      description: 'Uw voertuig naar de garage van uw keuze, of naar de onze.',
    },
    {
      id: 'battery',
      title: 'Batterij',
      description: 'Starthulp ter plaatse en vervanging indien nodig.',
    },
    {
      id: 'tyre',
      title: 'Lekke band',
      description: 'Reservewiel ter plaatse gemonteerd, of takelen.',
    },
    {
      id: 'fuel',
      title: 'Brandstofpech',
      description: 'Levering ter plaatse, benzine of diesel.',
    },
    {
      id: 'unlock',
      title: 'Voertuig openen',
      description: 'Sleutels opgesloten? Wij openen zonder schade.',
    },
    {
      id: 'transport',
      title: 'Voertuigtransport',
      description: 'Langeafstandstransport in heel Europa, op aanvraag.',
    },
    {
      id: 'heavy',
      title: 'Lichte en zware voertuigen',
      description: 'Uitrusting geschikt voor zware voertuigen.',
    },
    {
      id: 'accident',
      title: 'Ongevalvoertuig',
      description: 'Berging en afhandeling na een ongeval.',
    },
  ],
  proof: {
    title: 'Waarom u op ons kunt vertrouwen',
    approved: 'Erkend bedrijf',
    insured: 'Verzekerde interventie',
    available: '24/7 bereikbaar',
  },
  coverage: {
    title: 'Waar wij actief zijn',
    communesTitle: 'De 19 Brusselse gemeenten',
    communesBody:
      'Onze takelwagens komen in het hele Brussels Hoofdstedelijk Gewest en de onmiddellijke Rand, dag en nacht.',
    emergency: {
      scope: 'brussels-region',
      title: 'Dringend — Brussel en omgeving',
      body: 'Voor dringende pechverhelping komen wij in Brussel en omgeving. Dat is de zone waar wij snel ter plaatse zijn — en snel is het enige wat telt als u stilstaat.',
    },
    transport: {
      scope: 'europe',
      title: 'Transport — heel Europa',
      body: 'Voor voertuigtransport geldt geen afstandsgrens: wij rijden tot overal in Europa, op aanvraag.',
    },
  },
  pricing: {
    title: 'Onze tarieven',
    subtitle: 'Vooraf aangekondigd. Geen verrassingen op de factuur.',
    rangeLabel: 'Interventie in Brussel',
    perKmLabel: 'Buiten Brussel',
    quoteLabel: 'Transport en bijzondere gevallen',
    disclaimer:
      'De eindprijs hangt af van het type interventie en de afstand. Die wordt bevestigd vóór elke verplaatsing.',
  },
  finalCta: {
    title: 'Staat u stil? Blijf daar niet staan.',
    body: 'Eén telefoontje en wij zijn onderweg.',
    button: 'Bel nu',
  },
  transportPage: {
    title: 'Voertuigtransport in heel Europa',
    intro:
      'Auto gekocht in het buitenland, oldtimer, machine te verplaatsen, vloot te herpositioneren: wij transporteren overal in Europa. Elk traject krijgt een offerte, berekend op afstand en voertuigtype.',
    mapAlt:
      'Kaart van Europa met de belangrijkste transporttrajecten vanuit Brussel',
    routesTitle: 'Onze frequente trajecten',
    ctaTitle: 'Een voertuig te verplaatsen?',
    routesCaptionFrom: 'Ritten vanuit',
    routesCaptionTo: 'naar',
  },
  pricingPage: {
    title: 'Tarieven',
    intro:
      'Onze prijzen worden vooraf aangekondigd en bevestigd vóór elke verplaatsing. Geen onaangename verrassingen op de factuur.',
  },
  contactPage: {
    title: 'Contact',
    intro: 'Bij een noodgeval kunt u beter bellen — dat gaat altijd sneller. Voor een transportofferte of een vraag volstaat het formulier.',
    urgentTitle: 'Is het dringend?',
    urgentBody: 'Vul het formulier niet in. Bel ons, wij nemen op.',
    formTitle: 'Offerte aanvragen',
    fields: {
      name: 'Uw naam',
      phone: 'Uw telefoon',
      email: 'Uw e-mail',
      service: 'Type interventie',
      location: 'Waar bent u?',
      message: 'Details',
    },
    submit: 'Aanvraag versturen',
    success: 'Aanvraag ontvangen. Wij bellen u snel terug.',
    error: 'Verzenden mislukt. Bel ons, dat is zekerder.',
    invalidFields: 'Controleer de velden van het formulier.',
  },
  footer: {
    rights: 'Alle rechten voorbehouden.',
    legal: 'Wettelijke vermeldingen',
    terms: 'Algemene voorwaarden',
    privacy: 'Privacy',
    navLabel: 'Navigatie',
    legalNavLabel: 'Juridisch',
  },
  legal: {
    noticeTitle: 'Wettelijke vermeldingen',
    termsTitle: 'Algemene voorwaarden',
    privacyTitle: 'Privacybeleid',
    publisher: 'Uitgever van de website',
    pendingTitle: 'Gegevens in afwachting van bevestiging',
    pendingBody:
      'Deze pagina is onvolledig. De onderstaande gegevens moeten door het bedrijf bevestigd worden vóór de publieke lancering van de website.',
    privacyBody:
      'Deze website plaatst geen analytische cookies en doet niet aan advertentietracking. De gegevens die via het offerteformulier worden verzonden (naam, telefoon, e-mail, locatie) dienen uitsluitend om uw aanvraag te behandelen en worden nooit aan derden doorgegeven. U kunt op elk moment per e-mail om verwijdering vragen.',
    termsBody:
      'De eindprijs van een interventie hangt af van het type pechverhelping en de afgelegde afstand. Die wordt aan de klant bevestigd vóór elke verplaatsing. Elke interventie buiten Brussel brengt een kilometertoeslag met zich mee.',
    pendingVatLabel: 'Btw-nummer',
    pendingAddressLabel: 'Adres van de maatschappelijke zetel',
    pendingMotorwayZoneLabel: 'Erkenningszone snelwegpechverhelping',
    publisherNameLabel: 'Naam: ',
    publisherPhoneLabel: 'Telefoon: ',
    publisherEmailLabel: 'E-mail: ',
    publisherVatLabel: 'Btw: ',
    publisherAddressLabel: 'Zetel: ',
  },
  faq: {
    title: 'Veelgestelde vragen',
    items: [
      {
        q: 'Hoeveel kost pechverhelping in Brussel?',
        a: 'Tussen 50 € en 250 € afhankelijk van de interventie, plus 2 € per kilometer buiten Brussel. De prijs wordt vooraf meegedeeld en bevestigd voor vertrek — geen verrassingen.',
      },
      {
        q: 'Komen jullie ook ’s nachts, in het weekend en op feestdagen?',
        a: 'Ja. Allo-Dépannage is 24/7 bereikbaar, ook in het weekend en op feestdagen, op 0467 78 64 56.',
      },
      {
        q: 'In welke gemeenten komen jullie?',
        a: 'In de 19 gemeenten van het Brussels Hoofdstedelijk Gewest en de onmiddellijke rand, dag en nacht.',
      },
      {
        q: 'Vervoeren jullie voertuigen buiten België?',
        a: 'Ja: transport van auto’s, oldtimers en bestelwagens vanuit Brussel naar Parijs, Amsterdam, Berlijn, Milaan, Madrid en heel Europa, op offerte.',
      },
      {
        q: 'Zijn jullie een erkend bedrijf?',
        a: 'Ja, Allo-Dépannage is een erkend bedrijf en elke interventie is verzekerd.',
      },
      {
        q: 'In welke talen kan ik jullie bellen?',
        a: 'In het Frans, Nederlands en Engels, op elk uur.',
      },
    ],
  },
};
