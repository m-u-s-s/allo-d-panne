import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = { fr: 'FR', nl: 'NL', en: 'EN' };

/**
 * Server component — pas de JS requis pour changer de langue.
 *
 * Etait un client component qui appelait `router.replace()` au clic. Sur un
 * site statique de 7 pages, c'etait la SEULE raison de charger le runtime
 * React DOM + NextIntlClientProvider sur les 6 pages qui n'ont pas de
 * formulaire (QuoteForm, le seul autre client component, ne vit que sur
 * /contact). `getPathname` (deja exporte par src/i18n/navigation.ts, deja
 * inutilise) calcule le lien localise cote serveur : trois `<a href>`
 * suffisent, et ils fonctionnent JS desactive — c'est tout le point d'un
 * selecteur de langue sur un site qui n'a normalement besoin d'aucun JS
 * pour naviguer.
 *
 * `path` est le chemin SANS prefixe de langue (ex. '/tarifs', '/'). Un
 * layout Next.js ne peut pas le deriver lui-meme (voir PageShell.tsx) ; il
 * est donc fourni explicitement par la page qui rend ce composant.
 */
export function LocaleSwitcher({
  current,
  path,
}: {
  current: Locale;
  path: string;
}) {
  const c = getContent(current);

  return (
    <nav aria-label={c.localeSwitcher.label} className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === current;
        return (
          <a
            key={locale}
            href={getPathname({ href: path, locale })}
            aria-current={isActive ? 'page' : undefined}
            className={
              'flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-2 text-sm ' +
              'transition-colors duration-200 ' +
              (isActive
                ? 'text-text underline underline-offset-4'
                : 'text-muted hover:text-text')
            }
          >
            {LABELS[locale]}
          </a>
        );
      })}
    </nav>
  );
}
