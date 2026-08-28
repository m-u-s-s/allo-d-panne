import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
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
  hideFooter = false,
}: {
  /** Chemin sans prefixe de langue (ex. '/', '/tarifs'). */
  path: string;
  locale: Locale;
  children: React.ReactNode;
  /**
   * L'accueil se clot par le panneau HeroAlo, qui porte deja sa propre
   * navigation, ses reseaux, ses mentions et son copyright : le footer
   * global ferait doublon. Les autres pages gardent SiteFooter.
   */
  hideFooter?: boolean;
}) {
  return (
    <>
      {/* Fil d’Ariane machine-lisible. Il vit ICI parce que PageShell
          est le seul endroit qui connaisse a la fois la langue ET le
          chemin : le layout ignore le chemin, et le repeter page par page
          serait neuf occasions de l’oublier. */}
      <BreadcrumbJsonLd locale={locale} path={path} />
      <SiteHeader locale={locale} path={path} />
      {children}
      {!hideFooter && <SiteFooter locale={locale} />}
      <StickyCallBar locale={locale} />
    </>
  );
}
