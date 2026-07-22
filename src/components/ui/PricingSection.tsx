import { company } from '@/content/company';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

export function PricingSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const p = company.pricing;

  const rows = [
    { label: c.pricing.rangeLabel, value: `${p.minEur} € – ${p.maxEur} €` },
    { label: c.pricing.perKmLabel, value: `+ ${p.perKmOutsideBrusselsEur} € / km` },
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
