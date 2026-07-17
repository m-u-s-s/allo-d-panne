import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CallButton } from '@/components/ui/CallButton';
import { DescentFooterMount } from '@/components/ui/DescentFooterMount';
import { PageShell } from '@/components/ui/PageShell';
import { QuoteForm } from '@/components/ui/QuoteForm';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

/*
 * Glyphes de la sculpture de particules : traces PLEINS obligatoirement
 * (SVGLoader ne construit des formes que depuis les fills, jamais les
 * strokes). Combine, enveloppe, depanneuse — les canaux reels de
 * l'entreprise, pas de reseaux sociaux inventes.
 */
const GLYPH_PHONE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>';
const GLYPH_MAIL =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 9L4 8v10h16V8l-8 5zM4.5 6 12 10.7 19.5 6h-15z"/></svg>';
const GLYPH_TRUCK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M1 13h11V8h3.5c.8 0 1.6.4 2 1.1L19 11h2c.6 0 1 .4 1 1v3h-1.2a2.8 2.8 0 0 0-5.6 0h-4.4a2.8 2.8 0 0 0-5.6 0H1v-2z"/><circle fill="#000" cx="7.4" cy="16" r="1.9"/><circle fill="#000" cx="17.6" cy="16" r="1.9"/></svg>';

/* Libelle court du carrousel — trop etroit pour c.hero.quoteCta. */
const QUOTE_SHORT: Record<Locale, string> = {
  fr: 'Devis',
  nl: 'Offerte',
  en: 'Quote',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.contactPage.title,
    description: c.contactPage.intro,
    alternates: alternatesFor('/contact', locale as Locale),
    openGraph: openGraphFor(c, '/contact', locale as Locale),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = getContent(l);

  return (
    <PageShell path="/contact" locale={l}>
      <main className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          {c.contactPage.title}
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          {c.contactPage.intro}
        </p>

        {/* L'urgence passe AVANT le formulaire : c'est le chemin le plus court. */}
        <section className="mt-10 rounded-lg border border-cta/40 bg-surface p-6">
          <h2 className="font-display text-xl font-bold">
            {c.contactPage.urgentTitle}
          </h2>
          <p className="mt-2 text-muted">{c.contactPage.urgentBody}</p>
          <div className="mt-5">
            <CallButton label={c.hero.callCta} variant="primary" showNumber />
          </div>
          {isResolved(company.email) ? (
            <a
              href={`mailto:${company.email.value}`}
              className="mt-4 inline-block text-sm text-muted transition-colors duration-200 hover:text-text"
            >
              {company.email.value}
            </a>
          ) : null}
        </section>

        {/* id="devis" : cible d'ancre du carrousel de la descente. */}
        <section id="devis" className="mt-16">
          <h2 className="font-display text-xl font-bold">
            {c.contactPage.formTitle}
          </h2>
          <div className="mt-6">
            <QuoteForm locale={l} />
          </div>
        </section>
      </main>

      {/*
        La descente (réplique igloo.inc) vit HORS du main : pleine
        largeur, juste après le formulaire, avant le footer du site.
        Palier Full : l'expérience WebGL ; tous les autres : la même
        nav de canaux réels, sans canvas.
      */}
      <DescentFooterMount
        ariaLabel={c.contactPage.title}
        items={[
          {
            id: 'phone',
            label: PHONE_NATIONAL,
            href: TEL_HREF,
            svg: GLYPH_PHONE,
          },
          ...(isResolved(company.email)
            ? [
                {
                  id: 'email',
                  label: 'Email',
                  href: `mailto:${company.email.value}`,
                  svg: GLYPH_MAIL,
                },
              ]
            : []),
          {
            id: 'devis',
            label: QUOTE_SHORT[l],
            href: '#devis',
            svg: GLYPH_TRUCK,
          },
        ]}
      />
    </PageShell>
  );
}
