/**
 * Le numero unique d'ALB Depannage, sous ses trois formes.
 *
 * TEL_HREF est TOUJOURS en E.164 : les clients du transport europeen
 * appellent depuis l'etranger, un href au format national echouerait.
 * L'affichage, lui, reste national pour les clients belges.
 */
export const PHONE_E164 = '+32467786456' as const;
export const PHONE_NATIONAL = '0467 78 64 56' as const;
export const PHONE_INTERNATIONAL = '+32 467 78 64 56' as const;
export const TEL_HREF = `tel:${PHONE_E164}` as const;
