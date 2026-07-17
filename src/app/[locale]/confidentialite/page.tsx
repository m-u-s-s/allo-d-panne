import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.legal.privacyTitle,
    alternates: alternatesFor('/confidentialite', locale as Locale),
    openGraph: openGraphFor(c, '/confidentialite', locale as Locale),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {c.legal.privacyTitle}
      </h1>
      <p className="mt-6 text-muted">{c.legal.privacyBody}</p>
    </main>
  );
}
