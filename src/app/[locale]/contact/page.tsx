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

/*
 * Fleches du carrousel de la descente. Elles n'ont pas de libelle visible
 * (les glyphes ‹ et ›), donc leur aria-label EST leur seul nom : il doit
 * suivre la langue de la page. Il etait fige en francais.
 */
const CAROUSEL_NAV: Record<Locale, { prev: string; next: string }> = {
  fr: { prev: 'Précédent', next: 'Suivant' },
  nl: { prev: 'Vorige', next: 'Volgende' },
  en: { prev: 'Previous', next: 'Next' },
};

/*
 * Glyphes de marque des reseaux (traces pleins, contre-formes en
 * evenodd — le pipeline extrude respecte les trous : zero particule
 * dans le point du « in » LinkedIn ou le combine WhatsApp).
 */
const GLYPH_WHATSAPP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M12 2.3A9.5 9.5 0 0 0 2.5 11.8c0 1.68.44 3.3 1.27 4.74L2.4 21.6l5.2-1.35a9.42 9.42 0 0 0 4.4 1.1 9.5 9.5 0 1 0 0-19.05zm4.9 13.05c-.2.58-1.2 1.13-1.66 1.16-.45.04-.87.2-2.92-.6-2.47-.98-4.03-3.5-4.15-3.66-.12-.16-1-1.33-1-2.54 0-1.2.63-1.8.86-2.04.22-.25.49-.31.65-.31h.47c.15 0 .35-.05.55.42.2.48.68 1.66.74 1.78.06.12.1.27.02.43-.08.16-.36.5-.62.78-.13.14-.27.3-.12.57.15.26.68 1.12 1.46 1.81 1 .9 1.85 1.18 2.11 1.3.26.13.42.11.57-.06.16-.18.66-.77.84-1.03.18-.27.35-.22.6-.13.24.09 1.55.73 1.81.86.27.13.44.2.5.3.07.12.07.63-.13 1.2z"/></svg>';
const GLYPH_FACEBOOK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M13.6 21.9v-7.8h2.62l.4-3.04h-3.02V9.12c0-.88.24-1.48 1.5-1.48h1.62V4.92c-.28-.04-1.24-.12-2.36-.12-2.34 0-3.94 1.43-3.94 4.05v2.21H7.8v3.04h2.62v7.8h3.18z"/></svg>';
const GLYPH_LINKEDIN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2zM6.7 8.4a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3zM5.3 18.6h2.8V9.8H5.3v8.8zm5.2-8.8v8.8h2.8v-4.5c0-1.35.5-2.25 1.7-2.25 1 0 1.4.78 1.4 2.25v4.5h2.8v-5.1c0-2.5-1.2-3.9-3.15-3.9-1.5 0-2.35.82-2.75 1.55V9.8h-2.8z"/></svg>';
const GLYPH_TIKTOK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M16.7 2.9c.36 2.12 1.8 3.58 3.94 3.88v2.78c-1.47.05-2.78-.4-3.94-1.22v6.1c0 3.6-2.53 5.82-5.62 5.82-2.94 0-5.12-2.08-5.12-4.96 0-2.84 2.13-4.92 5.17-4.92.3 0 .66.03 1.01.1v2.94c-.35-.12-.7-.17-1.01-.17-1.37 0-2.33.9-2.33 2.12 0 1.27.96 2.13 2.28 2.13 1.57 0 2.74-1.07 2.79-2.94V2.9h2.83z"/></svg>';

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
        prevLabel={CAROUSEL_NAV[l].prev}
        nextLabel={CAROUSEL_NAV[l].next}
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
                  label: 'E-mail',
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
          /* wa.me se derive du numero confirme — pas d'URL a inventer.
             (A verifier avec le client : le numero a-t-il WhatsApp ?) */
          {
            id: 'whatsapp',
            label: 'WhatsApp',
            href: `https://wa.me/${company.phoneE164.slice(1)}`,
            svg: GLYPH_WHATSAPP,
            external: true,
          },
          /* Les trois suivants n'apparaissent qu'une fois leur URL
             reelle resolue dans company.ts (meme regime que la TVA). */
          ...(isResolved(company.socials.facebook)
            ? [
                {
                  id: 'facebook',
                  label: 'Facebook',
                  href: company.socials.facebook.value,
                  svg: GLYPH_FACEBOOK,
                  external: true,
                },
              ]
            : []),
          ...(isResolved(company.socials.linkedin)
            ? [
                {
                  id: 'linkedin',
                  label: 'LinkedIn',
                  href: company.socials.linkedin.value,
                  svg: GLYPH_LINKEDIN,
                  external: true,
                },
              ]
            : []),
          ...(isResolved(company.socials.tiktok)
            ? [
                {
                  id: 'tiktok',
                  label: 'TikTok',
                  href: company.socials.tiktok.value,
                  svg: GLYPH_TIKTOK,
                  external: true,
                },
              ]
            : []),
        ]}
      />
    </PageShell>
  );
}
