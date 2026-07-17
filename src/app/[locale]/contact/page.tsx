import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CallButton } from '@/components/ui/CallButton';
import { QuoteForm } from '@/components/ui/QuoteForm';

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

      <section className="mt-16">
        <h2 className="font-display text-xl font-bold">
          {c.contactPage.formTitle}
        </h2>
        <div className="mt-6">
          <QuoteForm locale={l} />
        </div>
      </section>
    </main>
  );
}
