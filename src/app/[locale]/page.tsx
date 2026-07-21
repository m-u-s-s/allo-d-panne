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

          {/* Mur de verre facette (retour client : « pas pointu, remplir
              l'espace, comme risk.film »). Chaque tuile est un chevron
              PLEIN dont la pointe droite comble exactement l'encoche
              gauche de la tuile suivante — pas = largeur − profondeur de
              pointe (25vw − 10vw = 15vw). Les tuiles s'emboitent donc en
              une paroi continue SANS trou (fini les triangles vides du
              fond). Intensites de verre croissantes : les coutures
              diagonales se lisent comme des facettes.

              Couche placee DERRIERE la piste (-z-10) : un backdrop-blur
              floute toujours ce qui est derriere lui, donc un titre net
              ne peut PAS vivre derriere le verre. En passant le mur
              sous les panneaux (transparents), le contenu — titres en
              tete — repasse AU-DESSUS du verre, net et lisible, pendant
              que le verre ne floute plus que le fond WebGL.

              Decoratif : aria-hidden, pointer-events-none, invisible
              hors mode horizontal. */}
          <div
            aria-hidden="true"
            className="hscroll-ribbon pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
          >
            {/* Marquee : douze chevrons emboites defilent vers la droite
                en continu. Periode = 4 chevrons × 15vw de pas = 60vw ;
                le keyframe translate d'exactement 60vw (motif de verre
                identique tous les 4) — boucle sans couture. La marge
                gauche negative de .chevron-marquee sort la premiere
                encoche hors ecran. w-max : la piste suit son contenu. */}
            <div className="chevron-marquee flex h-full w-max">
              {Array.from({ length: 12 }, (_, i) => {
                const glass = [
                  'bg-white/[0.05] backdrop-blur-xs',
                  'bg-white/[0.08] backdrop-blur',
                  'bg-white/[0.11] backdrop-blur-md',
                  'bg-white/[0.15] backdrop-blur-lg',
                ][i % 4];
                return (
                  <div
                    key={i}
                    className={`h-full w-[25vw] shrink-0 [margin-right:-10vw] ${glass}`}
                    style={{
                      // Chevron plein ‹: pointe gauche a 0 %, encoche
                      // droite a 60 % — la pointe d'une tuile remplit
                      // l'encoche de la precedente (emboitement sans trou).
                      clipPath:
                        'polygon(100% 0%, 40% 0%, 0% 50%, 40% 100%, 100% 100%, 60% 50%)',
                    }}
                  />
                );
              })}
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
