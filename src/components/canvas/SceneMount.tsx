/**
 * Fond ambiant du site.
 *
 * Bascule theme clair (retour client 2026-07-22) : l'ancienne aurora WebGL
 * (nappes bleu electrique / violet — « gradient bleu mauve ») transparaissait
 * derriere les entetes de page et jurait avec le theme clair. Elle est
 * remplacee par une image topographique CLAIRE (public/backfooter.webp,
 * fournie par le client, adaptee au clair), posee en couche fixe la plus
 * profonde (-z-10). Les sections opaques la couvrent ; elle n'apparait que
 * dans les bandes d'entete transparentes — texte sombre lisible par-dessus.
 *
 * Statique : plus de WebGL a charger pour l'ambiance. `fixed` + hors flux =
 * aucun CLS ; `pointer-events-none` = jamais d'interception de clic ;
 * `aria-hidden` = pur decor.
 */
export function SceneMount() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{ backgroundImage: 'url(/backfooter.webp)' }}
    />
  );
}
