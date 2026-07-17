import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CoverageSection } from '@/components/ui/CoverageSection';
import { FinalCta } from '@/components/ui/FinalCta';
import ScrollAssemblyHero from '@/components/ui/scroll-assembly-hero';
import { PageShell } from '@/components/ui/PageShell';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';
import { PricingSection } from '@/components/ui/PricingSection';
import { ProofSection } from '@/components/ui/ProofSection';
import { ServicesSection } from '@/components/ui/ServicesSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const c = getContent(locale as Locale);
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: alternatesFor('/', locale as Locale),
    openGraph: openGraphFor(c, '/', locale as Locale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const l = locale as Locale;
  const c = getContent(l);

  return (
    <PageShell path="/" locale={l}>
      {/*
        data-stage : contrat avec la couche motion (ScrollExperience).
        Chaque etage recoit les transitions d'entree/sortie scrubbed en
        palier Full, un reveal simple en Lite, rien en Static — le HTML
        ci-dessous est deja complet sans JavaScript. Les wrappers sont des
        div neutres : les landmarks restent portes par les <section> des
        composants. data-stage="hero" est un cas a part : pas d'animation
        d'entree (c'est le LCP, il est visible au chargement), seulement
        la sortie en profondeur.
      */}
      <main>
        {/*
          Hero a assemblage au scroll (remplace l'ancien hero WebGL +
          camion filaire — les composants restent dans le depot). Pas de
          data-stage : sa choregraphie interne (sticky 300vh) est pilotee
          par framer-motion, le scrub GSAP de sortie se battrait avec.
          Les placeholders portrait/casque sont a remplacer par de
          vraies images (voir les commentaires des SVG dans public/).
        */}
        <ScrollAssemblyHero
          portraitSrc="/hero-portrait.svg"
          helmetSrc="/hero-helmet.svg"
          marqueeSerif="Alo-Dépannage"
          marqueeSans={c.hero.title}
          caption={c.hero.eyebrow}
          cardTitle="24/7"
          cardCaption={c.hero.availability}
          callHref={TEL_HREF}
          callLabel={c.hero.callCta}
          callNumber={PHONE_NATIONAL}
        />

        {/*
          Piste horizontale. Ecrite VERTICALE : les data-panel s'empilent
          normalement sans JavaScript, en Static, en Lite et en
          reduced-motion. En palier Full, ScrollExperience pose
          data-hscroll="on" : les panneaux passent plein ecran en rangee
          (globals.css) et GSAP epingle la piste puis la translate vers la
          GAUCHE pendant le defilement vertical. Hero et FinalCta restent
          hors piste : l'entree du site et son CTA de conversion ne
          passent jamais dans le scrolljack.
        */}
        <div data-hscroll="">
          <div data-hscroll-track="">
            {/* Section "probleme" : la situation du client, avant les services. */}
            <div data-panel="">
              <section className="mx-auto max-w-7xl px-4 py-20">
                <h2 className="max-w-[60ch] font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {c.problem.title}
                </h2>
                <p className="mt-4 max-w-[60ch] text-lg text-muted">
                  {c.problem.body}
                </p>
              </section>
            </div>
            <div data-panel="">
              <ServicesSection locale={l} />
            </div>
            <div data-panel="">
              <ProofSection locale={l} />
            </div>
            <div data-panel="">
              <CoverageSection locale={l} />
            </div>
            <div data-panel="">
              <PricingSection locale={l} />
            </div>
          </div>

          {/*
            Les grands « ‹ » transparents qui derivent au scroll — deux
            rubans a vitesses differentes (parallaxe), pilotes par le meme
            scrub que la piste. Purement decoratifs : aria-hidden, aucun
            evenement pointeur, invisibles hors mode horizontal.
          */}
          <div
            aria-hidden="true"
            data-ribbon="fast"
            className="hscroll-ribbon pointer-events-none absolute left-0 top-[8%] z-10 select-none whitespace-nowrap font-display text-[22svh] font-bold leading-none text-cta opacity-[0.07]"
          >
            {'‹ '.repeat(40)}
          </div>
          <div
            aria-hidden="true"
            data-ribbon="slow"
            className="hscroll-ribbon pointer-events-none absolute bottom-[6%] left-0 z-10 select-none whitespace-nowrap font-display text-[30svh] font-bold leading-none text-text opacity-[0.04]"
          >
            {'‹ '.repeat(30)}
          </div>
        </div>

        <div data-stage="">
          <FinalCta locale={l} videoReveal />
        </div>
      </main>
    </PageShell>
  );
}
