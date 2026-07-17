type PendingField = { label: string; reason: string };

/**
 * Rend visible ce qui manque, plutot que de le combler avec du plausible.
 *
 * En Belgique, des mentions legales fausses ou incompletes exposent
 * l'entreprise. La bonne reponse n'est pas d'inventer une TVA vraisemblable
 * pour faire propre : c'est de montrer le trou jusqu'a ce qu'il soit comble.
 */
export function PendingDataNotice({
  title,
  body,
  fields,
}: {
  title: string;
  body: string;
  fields: readonly PendingField[];
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
        {fields.map((f) => (
          <li key={f.label} className="text-sm">
            <span className="font-semibold text-text">{f.label}</span>
            <span className="text-muted"> — {f.reason}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
