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
  // au clic sur le titre ; `photo` → fond de mission DERRIERE le verre. Le
  // premier panneau est l'intro du site (pas de lien).
  const panels: {
    title: string;
    sub?: string;
    href?: string;
    photo?: string;
  }[] = [
    { title: c.problem.title, sub: c.problem.body, photo: '/missions/accident.jpg' },
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

  // Le mur de chevrons de verre, factorise : reutilise a l'identique en
  // couche MEDIANE (z-10) de chaque panneau. backdrop-blur → il givre la
  // PHOTO placee derriere (z-0) ; le TITRE (z-20) passe net au-dessus.
  // Chevrons PLEINS emboites (pointe d'une tuile = encoche de la voisine,
  // pas 25vw − 10vw = 15vw) : paroi continue sans trou. Marquee : periode
  // 60vw (motif tous les 4), translate exact de 60vw → boucle sans couture ;
  // marge gauche negative sort la premiere encoche hors ecran.
  const chevronGlass = (
    <div
      aria-hidden="true"
      className="hscroll-ribbon pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
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
                // Chevron plein ‹: pointe gauche a 0 %, encoche droite a
                // 60 % — la pointe remplit l'encoche de la voisine.
                clipPath:
                  'polygon(100% 0%, 40% 0%, 0% 50%, 40% 100%, 100% 100%, 60% 50%)',
              }}
            />
          );
        })}
      </div>
    </div>
  );

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
          Index horizontal (retour client). Chaque panneau est une PILE de
          trois couches z (facon risk.film) : la PHOTO de mission en fond
          (z-0), le mur de chevrons de verre par-dessus (z-10, son
          backdrop-blur givre la photo), et le TITRE net superpose tout en
          haut (z-20) — cliquable, il ouvre la page dediee au theme.

          Ecrit VERTICAL : sans JS, en Static / Lite / reduced-motion, les
          panneaux s'empilent (le verre, en .hscroll-ribbon, reste masque —
          fond + titre suffisent). En palier Full, ScrollExperience pose
          data-hscroll="on" : rangee plein ecran epinglee, translatee en X.
          Hero et FinalCta restent hors piste.
        */}
        <div data-hscroll="">
          <div data-hscroll-track="">
            {panels.map((p) => (
              <div data-panel="" key={p.title}>
                <div className="relative h-full min-h-[100svh] w-full overflow-hidden">
                  {/* FOND (z-0) : la photo de mission, DERRIERE le verre.
                      Placeholder « design » genere (IA) — a remplacer par
                      de vraies photos. alt="" : decoratif, le titre porte
                      le sens. */}
                  {p.photo ? (
                    <Image
                      src={p.photo}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  ) : null}

                  {/* MEDIAN (z-10) : le mur de chevrons givre la photo. */}
                  {chevronGlass}

                  {/* HAUT (z-20) : le titre superpose au-dessus du verre. */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
                    {p.href ? (
                      <a
                        href={getPathname({ href: p.href, locale: l })}
                        className="hscroll-open group inline-flex items-center gap-3"
                      >
                        <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                          {p.title}
                        </h2>
                        <span aria-hidden="true" className="hscroll-open-cue">
                          ›
                        </span>
                      </a>
                    ) : (
                      <div>
                        <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                          {p.title}
                        </h2>
                        {p.sub ? (
                          <p className="mx-auto mt-5 max-w-[46ch] text-lg text-white/85">
                            {p.sub}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-stage="">
          <FinalCta locale={l} videoReveal />
        </div>
      </main>
    </PageShell>
  );
}
