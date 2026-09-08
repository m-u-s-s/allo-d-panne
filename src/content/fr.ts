import type { SiteContent } from './types';

export const fr: SiteContent = {
  meta: {
    title: 'Allo-Dépannage — Dépannage et remorquage 24h/24 à Bruxelles',
    // "Agréé et assuré" volontairement absent : cette phrase de la
    // description nourrit schema.org (LocalBusinessJsonLd.description) et
    // les extraits de recherche, des surfaces machine-lisibles. L'agrement
    // autoroutier belge est concede par zone (voir company.motorwayZone) —
    // la mention non qualifiee y est trompeuse. Le reste de la description
    // reste factuel et utile ; ProofSection porte la version humaine,
    // volontairement laissee telle quelle (voir son commentaire).
    description:
      "Dépannage et remorquage 24h/24, 7j/7 à Bruxelles et en périphérie : batterie, crevaison, panne de carburant, ouverture de véhicule. Appelez le 0467 78 64 56.",
  },
  seo: {
    services: {
      title: 'Dépannage et remorquage à Bruxelles',
      description:
        "Remorquage, batterie, crevaison, panne de carburant, ouverture de véhicule, poids lourds et véhicules accidentés : dépannage 24h/24 à Bruxelles.",
    },
    zones: {
      title: 'Zones d’intervention à Bruxelles',
      description:
        "Dépannage d’urgence dans les 19 communes de Bruxelles et en périphérie, 24h/24. Transport de véhicule partout en Europe. Un appel : 0467 78 64 56.",
    },
    why: {
      title: 'Dépanneur agréé et assuré 24h/24',
      description:
        "Entreprise agréée, intervention assurée, joignable jour et nuit, week-ends et jours fériés compris : pourquoi confier votre véhicule à Allo-Dépannage.",
    },
    transport: {
      title: 'Transport de véhicule en Europe',
      description:
        "Transport de voiture, de véhicule de collection ou d’utilitaire au départ de Bruxelles vers Paris, Amsterdam, Berlin, Milan, Madrid et toute l’Europe.",
    },
    pricing: {
      title: 'Tarifs dépannage dès 50 € à Bruxelles',
      description:
        "Dépannage à Bruxelles de 50 € à 250 €, + 2 € par kilomètre hors Bruxelles, transport sur devis. Prix annoncés à l’avance, confirmés avant déplacement.",
    },
    contact: {
      title: 'Contact et devis dépannage',
      description:
        "Une panne, un accident, un véhicule à transporter ? Appelez le 0467 78 64 56, 24h/24, ou demandez un devis en ligne. Bruxelles et périphérie.",
    },
    legalNotice: {
      title: 'Mentions légales',
      description:
        "Mentions légales d’Allo-Dépannage : éditeur du site, coordonnées de contact et informations en attente de confirmation par l’entreprise.",
    },
    terms: {
      title: 'Conditions générales',
      description:
        "Conditions générales d’Allo-Dépannage : formation du prix, supplément kilométrique hors Bruxelles et confirmation du tarif avant tout déplacement.",
    },
    privacy: {
      title: 'Politique de confidentialité',
      description:
        "Politique de confidentialité d’Allo-Dépannage : aucun cookie de mesure d’audience, aucun suivi publicitaire, données du formulaire jamais cédées.",
    },
  },
  /*
   * Variantes de recherche du francais, FAUTES COMPRISES (« depanage »,
   * « remorcage », « alo depannage ») : c’est la demande client. Elles
   * restent HORS du texte visible — une faute affichee coute la
   * crédibilité, et Google corrige déjà les fautes de frappe tout seul.
   */
  searchTerms: [
    'dépannage voiture Bruxelles',
    'dépanneur Bruxelles',
    'dépanneuse Bruxelles',
    'remorquage Bruxelles',
    'remorquage voiture 24h/24',
    'dépannage auto 24h/24 Bruxelles',
    'assistance dépannage autoroute',
    'panne de batterie Bruxelles',
    'crevaison dépannage Bruxelles',
    'panne de carburant',
    'ouverture de véhicule Bruxelles',
    'clés enfermées dans la voiture',
    'enlèvement véhicule accidenté',
    'dépannage poids lourd Bruxelles',
    'transport de véhicule Europe',
    'rapatriement de véhicule',
    'depannage bruxelles',
    'depanage bruxelles',
    'dépanage bruxelles',
    'depannage voiture bruxelle',
    'depanneur bruxelles',
    'depaneur bruxelles',
    'depanneuse bruxelles',
    'depaneuse bruxelles',
    'remorcage bruxelles',
    'remorquage bruxelle',
    'epannage voiture',
    'allo depannage',
    'allo depanage',
    'alo depannage',
    'allo dépanage bruxelles',
    'allo-depannage bruxelles',
  ],
  nav: {
    home: 'Accueil',
    transport: 'Transport Europe',
    pricing: 'Tarifs',
    contact: 'Contact',
    primaryLabel: 'Principale',
    menuLabel: 'Menu',
    menuOpen: 'Ouvrir le menu',
    menuClose: 'Fermer le menu',
  },
  localeSwitcher: {
    label: 'Langue',
  },
  hero: {
    eyebrow: 'Disponible 24h/24, 7j/7',
    title: 'En panne ? On arrive.',
    subtitle:
      'Dépannage et remorquage à Bruxelles et en périphérie. Un appel suffit — on vous sort de là.',
    callCta: 'Appeler maintenant',
    quoteCta: 'Demander un devis',
    availability: 'Nuit, week-end et jours fériés compris',
    posterAlt:
      "Route mouillée de nuit éclairée par le gyrophare ambre d’une dépanneuse",
  },
  problem: {
    title: 'Personne ne prévoit de tomber en panne',
    body: "Batterie morte un lundi matin, pneu crevé sur le ring, clés enfermées dans la voiture. Ça arrive toujours au pire moment. Vous appelez, on vient — de jour comme de nuit, week-end compris.",
  },
  servicesSection: {
    title: 'Ce qu’on fait',
    subtitle: 'Véhicules légers et poids lourds.',
  },
  services: [
    {
      id: 'towing',
      title: 'Remorquage',
      description:
        'Votre véhicule vers le garage de votre choix, ou vers le nôtre.',
    },
    {
      id: 'battery',
      title: 'Batterie',
      description: 'Démarrage sur place et remplacement si nécessaire.',
    },
    {
      id: 'tyre',
      title: 'Crevaison',
      description: 'Roue de secours montée sur place, ou remorquage.',
    },
    {
      id: 'fuel',
      title: 'Panne de carburant',
      description: 'Livraison sur place, essence ou diesel.',
    },
    {
      id: 'unlock',
      title: 'Ouverture de véhicule',
      description: 'Clés enfermées à l’intérieur ? On ouvre sans casse.',
    },
    {
      id: 'transport',
      title: 'Transport de véhicule',
      description:
        "Transport longue distance dans toute l’Europe, sur devis.",
    },
    {
      id: 'heavy',
      title: 'VL et poids lourds',
      description: 'Équipement adapté aux véhicules lourds.',
    },
    {
      id: 'accident',
      title: 'Véhicule accidenté',
      description: 'Enlèvement et prise en charge après accident.',
    },
  ],
  proof: {
    title: 'Pourquoi nous faire confiance',
    approved: 'Entreprise agréée',
    insured: 'Intervention assurée',
    available: 'Joignable 24h/24, 7j/7',
  },
  coverage: {
    title: 'Où nous intervenons',
    communesTitle: 'Les 19 communes de Bruxelles',
    communesBody:
      'Nos dépanneuses interviennent dans toute la Région de Bruxelles-Capitale et sa périphérie immédiate, de jour comme de nuit.',
    emergency: {
      scope: 'brussels-region',
      title: 'Urgence — Bruxelles et périphérie',
      body: "Pour un dépannage d’urgence, nous intervenons à Bruxelles et dans sa périphérie. C’est la zone où nous pouvons arriver vite — et vite, c’est tout ce qui compte quand vous êtes immobilisé.",
    },
    transport: {
      scope: 'europe',
      title: "Transport — toute l’Europe",
      body: "Pour le transport de véhicule, aucune limite de distance : nous livrons partout en Europe, sur devis.",
    },
  },
  pricing: {
    title: 'Nos tarifs',
    subtitle: 'Annoncés à l’avance. Pas de surprise sur la facture.',
    rangeLabel: 'Intervention à Bruxelles',
    perKmLabel: 'Hors Bruxelles',
    quoteLabel: 'Transport et cas particuliers',
    disclaimer:
      'Le prix final dépend du type d’intervention et de la distance. Il vous est confirmé avant tout déplacement.',
  },
  finalCta: {
    title: 'Immobilisé ? Ne restez pas là.',
    body: 'Un appel, et on est en route.',
    button: 'Appeler maintenant',
  },
  transportPage: {
    title: "Transport de véhicule dans toute l’Europe",
    intro:
      "Voiture achetée à l’étranger, véhicule de collection, engin à déplacer, flotte à repositionner : nous transportons partout en Europe. Chaque trajet fait l’objet d’un devis, calculé sur la distance et le type de véhicule.",
    mapAlt:
      "Carte de l’Europe montrant les principaux trajets de transport au départ de Bruxelles",
    routesTitle: 'Nos trajets fréquents',
    ctaTitle: 'Un véhicule à déplacer ?',
    routesCaptionFrom: 'Trajets au départ de',
    routesCaptionTo: 'vers',
  },
  pricingPage: {
    title: 'Tarifs',
    intro:
      "Nos prix sont annoncés à l’avance et confirmés avant tout déplacement. Pas de mauvaise surprise sur la facture.",
  },
  contactPage: {
    title: 'Nous contacter',
    intro: "Pour une urgence, appelez — c’est toujours plus rapide. Pour un devis de transport ou une question, le formulaire suffit.",
    urgentTitle: 'C’est urgent ?',
    urgentBody: 'Ne remplissez pas le formulaire. Appelez, on décroche.',
    formTitle: 'Demander un devis',
    fields: {
      name: 'Votre nom',
      phone: 'Votre téléphone',
      email: 'Votre e-mail',
      service: 'Type d’intervention',
      location: 'Où êtes-vous ?',
      message: 'Détails',
    },
    submit: 'Envoyer la demande',
    success: 'Demande reçue. Nous vous rappelons rapidement.',
    error: 'L’envoi a échoué. Appelez-nous, c’est plus sûr.',
    invalidFields: 'Vérifiez les champs du formulaire.',
  },
  footer: {
    rights: 'Tous droits réservés.',
    legal: 'Mentions légales',
    terms: 'Conditions générales',
    privacy: 'Confidentialité',
    navLabel: 'Navigation',
    legalNavLabel: 'Légal',
  },
  legal: {
    noticeTitle: 'Mentions légales',
    termsTitle: 'Conditions générales',
    privacyTitle: 'Politique de confidentialité',
    publisher: 'Éditeur du site',
    pendingTitle: 'Informations en attente de confirmation',
    pendingBody:
      "Cette page est incomplète. Les informations ci-dessous doivent être confirmées par l’entreprise avant la mise en ligne publique du site.",
    privacyBody:
      "Ce site ne dépose aucun cookie de mesure d’audience et ne pratique aucun suivi publicitaire. Les données transmises via le formulaire de devis (nom, téléphone, e-mail, localisation) servent uniquement à traiter votre demande et ne sont jamais cédées à des tiers. Vous pouvez demander leur suppression par e-mail à tout moment.",
    termsBody:
      "Le prix final d’une intervention dépend du type de dépannage et de la distance parcourue. Il est confirmé au client avant tout déplacement. Toute intervention hors de Bruxelles fait l’objet d’un supplément kilométrique.",
    pendingVatLabel: 'Numéro de TVA',
    pendingAddressLabel: 'Adresse du siège',
    pendingMotorwayZoneLabel: 'Zone d’agrément autoroute',
    publisherNameLabel: 'Nom : ',
    publisherPhoneLabel: 'Téléphone : ',
    publisherEmailLabel: 'E-mail : ',
    publisherVatLabel: 'TVA : ',
    publisherAddressLabel: 'Siège : ',
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Combien coûte un dépannage à Bruxelles ?',
        a: 'Entre 50 € et 250 € selon l’intervention, plus 2 € par kilomètre hors de Bruxelles. Le prix est annoncé à l’avance et confirmé avant tout déplacement — aucune surprise à l’arrivée.',
      },
      {
        q: 'Intervenez-vous la nuit, le week-end et les jours fériés ?',
        a: 'Oui. Allo-Dépannage est joignable 24h/24 et 7j/7, week-ends et jours fériés compris, au 0467 78 64 56.',
      },
      {
        q: 'Dans quelles communes intervenez-vous ?',
        a: 'Dans les 19 communes de la Région de Bruxelles-Capitale et leur périphérie immédiate, de jour comme de nuit.',
      },
      {
        q: 'Transportez-vous des véhicules hors de Belgique ?',
        a: 'Oui : transport de voitures, véhicules de collection et utilitaires au départ de Bruxelles vers Paris, Amsterdam, Berlin, Milan, Madrid et toute l’Europe, sur devis.',
      },
      {
        q: 'Êtes-vous une entreprise agréée ?',
        a: 'Oui, Allo-Dépannage est une entreprise agréée et chaque intervention est assurée.',
      },
      {
        q: 'En quelles langues puis-je vous appeler ?',
        a: 'En français, en néerlandais et en anglais, à toute heure.',
      },
    ],
  },
};
