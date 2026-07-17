import type { Metadata } from 'next';
import { Inter, Syncopate } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { StickyCallBar } from '@/components/ui/StickyCallBar';
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
      <body className="bg-bg text-text antialiased">
        <LocalBusinessJsonLd locale={typedLocale} />
        <NextIntlClientProvider>
          <SiteHeader locale={typedLocale} />
          {children}
          <SiteFooter locale={typedLocale} />
          <StickyCallBar locale={typedLocale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
