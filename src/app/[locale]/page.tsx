import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import { CoverageSection } from '@/components/ui/CoverageSection';
import { FinalCta } from '@/components/ui/FinalCta';
import WreckRevealHero from '@/components/ui/wreck-reveal-hero';
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
          h1 sr-only : le hero est purement visuel (le lockup de marque
          est un <p>, les marquees sont aria-hidden) — l'accueil avait
          PERDU son h1 aux remplacements de hero successifs (constat de
          l'audit UX). La proposition metier localisee reprend son role
          de titre de page, invisible a l'ecran, restituee aux lecteurs
          d'ecran et aux moteurs. Les sections suivantes sont en h2 :
          la hierarchie redevient valide.
        */}
        <h1 className="sr-only">{c.hero.title}</h1>

        {/*
          Hero avant/apres : voiture accidentee, et sous le curseur la
          meme voiture restauree avec la depanneuse derriere — la
          promesse du metier en une interaction. Remplace le hero a
          assemblage (qui reste dans le depot). Pas de data-stage : sa
          choregraphie interne est pilotee par framer-motion. La paire
          d'images sort du workflow IA documente en tete de
          wreck-reveal-hero.tsx : master genere (Flux), camion dedie
          composite, degats a masque confine, exports jumeaux d'un seul
          document — QA pixel 0 diff hors masques. Les SVG placeholder
          restent dans public/ comme filet.
        */}
        <WreckRevealHero
          wreckedSrc="/hero-car-wrecked.webp"
          revealSrc="/hero-car-restored-cutout.webp"
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

          {/* Mur de chevrons de verre (iterations client) : quatre div
              en FORME de ‹ (clip-path, bande 50 % — chaque chevron
              touche les quatre coins de sa colonne de 25 %), le
              backdrop-blur ne floute que dans la forme, intensites de
              verre croissantes de gauche a droite. Decoratif :
              aria-hidden, pointer-events-none, invisible hors mode
              horizontal ; derive parallaxe GSAP sur le mur entier. */}
          <div
            aria-hidden="true"
            data-ribbon="slow"
            className="hscroll-ribbon pointer-events-none absolute inset-0 z-10 select-none"
          >
            {/* gap-[2px] : seul espace entre les colonnes. flex-1 =
                quatre colonnes egales (chacune (100%-6px)/4). */}
            <div className="flex h-full w-full gap-[2px]">
              {/* Chaque div EST un chevron plein : clip-path arrondi-plein
                  (‹ epais) qui remplit sa colonne bord a bord — le seul
                  espace entre deux chevrons est le gap de 2px. Le
                  backdrop-blur ne floute que dans la forme, le contenu
                  reste net autour. Quatre intensites croissantes. */}
              {[
                'bg-white/[0.03] backdrop-blur-xs',
                'bg-white/[0.06] backdrop-blur',
                'bg-white/[0.09] backdrop-blur-md',
                'bg-white/[0.13] backdrop-blur-lg',
              ].map((glass, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 ${glass}`}
                  style={{
                    // ‹ epais remplissant la colonne : tip a gauche
                    // (0 50%), bras jusqu'aux coins droits, encoche a 68%
                    clipPath:
                      'polygon(100% 0, 0 50%, 100% 100%, 68% 50%)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div data-stage="">
          <FinalCta locale={l} videoReveal />
        </div>
      </main>
    </PageShell>
  );
}
