import type { Locale } from '@/i18n/routing';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { StickyCallBar } from './StickyCallBar';

/**
 * Assemble header, contenu, footer et barre d'appel pour une page.
 *
 * Vivait auparavant dans le layout partage (`[locale]/layout.tsx`), qui ne
 * peut plus s'en charger : LocaleSwitcher est desormais un server component
 * (voir son fichier) et a besoin du chemin courant sans prefixe de langue
 * pour construire ses liens. Un layout Next.js ne connait jamais le chemin
 * de la page qu'il enveloppe — seule la page elle-meme le sait au moment de
 * `generateStaticParams`. Lire le chemin via `headers()` cote layout
 * fonctionnerait, mais ferait basculer les 7 pages de prerendu statique
 * (● SSG) a rendu dynamique (ƒ) a chaque requete : bien pire que le cout
 * d'un `path` explicite repete sur 7 fichiers.
 *
 * Chaque page appelle donc `<PageShell path="/tarifs" locale={l}>`
 * elle-meme plutot que de heriter header/footer du layout.
 */
export function PageShell({
  path,
  locale,
  children,
}: {
  /** Chemin sans prefixe de langue (ex. '/', '/tarifs'). */
  path: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader locale={locale} path={path} />
      {children}
      <SiteFooter locale={locale} />
      <StickyCallBar locale={locale} />
    </>
  );
}
