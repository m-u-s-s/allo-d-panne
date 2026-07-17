import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CoverageSection } from '@/components/ui/CoverageSection';
import { FinalCta } from '@/components/ui/FinalCta';
import { Hero } from '@/components/ui/Hero';
import { PageShell } from '@/components/ui/PageShell';
import { PricingSection } from '@/components/ui/PricingSection';
import { ProofSection } from '@/components/ui/ProofSection';
import { ServicesSection } from '@/components/ui/ServicesSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: alternatesFor('/', locale as Locale),
    openGraph: openGraphFor(c, '/', locale as Locale),
  };
}

export default async function HomePage({
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
    <PageShell path="/" locale={l}>
      <main>
        <Hero locale={l} />

        {/* Section "probleme" : la situation du client, avant les services. */}
        <section className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="max-w-[60ch] font-display text-2xl font-bold tracking-tight md:text-3xl">
            {c.problem.title}
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg text-muted">{c.problem.body}</p>
        </section>

        <ServicesSection locale={l} />
        <ProofSection locale={l} />
        <CoverageSection locale={l} />
        <PricingSection locale={l} />
        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
