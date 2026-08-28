import { company } from '@/content/company';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/*
 * La place du symbole € n'est PAS la meme dans les trois langues :
 * « 50 € » en francais, « € 50 » en neerlandais, « €50 » en anglais. Le
 * gabarit etait fige sur la forme francaise, donc /en et /nl affichaient
 * un montant mal ecrit. Intl.NumberFormat connait ces regles ; les
 * etiquettes BCP 47 sont les variantes belges, sauf l'anglais (en-IE,
 * l'anglais de la zone euro).
 */
const MONEY_LOCALE: Record<Locale, string> = {
  fr: 'fr-BE',
  nl: 'nl-BE',
  en: 'en-IE',
};

export function PricingSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const p = company.pricing;

  const money = (amount: number) =>
    new Intl.NumberFormat(MONEY_LOCALE[locale], {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);

  const rows = [
    { label: c.pricing.rangeLabel, value: `${money(p.minEur)} – ${money(p.maxEur)}` },
    { label: c.pricing.perKmLabel, value: `+ ${money(p.perKmOutsideBrusselsEur)} / km` },
    { label: c.pricing.quoteLabel, value: c.hero.quoteCta },
  ];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {c.pricing.title}
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted">{c.pricing.subtitle}</p>

        <dl className="mt-10 divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 py-4"
            >
              <dt className="text-text">{row.label}</dt>
              <dd className="font-display text-xl font-bold text-secondary">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 max-w-[60ch] text-sm text-muted">
          {c.pricing.disclaimer}
        </p>
      </div>
    </section>
  );
}
