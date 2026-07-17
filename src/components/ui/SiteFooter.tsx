import { company, isResolved } from '@/content/company';
import { getContent } from '@/content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

export function SiteFooter({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    // pb-24 sur mobile : la barre d'appel fixe ne doit pas masquer le footer.
    <footer className="border-t border-border bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-sm font-bold tracking-widest">
            {company.displayName}
          </p>
          <a
            href={TEL_HREF}
            className="mt-3 inline-block min-h-[44px] text-lg text-cta transition-opacity duration-200 hover:opacity-80"
          >
            {PHONE_NATIONAL}
          </a>
          {isResolved(company.email) ? (
            <a
              href={`mailto:${company.email.value}`}
              className="block text-sm text-muted transition-colors duration-200 hover:text-text"
            >
              {company.email.value}
            </a>
          ) : null}
        </div>

        <div>
          {/*
            L'adresse et la TVA ne s'affichent QUE si le client les a
            confirmees. isResolved() est la garde : le compilateur interdit
            de lire .value sans passer par elle.
          */}
          {isResolved(company.address) ? (
            <address className="text-sm not-italic text-muted">
              {company.address.value.street} {company.address.value.number}
              <br />
              {company.address.value.postalCode} {company.address.value.city}
              <br />
              {company.address.value.country}
            </address>
          ) : null}
          {isResolved(company.vat) ? (
            <p className="mt-2 text-sm text-muted">TVA {company.vat.value}</p>
          ) : null}
        </div>

        {/*
          Le header masque sa nav principale sous md:flex (hidden en dessous).
          Sans ce bloc, un visiteur mobile n'a aucun moyen d'atteindre
          Transport Europe, Tarifs ou Contact — seul le footer reste
          accessible. Pas de hamburger, pas de client component : le footer
          est le repli conventionnel, sans JS, au niveau statique du site.
        */}
        <nav aria-label={c.footer.navLabel} className="flex flex-col gap-2 text-sm">
          <Link
            href="/transport-europe"
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.transport}
          </Link>
          <Link
            href="/tarifs"
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.pricing}
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.contact}
          </Link>
        </nav>

        <nav aria-label={c.footer.legalNavLabel} className="flex flex-col gap-2 text-sm">
          <Link
            href="/mentions-legales"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.legal}
          </Link>
          <Link
            href="/cgv"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.terms}
          </Link>
          <Link
            href="/confidentialite"
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.privacy}
          </Link>
        </nav>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {company.displayName}. {c.footer.rights}
      </div>
    </footer>
  );
}
