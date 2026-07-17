import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { company } from '@/content/company';
import { CallButton } from './CallButton';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader({
  locale,
  path,
}: {
  locale: Locale;
  /** Chemin courant sans prefixe de langue (ex. '/tarifs'), pour LocaleSwitcher. */
  path: string;
}) {
  const c = getContent(locale);
  // <a href> via getPathname() plutot que <Link> de next-intl : Link (qui
  // enveloppe next/link) est lui-meme un client component qui appelle
  // getLocale() sans condition — meme avec un `locale` explicite, ca exige
  // NextIntlClientProvider au moment de l'hydratation cote navigateur (verifie
  // en dev : "No intl context found" des que le provider est retire). Pour
  // qu'un site de liens statiques n'embarque aucun runtime d'hydratation pour
  // sa seule navigation, il faut des ancres serveur, pas Link.
  const home = getPathname({ href: '/', locale });
  const transport = getPathname({ href: '/transport-europe', locale });
  const pricing = getPathname({ href: '/tarifs', locale });
  const contact = getPathname({ href: '/contact', locale });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <a
          href={home}
          className="font-display text-sm font-bold tracking-widest text-text"
        >
          {company.displayName}
        </a>

        <nav aria-label={c.nav.primaryLabel} className="hidden items-center gap-6 md:flex">
          <a
            href={transport}
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.transport}
          </a>
          <a
            href={pricing}
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.pricing}
          </a>
          <a
            href={contact}
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.contact}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} path={path} />
          <CallButton label={c.hero.callCta} variant="header" />
        </div>
      </div>
    </header>
  );
}
