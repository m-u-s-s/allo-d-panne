import type { Metadata } from 'next';
import { Inter, Syncopate } from 'next/font/google';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { SceneMount } from '@/components/canvas/SceneMount';
import { TierBadge } from '@/components/canvas/TierBadge';
import { ScrollExperience } from '@/components/motion/ScrollExperience';
import { getContent } from '@/content';
import { company } from '@/content/company';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { ogLocaleFor, SITE_URL } from '@/lib/seo';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
    metadataBase: new URL(SITE_URL),
    title: { default: c.meta.title, template: `%s — ${company.displayName}` },
    description: c.meta.description,
    // Pas d'`alternates` ici : le layout ne connait que la locale, jamais
    // le chemin de la page enfant. Les 7 pages feuilles fixent chacune leur
    // propre canonical/hreflang auto-referent via alternatesFor(path,
    // locale). Un fallback ici serait correct uniquement pour "/" et FAUX
    // pour toute autre page qui l'heriterait silencieusement — un mauvais
    // fallback est pire que pas de fallback : une page qui oublierait ses
    // propres alternates se retrouverait sans canonical du tout (visible,
    // detectable), plutot qu'avec un canonical pointant vers l'accueil
    // (silencieux, trompeur).
    // Pas d'`openGraph.url` ici, meme raisonnement que pour `alternates`
    // juste au-dessus : le layout ne connait que la locale, jamais le
    // chemin de la page enfant. Un `url` fige sur l'accueil serait FAUX
    // pour toute autre page (og:url = /nl sur /nl/tarifs) — silencieux et
    // trompeur pour les crawlers de reseaux sociaux. Les 7 pages feuilles
    // fixent chacune leur propre openGraph complet via openGraphFor()
    // (Next.js ne fusionne pas `openGraph` en profondeur : des qu'une page
    // le definit, cet objet layout est entierement remplace — voir
    // lib/seo.ts). title/description/siteName/locale/type restent ici
    // comme repli generique pour toute route qui n'aurait pas encore son
    // propre openGraph ; seul `url`, qui n'a pas de repli correct possible
    // a ce niveau, est absent plutot que faux.
    openGraph: {
      title: c.meta.title,
      description: c.meta.description,
      siteName: company.displayName,
      locale: ogLocaleFor(locale as Locale),
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next 16 : params est une Promise, l'acces sync est supprime.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${syncopate.variable}`}
      suppressHydrationWarning
    >
      {/*
        Pas de NextIntlClientProvider : plus rien ici n'en a besoin. C'etait
        exige par LocaleSwitcher (client component, usePathname/useRouter de
        next-intl) — devenu server component (voir LocaleSwitcher.tsx),
        c'est parti avec lui. Le seul autre client component, QuoteForm, lit
        le contenu via getContent(locale) (TS type, pas next-intl) : aucun
        hook next-intl cote client ne reste dans l'arbre. header/footer/
        barre d'appel sont maintenant rendus par page via PageShell, pas ici
        (voir PageShell.tsx : le layout ne connait pas le chemin de la page
        enfant, LocaleSwitcher en a besoin).
      */}
      <body className="bg-bg text-text antialiased">
        <LocalBusinessJsonLd locale={typedLocale} />
        {/*
          Le canvas WebGL vit ici, au-dessus de {children}, et ne se
          demonte donc jamais d'une route a l'autre (spec section 3.1). Il
          est en position fixed et hors flux : il ne participe ni au LCP ni
          au CLS. En palier Static il ne rend rien du tout.
        */}
        <SceneMount />
        {/*
          Comme le canvas, le systeme de scroll vit au layout et survit
          aux navigations : Lenis garde son inertie d'une page a l'autre.
          Il se reinitialise par route via usePathname (les triggers sont
          lies aux sections de la page courante). En Static il rend null.
        */}
        <ScrollExperience />
        {/* Diagnostic de palier, uniquement si l'URL contient ?debug. */}
        <TierBadge />
        {children}
      </body>
    </html>
  );
}
