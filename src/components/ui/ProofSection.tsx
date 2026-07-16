import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/**
 * La base UX identifie "absence de certifications" comme un anti-pattern
 * majeur du secteur. On affiche agrement, assurance et disponibilite.
 *
 * La zone d'agrement autoroute reste todo : elle n'apparait pas ici tant
 * que le client ne l'a pas precisee.
 */
export function ProofSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const items = [c.proof.approved, c.proof.insured, c.proof.available];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {c.proof.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-text">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-cta"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
