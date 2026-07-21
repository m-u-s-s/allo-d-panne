import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { FinalCta } from '@/components/ui/FinalCta';
import { PageShell } from '@/components/ui/PageShell';
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
    title: c.servicesSection.title,
    description: c.servicesSection.subtitle,
    alternates: alternatesFor('/services', locale as Locale),
    openGraph: openGraphFor(c, '/services', locale as Locale),
  };
}

export default async function ServicesPage({
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
    <PageShell path="/services" locale={l}>
      <main>
        {/* h1 sr-only : le titre visible est le h2 de la section (meme
            convention que l'accueil) — hierarchie valide, pas de doublon
            a l'ecran. */}
        <h1 className="sr-only">{c.servicesSection.title}</h1>
        <div className="pt-24">
          <ServicesSection locale={l} />
        </div>
        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
