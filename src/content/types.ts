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

/**
 * Pages qui portent leur PROPRE titre et leur PROPRE description de
 * recherche. L'accueil n'est pas dans la liste : son couple vit dans
 * `meta`, qui sert aussi de valeur par defaut au layout et de description
 * au schema.org.
 */
export const SEO_PAGES = [
  'services',
  'zones',
  'why',
  'transport',
  'pricing',
  'contact',
  'legalNotice',
  'terms',
  'privacy',
] as const;

export type SeoPage = (typeof SEO_PAGES)[number];

export type SeoEntry = {
  /**
   * Titre de l'onglet et du resultat de recherche. Le layout y ajoute
   * « — Allo-Dépannage » (template Next) pour toute page qui n'est pas
   * l'accueil : viser 42 caracteres au plus, sinon Google tronque.
   */
  title: string;
  /**
   * Description affichee sous le lien dans les resultats. Elle ne
   * classe pas la page, elle decide du CLIC : verbe d'action, ville,
   * disponibilite, et le numero quand il tient. Google coupe vers 155 —
   * viser 158 caracteres au plus.
   */
  description: string;
};

export type SiteContent = {
  meta: {
    title: string;
    description: string;
  };
  /**
   * Titres et descriptions de recherche, page par page. Avant, chaque
   * page reutilisait un titre d'interface (« Ce qu'on fait ») et un
   * bout de copie comme description — trois pages legales partageaient
   * meme la description du site, ce que les moteurs comptent comme du
   * contenu duplique.
   */
  seo: Record<SeoPage, SeoEntry>;
  /**
   * Termes de recherche de la langue, VARIANTES ET FAUTES COMPRISES
   * (« depanage », « remorcage »…). Ils alimentent la balise keywords.
   * A savoir : Google l'ignore depuis 2009 et corrige lui-meme les
   * fautes de frappe — ce sont `alternateName` du schema.org et la
   * qualite des titres qui font le travail. Cette liste ne coute rien
   * et couvre les moteurs secondaires ; elle ne remplace rien.
   */
  searchTerms: string[];
  nav: {
    home: string;
    transport: string;
    pricing: string;
    contact: string;
    /** Nom accessible de la region <nav> principale du header. */
    primaryLabel: string;
    /** Nom accessible du panneau de menu mobile (landmark distinct). */
    menuLabel: string;
    /** Libelles du bouton hamburger selon son etat. */
    menuOpen: string;
    menuClose: string;
  };
  /** Nom accessible du selecteur de langue (nav dans le header). */
  localeSwitcher: {
    label: string;
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
    /**
     * Bloc « communes desservies » de la page /zones. Il rend VISIBLE ce
     * que le schema.org declare deja dans areaServed : un habitant
     * cherche « depannage Schaerbeek », pas « depannage Region de
     * Bruxelles-Capitale ». La liste elle-meme vit dans content/communes.ts
     * (source unique partagee avec le schema.org).
     */
    communesTitle: string;
    communesBody: string;
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
    /**
     * Connecteurs du figcaption sr-only d'EuropeRadar : "{routesCaptionFrom} Bruxelles
     * {routesCaptionTo} Paris, Amsterdam...". Les noms de villes restent
     * tels quels (exonymes hors perimetre) ; seuls ces connecteurs sont
     * localises pour eviter un figcaption moitie francais moitie NL/EN.
     */
    routesCaptionFrom: string;
    routesCaptionTo: string;
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
    /** Nom accessible de la region <nav> "liens du site" du footer. */
    navLabel: string;
    /** Nom accessible de la region <nav> "liens legaux" du footer. */
    legalNavLabel: string;
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
  /** FAQ visible (page tarifs) + source du schema.org FAQPage. */
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
};
