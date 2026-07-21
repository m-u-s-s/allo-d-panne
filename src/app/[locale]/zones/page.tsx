import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
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
    title: c.coverage.title,
    description: c.coverage.emergency.body,
    alternates: alternatesFor('/zones', locale as Locale),
    openGraph: openGraphFor(c, '/zones', locale as Locale),
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
        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
