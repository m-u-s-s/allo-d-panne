import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/**
 * La distinction porte tout le positionnement : l'urgence est locale,
 * le transport est europeen. Annoncer "toute l'Europe" pour l'urgence
 * serait une promesse intenable — un camion ne traverse pas l'Europe
 * pour une batterie a plat.
 *
 * Au Plan 2, la carte WebGL des trajets remplace le placeholder du bloc
 * transport. Elle est non-decorative : elle dit ce que le texte dit moins
 * bien.
 */
export function CoverageSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {c.coverage.title}
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border border-cta/40 bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-cta">
            {c.hero.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-lg font-bold">
            {c.coverage.emergency.title}
          </h3>
          <p className="mt-3 max-w-[60ch] text-muted">
            {c.coverage.emergency.body}
          </p>
        </article>

        <article className="rounded-lg border border-border bg-surface p-6">
          <h3 className="mt-2 font-display text-lg font-bold">
            {c.coverage.transport.title}
          </h3>
          <p className="mt-3 max-w-[60ch] text-muted">
            {c.coverage.transport.body}
          </p>
        </article>
      </div>
    </section>
  );
}
