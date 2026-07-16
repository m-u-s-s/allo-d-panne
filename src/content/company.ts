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
  legalName: resolved('ALB Dépannage'),
  displayName: 'ALB Dépannage',

  phoneE164: PHONE_E164,
  phoneNational: PHONE_NATIONAL,
  phoneInternational: PHONE_INTERNATIONAL,
  email: resolved('contact@alb-depannage.com'),

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

  vat: todo(
    "Le client a fourni BE06922715996 : 11 chiffres apres BE, or le format belge en exige exactement 10 commencant par 0 ou 1. Un chiffre est en trop. A verifier sur la Banque-Carrefour des Entreprises avant publication.",
  ) as Field<string>,

  address: todo(
    "Le client a fourni « Schaarbeeklei », qui est une rue (Vilvoorde / Machelen). Numero, code postal et commune manquants. Requis pour les mentions legales et le referencement local.",
  ) as Field<Address>,

  motorwayZone: todo(
    "Le client annonce « agree autoroute » sans preciser la zone. Le depannage autoroutier belge est concede par zone : la mention ne peut pas etre publiee telle quelle.",
  ) as Field<string>,
} as const;
