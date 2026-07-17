/**
 * Le pont entre la couche motion (qui ecrit) et la couche canvas (qui lit).
 *
 * C'est un singleton mutable module-scope, PAS un state React : la valeur
 * change a chaque frame de scroll, et la faire transiter par du state
 * declencherait un re-rendu React 60 fois par seconde pour des donnees
 * que seul useFrame consomme. Les deux boucles (ticker GSAP cote motion,
 * useFrame cote R3F) se partagent l'objet sans jamais re-rendre quoi que
 * ce soit.
 *
 * Quand la couche motion n'existe pas (palier Static, ou page sans
 * ScrollExperience), personne n'ecrit : les zeros font que le shader se
 * comporte exactement comme avant l'existence de ce fichier.
 */
export const scrollState = {
  /** Velocite Lenis lissee, unite ~px/frame. 0 a l'arret. */
  velocity: 0,
  /** Progression globale de la page, 0 en haut, 1 en bas. */
  progress: 0,
};
