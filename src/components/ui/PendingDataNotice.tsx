/**
 * Rend visible ce qui manque, plutot que de le combler avec du plausible.
 *
 * En Belgique, des mentions legales fausses ou incompletes exposent
 * l'entreprise. La bonne reponse n'est pas d'inventer une TVA vraisemblable
 * pour faire propre : c'est de montrer le trou jusqu'a ce qu'il soit comble.
 *
 * `fields` ne recoit que des libelles localises (pendingVatLabel et
 * consorts, definis dans SiteContent), jamais les `reason` de
 * `company.ts`. Ces raisons sont des notes internes pour l'equipe de
 * developpement — certaines recitent des donnees fournies par le client
 * qui sont elles-memes le probleme (un numero de TVA errone, une adresse
 * incomplete, une pretention de certification non verifiable). Les
 * republier sur la page publique, meme pour signaler qu'elles clochent,
 * reviendrait a les publier quand meme. Le composant n'accepte donc plus
 * de prop `reason` du tout : c'est une garantie structurelle, pas une
 * discipline a maintenir champ par champ.
 */
export function PendingDataNotice({
  title,
  body,
  fields,
}: {
  title: string;
  body: string;
  fields: readonly string[];
}) {
  if (fields.length === 0) return null;

  return (
    <aside
      aria-labelledby="pending-data-notice-title"
      className="my-8 rounded-lg border border-cta bg-surface p-5"
    >
      <h2
        id="pending-data-notice-title"
        className="font-display text-base font-bold text-cta"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <ul className="mt-4 space-y-2">
        {fields.map((label) => (
          <li key={label} className="text-sm font-semibold text-text">
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
