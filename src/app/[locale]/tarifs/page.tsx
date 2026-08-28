import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor, twitterFor } from '@/lib/seo';
import { FinalCta } from '@/components/ui/FinalCta';
import { PageShell } from '@/components/ui/PageShell';
import { PricingSection } from '@/components/ui/PricingSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.seo.pricing.title,
    description: c.seo.pricing.description,
    alternates: alternatesFor('/tarifs', locale as Locale),
    openGraph: openGraphFor(c, '/tarifs', locale as Locale, 'pricing'),
    twitter: twitterFor(c, 'pricing'),
  };
}

export default async function PricingPage({
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
    <PageShell path="/tarifs" locale={l}>
      <main>
        <div className="mx-auto max-w-7xl px-4 pt-20">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            {c.pricingPage.title}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg text-muted">
            {c.pricingPage.intro}
          </p>
        </div>
        <div className="mt-12">
          <PricingSection locale={l} />
        </div>
        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
