import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { COMMUNES, communeName } from '@/content/communes';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor, twitterFor } from '@/lib/seo';
import { CoverageSection } from '@/components/ui/CoverageSection';
import { FinalCta } from '@/components/ui/FinalCta';
import { PageShell } from '@/components/ui/PageShell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.seo.zones.title,
    description: c.seo.zones.description,
    alternates: alternatesFor('/zones', locale as Locale),
    openGraph: openGraphFor(c, '/zones', locale as Locale, 'zones'),
    twitter: twitterFor(c, 'zones'),
  };
}

export default async function ZonesPage({
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
    <PageShell path="/zones" locale={l}>
      <main>
        <h1 className="sr-only">{c.coverage.title}</h1>
        <div className="pt-24">
          <CoverageSection locale={l} />
        </div>

        {/*
          Les communes, NOMMEES. Le schema.org les declarait deja dans
          areaServed ; ici elles deviennent du texte que le visiteur lit et
          qu'un moteur indexe. C'est la meme promesse que « Bruxelles et
          périphérie », rendue explicite : on cherche « dépannage
          Schaerbeek », jamais « dépannage Région de Bruxelles-Capitale ».
          Liste importee de content/communes.ts — une seule source pour la
          page et pour le schema.
        */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
              {c.coverage.communesTitle}
            </h2>
            <p className="mt-3 max-w-[60ch] text-muted">
              {c.coverage.communesBody}
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-2 text-sm text-text">
              {COMMUNES.map((commune) => (
                <li
                  key={commune.fr}
                  className="rounded-full border border-border bg-bg px-3 py-1"
                >
                  {communeName(commune, l)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
