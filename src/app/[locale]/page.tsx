import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getContent } from '@/content';
import { routing, type Locale } from '@/i18n/routing';
import { alternatesFor, openGraphFor } from '@/lib/seo';
import Image from 'next/image';
import { ExpandableGallery } from '@/components/ui/expandable-gallery';
import { HeroAlo } from '@/components/ui/HeroAlo';
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
  // au clic sur le titre ; `photo` → fond de mission DERRIERE le verre.
  // (Le constat « personne ne prevoit... » a quitte le carrousel : il est
  // remonte DANS le hero, en derniere respiration de la sequence — voir
  // WreckRevealHero.problemTitle/Body. Tous les panneaux restants portent
  // donc un lien de mission.)
  const panels: {
    title: string;
    sub?: string;
    href?: string;
    photo?: string;
  }[] = [
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
  // QUATRE chevrons VISIBLES a la fois (retour client), plus larges (42vw,
  // pas 25.2vw → 100vw / 25.2 ≈ 4 a l'ecran). Douze tuiles seulement pour
  // BOUCLER le defilement (le motif de verre se repete tous les 4 chevrons,
  // translate d'exactement une periode = 100.8vw → boucle sans couture) ;
  // l'ecran n'en montre que quatre. Emboites (la pointe comble l'encoche de
  // la voisine) → paroi continue sans trou.
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
              className={`h-full w-[42vw] shrink-0 [margin-right:-16.8vw] ${glass}`}
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
    <PageShell path="/" locale={l} hideFooter>
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
          wreckedSrc="/hero-truck-empty.webp"
          revealSrc="/hero-truck-loaded.webp"
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
          Constat metier — cadre MANIFESTE (reference landonorris fournie en
          video par le client). Meme mecanique que la reference : le hero
          (portrait / depanneuse epinglee) se libere, puis CETTE section
          plein cadre defile par-dessous — grand bloc de texte CENTRE qui
          remplit l'ecran sur le fond sombre. On ne l'a PAS mis dans le hero
          epingle : la progression framer d'une piste GSAP-pin culmine puis
          REDESCEND avant d'atteindre 1.0 tant qu'elle est visible, donc un
          fondu interne ne tenait jamais plein a l'ecran. Une section
          autonome, elle, defile de maniere fiable (flux natif), exactement
          comme le manifeste de la reference qui suit le portrait.

          data-stage : reveal en profondeur en palier Full, fondu simple en
          Lite, rien en Static (le texte rendu serveur suffit). h2 : reprend
          la hierarchie apres le h1 sr-only.
        */}
        <div data-stage="">
          <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-24 text-center">
            <h2 className="max-w-[15ch] font-display text-5xl font-bold leading-[0.95] tracking-tight text-text sm:text-6xl md:text-7xl lg:text-[7rem]">
              {c.problem.title}
            </h2>
            <p className="mt-8 max-w-[52ch] text-base leading-relaxed text-muted md:text-lg">
              {c.problem.body}
            </p>
          </section>
        </div>

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

        {/* Galerie de missions « pile → grille » (composant 21st.dev adapte)
            juste avant le CTA final. Client component autonome (framer-motion),
            hors piste horizontale. */}
        <ExpandableGallery />

        {/* Section finale « plein cadre » (retour client, calquee sur
            landonorris.com) : remplace l'ancien CTA video. Panneau sombre a
            encoche, titre collage, depanneuse, colonnes, frise et CTA a
            cheval sur le bord bas. Composant autonome, hors data-stage (il
            porte sa propre choregraphie d'entree). */}
        <HeroAlo locale={l} />
      </main>
    </PageShell>
  );
}
