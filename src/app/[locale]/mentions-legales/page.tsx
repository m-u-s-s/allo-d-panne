import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { getContent } from '@/content';
import { company, isResolved } from '@/content/company';
import { routing, type Locale } from '@/i18n/routing';
import { PendingDataNotice } from '@/components/ui/PendingDataNotice';
import { PHONE_INTERNATIONAL } from '@/lib/phone';

/**
 * noindex tant que la page est incomplete : une page de mentions legales
 * fausse, indexee, est pire qu'absente.
 */
function isComplete() {
  return isResolved(company.vat) && isResolved(company.address);
}

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
    robots: isComplete() ? undefined : { index: false, follow: false },
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

  const pending = [
    !isResolved(company.vat)
      ? { label: 'Numéro de TVA', reason: company.vat.reason }
      : null,
    !isResolved(company.address)
      ? { label: 'Adresse du siège', reason: company.address.reason }
      : null,
    !isResolved(company.motorwayZone)
      ? { label: 'Zone d’agrément autoroute', reason: company.motorwayZone.reason }
      : null,
  ].filter((f): f is { label: string; reason: string } => f !== null);

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
          <dt className="inline text-muted">Nom : </dt>
          <dd className="inline text-text">{company.displayName}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Téléphone : </dt>
          <dd className="inline text-text">{PHONE_INTERNATIONAL}</dd>
        </div>
        {isResolved(company.email) ? (
          <div>
            <dt className="inline text-muted">Email : </dt>
            <dd className="inline text-text">{company.email.value}</dd>
          </div>
        ) : null}
        {isResolved(company.vat) ? (
          <div>
            <dt className="inline text-muted">TVA : </dt>
            <dd className="inline text-text">{company.vat.value}</dd>
          </div>
        ) : null}
        {isResolved(company.address) ? (
          <div>
            <dt className="inline text-muted">Siège : </dt>
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
