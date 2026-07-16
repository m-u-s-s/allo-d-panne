import type { SiteContent } from './types';

export const fr: SiteContent = {
  meta: {
    title: 'ALB Dépannage — Dépannage et remorquage 24h/24 à Bruxelles',
    description:
      "Dépannage auto et remorquage 24h/24, 7j/7 à Bruxelles et en périphérie. Batterie, crevaison, panne de carburant, ouverture de véhicule. Transport de véhicule dans toute l'Europe. Agréé et assuré.",
  },
  nav: {
    home: 'Accueil',
    transport: 'Transport Europe',
    pricing: 'Tarifs',
    contact: 'Contact',
  },
  hero: {
    eyebrow: 'Disponible 24h/24, 7j/7',
    title: 'En panne ? On arrive.',
    subtitle:
      'Dépannage et remorquage à Bruxelles et en périphérie. Un appel suffit — on vous sort de là.',
    callCta: 'Appeler maintenant',
    quoteCta: 'Demander un devis',
    availability: 'Nuit, week-end et jours fériés compris',
    posterAlt:
      "Route mouillée de nuit éclairée par le gyrophare ambre d'une dépanneuse",
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
      description: 'Clés enfermées à l’intérieur ? On ouvre sans casse.',
    },
    {
      id: 'transport',
      title: 'Transport de véhicule',
      description:
        "Transport longue distance dans toute l'Europe, sur devis.",
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
    emergency: {
      scope: 'brussels-region',
      title: 'Urgence — Bruxelles et périphérie',
      body: "Pour un dépannage d'urgence, nous intervenons à Bruxelles et dans sa périphérie. C'est la zone où nous pouvons arriver vite — et vite, c'est tout ce qui compte quand vous êtes immobilisé.",
    },
    transport: {
      scope: 'europe',
      title: "Transport — toute l'Europe",
      body: "Pour le transport de véhicule, aucune limite de distance : nous livrons partout en Europe, sur devis.",
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
    title: 'Immobilisé ? Ne restez pas là.',
    body: 'Un appel, et on est en route.',
    button: 'Appeler maintenant',
  },
  footer: {
    rights: 'Tous droits réservés.',
    legal: 'Mentions légales',
    terms: 'Conditions générales',
    privacy: 'Confidentialité',
  },
};
