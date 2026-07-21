import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { FinalCta } from '@/components/ui/FinalCta';
import { PageShell } from '@/components/ui/PageShell';
import { ProofSection } from '@/components/ui/ProofSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.proof.title,
    description: [c.proof.approved, c.proof.insured, c.proof.available].join(
      ' · ',
    ),
    alternates: alternatesFor('/pourquoi', locale as Locale),
    openGraph: openGraphFor(c, '/pourquoi', locale as Locale),
  };
}

export default async function WhyPage({
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
    <PageShell path="/pourquoi" locale={l}>
      <main>
        <h1 className="sr-only">{c.proof.title}</h1>
        <div className="pt-24">
          <ProofSection locale={l} />
        </div>
        <FinalCta locale={l} />
      </main>
    </PageShell>
  );
}
