import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { company } from '@/content/company';
import { CallButton } from './CallButton';
import { HeaderShell } from './HeaderShell';
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

  const links = [
    { href: transport, label: c.nav.transport },
    { href: pricing, label: c.nav.pricing },
    { href: contact, label: c.nav.contact },
  ];

  return (
    // tone light : seul l'accueil a un sommet clair (creme du hero) —
    // texte encre a l'etat transparent, via globals.css.
    <HeaderShell
      tone={path === '/' ? 'light' : 'dark'}
      menuOpenLabel={c.nav.menuOpen}
      menuCloseLabel={c.nav.menuClose}
      menu={
        // Landmark distincte de la nav principale : deux <nav> du meme
        // nom violeraient l'unicite role+nom (regle axe).
        <nav aria-label={c.nav.menuLabel} className="flex flex-col px-4 py-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex min-h-[44px] items-center rounded-md px-2 text-base text-muted transition-colors duration-200 hover:text-text"
            >
              {l.label}
            </a>
          ))}
          {/*
            Le selecteur de langue vit ICI sur mobile : dans la rangee il
            debordait du viewport (mesure : scrollWidth 423/390 — le
            burger poussait le tout hors cadre). Deux instances mais une
            seule a la fois dans l'arbre a11y : celle-ci est inerte menu
            ferme, celle de la rangee est display:none sous md.
          */}
          <div className="mt-2 border-t border-border/60 pt-2">
            <LocaleSwitcher current={locale} path={path} />
          </div>
        </nav>
      }
    >
      <a
        href={home}
        className="font-display text-sm font-bold tracking-widest text-text"
      >
        {company.displayName}
      </a>

      <nav aria-label={c.nav.primaryLabel} className="hidden items-center gap-6 md:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <LocaleSwitcher current={locale} path={path} />
        </div>
        <CallButton label={c.hero.callCta} variant="header" />
      </div>
    </HeaderShell>
  );
}
