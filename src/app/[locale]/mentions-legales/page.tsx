import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isLegalComplete, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { PendingDataNotice } from '@/components/ui/PendingDataNotice';
import { PHONE_INTERNATIONAL } from '@/lib/phone';
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
    title: c.legal.noticeTitle,
    alternates: alternatesFor('/mentions-legales', locale as Locale),
    openGraph: openGraphFor(c, '/mentions-legales', locale as Locale),
    // noindex tant que la page est incomplete : une page de mentions
    // legales fausse, indexee, est pire qu'absente. Meme predicat que le
    // sitemap (qui exclut cette page tant qu'elle est incomplete).
    robots: isLegalComplete() ? undefined : { index: false, follow: false },
  };
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = getContent(locale as Locale);

  // Uniquement des libelles localises (SiteContent) : jamais les `reason`
  // de company.ts, qui sont des notes internes pour l'equipe de dev (voir
  // le commentaire de PendingDataNotice).
  const pending = [
    !isResolved(company.vat) ? c.legal.pendingVatLabel : null,
    !isResolved(company.address) ? c.legal.pendingAddressLabel : null,
    !isResolved(company.motorwayZone)
      ? c.legal.pendingMotorwayZoneLabel
      : null,
  ].filter((f): f is string => f !== null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {c.legal.noticeTitle}
      </h1>

      <PendingDataNotice
        title={c.legal.pendingTitle}
        body={c.legal.pendingBody}
        fields={pending}
      />

      <h2 className="mt-10 font-display text-lg font-bold">
        {c.legal.publisher}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="inline text-muted">{c.legal.publisherNameLabel}</dt>
          <dd className="inline text-text">{company.displayName}</dd>
        </div>
        <div>
          <dt className="inline text-muted">{c.legal.publisherPhoneLabel}</dt>
          <dd className="inline text-text">{PHONE_INTERNATIONAL}</dd>
        </div>
        {isResolved(company.email) ? (
          <div>
            <dt className="inline text-muted">{c.legal.publisherEmailLabel}</dt>
            <dd className="inline text-text">{company.email.value}</dd>
          </div>
        ) : null}
        {isResolved(company.vat) ? (
          <div>
            <dt className="inline text-muted">{c.legal.publisherVatLabel}</dt>
            <dd className="inline text-text">{company.vat.value}</dd>
          </div>
        ) : null}
        {isResolved(company.address) ? (
          <div>
            <dt className="inline text-muted">{c.legal.publisherAddressLabel}</dt>
            <dd className="inline text-text">
              {company.address.value.street} {company.address.value.number},{' '}
              {company.address.value.postalCode} {company.address.value.city},{' '}
              {company.address.value.country}
            </dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}
