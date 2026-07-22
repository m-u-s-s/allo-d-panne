import { company, isResolved } from '@/content/company';
import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

export function SiteFooter({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  // <a href> via getPathname(), pas <Link> — voir le commentaire equivalent
  // dans SiteHeader.tsx : Link exige NextIntlClientProvider a l'hydratation
  // meme dans un server component.
  const transport = getPathname({ href: '/transport-europe', locale });
  const pricing = getPathname({ href: '/tarifs', locale });
  const contact = getPathname({ href: '/contact', locale });
  const legalNotice = getPathname({ href: '/mentions-legales', locale });
  const terms = getPathname({ href: '/cgv', locale });
  const privacy = getPathname({ href: '/confidentialite', locale });

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
            className="mt-3 inline-block min-h-[44px] text-lg text-secondary transition-opacity duration-200 hover:opacity-80"
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
          <a
            href={transport}
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.transport}
          </a>
          <a
            href={pricing}
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.pricing}
          </a>
          <a
            href={contact}
            className="inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.contact}
          </a>
        </nav>

        <nav aria-label={c.footer.legalNavLabel} className="flex flex-col gap-2 text-sm">
          <a
            href={legalNotice}
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.legal}
          </a>
          <a
            href={terms}
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.terms}
          </a>
          <a
            href={privacy}
            className="text-muted transition-colors duration-200 hover:text-text"
          >
            {c.footer.privacy}
          </a>
        </nav>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {company.displayName}. {c.footer.rights}
      </div>
    </footer>
  );
}
