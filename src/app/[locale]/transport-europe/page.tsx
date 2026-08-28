import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CallButton } from '@/components/ui/CallButton';
import { EuropeRadar } from '@/components/ui/EuropeRadar';
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
    title: c.transportPage.title,
    description: c.transportPage.intro,
    alternates: alternatesFor('/transport-europe', locale as Locale),
    openGraph: openGraphFor(c, '/transport-europe', locale as Locale),
  };
}

export default async function TransportPage({
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
    <PageShell path="/transport-europe" locale={l}>
      <main className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="max-w-[60ch] font-display text-3xl font-bold tracking-tight md:text-5xl">
          {c.transportPage.title}
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          {c.transportPage.intro}
        </p>

        <h2 className="mt-16 font-display text-xl font-bold">
          {c.transportPage.routesTitle}
        </h2>
        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <EuropeRadar
            alt={c.transportPage.mapAlt}
            fromLabel={c.transportPage.routesCaptionFrom}
            toLabel={c.transportPage.routesCaptionTo}
          />
        </div>

        <section className="mt-16 text-center">
          <h2 className="font-display text-2xl font-bold">
            {c.transportPage.ctaTitle}
          </h2>
          <div className="mt-6 flex justify-center">
            <CallButton label={c.hero.callCta} variant="primary" showNumber />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
