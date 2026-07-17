import { PHONE_E164, PHONE_INTERNATIONAL, PHONE_NATIONAL } from '@/lib/phone';

/**
 * Un champ soit confirme par le client, soit explicitement en attente.
 *
 * La spec impose "aucune donnee inventee". Une regle dans un document se
 * perd ; un type la rend executable. Pour lire .value il faut passer par
 * isResolved(), donc afficher une TVA non confirmee devient une erreur
 * de compilation plutot qu'un oubli.
 */
export type Field<T> =
  | { status: 'resolved'; value: T }
  | { status: 'todo'; reason: string };

export const resolved = <T>(value: T): Field<T> => ({
  status: 'resolved',
  value,
});

/**
 * `reason` est une note interne pour l'equipe de developpement — visible
 * dans le source, jamais rendue au public. Certaines raisons recitent des
 * donnees fournies par le client qui sont elles-memes le probleme (TVA
 * erronee, adresse incomplete, pretention non verifiable) ; les publier,
 * meme pour signaler qu'elles clochent, reviendrait a les publier quand
 * meme. La page publique (mentions-legales) affiche uniquement les
 * libelles localises `pending*Label` de SiteContent — jamais `reason`.
 * `PendingDataNotice` n'accepte d'ailleurs plus de prop `reason` du tout.
 */
export const todo = (reason: string): Field<never> => ({
  status: 'todo',
  reason,
});

export const isResolved = <T>(
  field: Field<T>,
): field is { status: 'resolved'; value: T } => field.status === 'resolved';

export type Address = {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  country: string;
};

export const company = {
  legalName: resolved('Alo-Dépannage'),
  displayName: 'Alo-Dépannage',

  phoneE164: PHONE_E164,
  phoneNational: PHONE_NATIONAL,
  phoneInternational: PHONE_INTERNATIONAL,
  email: resolved('contact@alo-depannage.com'),

  available247: true,

  /**
   * La promesse "toute l'Europe" du brief n'est vraie que pour le
   * transport. L'urgence est physiquement locale.
   */
  emergencyScope: 'brussels-region' as const,
  transportScope: 'europe' as const,

  pricing: {
    minEur: 50,
    maxEur: 250,
    perKmOutsideBrusselsEur: 2,
    quoteAvailable: true,
  },

  // --- En attente de confirmation client. Ne pas resoudre sans reponse. ---

  // Le numero fourni par le client comporte 11 chiffres apres BE ; le
  // format belge en exige exactement 10, commencant par 0 ou 1. Le motif
  // public (PendingDataNotice, rendu sur /mentions-legales) ne doit
  // jamais reciter ce numero errone tel quel : l'afficher publiquement,
  // meme comme exemple de ce qui cloche, reviendrait a le publier.
  vat: todo(
    'Le numero de TVA communique par le client ne respecte pas le format belge (BE suivi de 10 chiffres commencant par 0 ou 1). A confirmer aupres du client puis verifier sur la Banque-Carrefour des Entreprises avant publication.',
  ) as Field<string>,

  address: todo(
    "Le client a fourni « Schaarbeeklei », qui est une rue (Vilvoorde / Machelen). Numero, code postal et commune manquants. Requis pour les mentions legales et le referencement local.",
  ) as Field<Address>,

  motorwayZone: todo(
    "Le client annonce « agree autoroute » sans preciser la zone. Le depannage autoroutier belge est concede par zone : la mention ne peut pas etre publiee telle quelle.",
  ) as Field<string>,

  /**
   * Reseaux sociaux du carrousel de la page contact. Le rendu est
   * entierement cable (glyphes, morph de particules, liens) : resoudre
   * un champ avec l'URL reelle du profil suffit a le faire apparaitre
   * sur le podium. Un lien vers un handle invente pourrait pointer vers
   * le profil d'un tiers — meme regime que la TVA : rien ne se publie
   * sans confirmation. WhatsApp n'est pas ici : wa.me se derive du
   * numero de telephone confirme.
   */
  socials: {
    facebook: todo(
      'URL de la page Facebook a fournir par le client (ex. https://www.facebook.com/…). Aucun handle connu — ne pas deviner.',
    ) as Field<string>,
    linkedin: todo(
      'URL du profil/page LinkedIn a fournir par le client (ex. https://www.linkedin.com/company/…).',
    ) as Field<string>,
    tiktok: todo(
      'URL du compte TikTok a fournir par le client (ex. https://www.tiktok.com/@…).',
    ) as Field<string>,
  },
} as const;

/**
 * Source unique pour "les mentions legales sont-elles publiables ?".
 *
 * Le sitemap (qui exclut la page tant qu'elle est incomplete) et la page
 * des mentions legales elle-meme (qui se met en noindex) doivent s'accorder
 * sur cette question. Sans predicat partage, chacun re-derive sa propre
 * copie et elles peuvent silencieusement diverger si un champ requis
 * s'ajoute d'un cote sans l'autre.
 */
export function isLegalComplete(): boolean {
  return isResolved(company.vat) && isResolved(company.address);
}
