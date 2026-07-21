import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import Image from 'next/image';
import { FinalCta } from '@/components/ui/FinalCta';
import WreckRevealHero from '@/components/ui/wreck-reveal-hero';
import { PageShell } from '@/components/ui/PageShell';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';
import { getPathname } from '@/i18n/navigation';

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

  // Index horizontal : un theme par panneau. `href` → page dediee ouverte
  // au clic sur le titre ; `photo` → mission de depannage sous le ruban. Le
  // premier panneau est l'intro du site (ni lien ni photo).
  const panels: {
    title: string;
    sub?: string;
    href?: string;
    photo?: string;
  }[] = [
    { title: c.problem.title, sub: c.problem.body },
    {
      title: c.servicesSection.title,
      href: '/services',
      photo: '/missions/remorquage.jpg',
    },
    { title: c.proof.title, href: '/pourquoi', photo: '/missions/depannage.jpg' },
    { title: c.coverage.title, href: '/zones', photo: '/missions/transport.jpg' },
    {
      title: c.pricing.title,
      sub: c.pricing.subtitle,
      href: '/tarifs',
      photo: '/missions/ville.jpg',
    },
  ];

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
          Index horizontal (retour client). Chaque panneau porte, AU-DESSUS
          du ruban de verre, le TITRE d'un theme — cliquable, il ouvre la
          page dediee qui en porte le contenu complet ; et EN DESSOUS, une
          PHOTO de mission de depannage. Ecrit VERTICAL : sans JS, en Static
          / Lite / reduced-motion, les panneaux s'empilent. En palier Full,
          ScrollExperience pose data-hscroll="on" : rangee plein ecran
          epinglee que GSAP translate en X. Hero et FinalCta restent hors
          piste.
        */}
        <div data-hscroll="">
          <div data-hscroll-track="">
            {panels.map((p) => (
              <div data-panel="" key={p.title}>
                <div className="flex h-full w-full flex-col items-center">
                  {/* HAUT : le titre, ancre juste au-dessus du ruban. */}
                  <div className="flex flex-1 flex-col items-center justify-end px-6 pb-8 text-center">
                    {p.href ? (
                      <a
                        href={getPathname({ href: p.href, locale: l })}
                        className="hscroll-open group inline-flex items-center gap-3"
                      >
                        <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                          {p.title}
                        </h2>
                        <span aria-hidden="true" className="hscroll-open-cue">
                          ›
                        </span>
                      </a>
                    ) : (
                      <>
                        <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                          {p.title}
                        </h2>
                        {p.sub ? (
                          <p className="mt-4 max-w-[46ch] text-lg text-muted">
                            {p.sub}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* MILIEU : bande reservee au ruban (meme hauteur que
                      .hscroll-ribbon) — vide, le verre transparait ici. */}
                  <div
                    className="h-[34svh] w-full shrink-0"
                    aria-hidden="true"
                  />

                  {/* BAS : la photo de mission, ancree juste sous le ruban. */}
                  <div className="flex flex-1 items-start justify-center px-6 pt-8">
                    {p.photo ? (
                      <figure className="hscroll-photo">
                        {/* Placeholder « design » genere (IA) — a remplacer
                            par de vraies photos de missions. alt="" : la
                            photo illustre le titre deja explicite (decorative). */}
                        <Image
                          src={p.photo}
                          alt=""
                          width={1280}
                          height={854}
                          className="h-full w-full object-cover"
                          sizes="(max-width: 768px) 92vw, 40vw"
                        />
                      </figure>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ruban de verre facette, en BANDE horizontale centree (retour
              client : titres au-dessus, photos en dessous). Chevrons PLEINS
              emboites — la pointe d'une tuile comble l'encoche de la voisine
              (pas = 25vw − 10vw = 15vw) : paroi continue SANS trou. -z-10 :
              derriere le contenu, il ne floute que le fond WebGL. Marquee :
              12 chevrons, periode 60vw (motif tous les 4), translate exact
              de 60vw → boucle sans couture ; marge gauche negative sort la
              premiere encoche hors ecran. Decoratif : aria-hidden. */}
          <div
            aria-hidden="true"
            className="hscroll-ribbon pointer-events-none absolute inset-x-0 top-[33svh] -z-10 h-[34svh] select-none overflow-hidden"
          >
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
                      // Chevron plein ‹: pointe gauche a 0 %, encoche droite
                      // a 60 % — la pointe remplit l'encoche de la voisine.
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
