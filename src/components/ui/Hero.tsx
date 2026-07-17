import Image from 'next/image';
import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';
import { TruckMount } from './TruckMount';

/**
 * Le poster est le LCP. Le WebGL (Plan 2) se pose PAR-DESSUS via le
 * canvas racine, sans jamais entrer dans le chemin de rendu initial.
 * C'est ce qui permet d'avoir l'ambition visuelle desktop sans sacrifier
 * le client immobilise en 4G degradee.
 *
 * Ce composant n'importe rien de Three.js. Verifie par test.
 *
 * EMPILEMENT — l'ordre ci-dessous est le contrat avec le canvas racine,
 * pas une preference esthetique :
 *
 *   -z-20  le poster            (le LCP, toujours rendu serveur)
 *   -z-10  le canvas WebGL      (fixed, dans le layout, hors de ce fichier)
 *    auto  le voile de contraste
 *    z-10  le texte et les CTA
 *
 * Pas d'`isolate` sur la section : il creerait un contexte d'empilement
 * qui piegerait le poster AU-DESSUS du canvas racine, et le WebGL
 * disparaitrait derriere lui. Le voile, lui, reste au-dessus du canvas —
 * c'est ce qui garantit le contraste du texte quoi que dessine le shader.
 */
export function Hero({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden">
      <Image
        src="/hero-poster.webp"
        alt={c.hero.posterAlt}
        fill
        priority
        fetchPriority="high"
        quality={90}
        sizes="100vw"
        className="-z-20 object-cover"
      />
      {/*
        Depanneuse filaire en ARRIERE-PLAN du hero, pleine surface. Le
        canvas est transparent (variant backdrop) : la brume et le
        gyrophare WebGL transparaissent entre les fils. Elle vit sous le
        voile et sous le texte ; le drag fonctionne sur le vide, jamais
        au detriment du texte, et la molette y est desactivee — le
        scroll de page gagne toujours. Palier Full uniquement, chargee
        apres hydratation, invisible au LCP.
      */}
      {/*
        opacity-50 : un fond doit rester un fond. A pleine intensite, les
        fils blancs traversent le sous-titre et les CTA — verifie en
        capture, illisible.
      */}
      <div className="absolute inset-0 z-0 opacity-50">
        <TruckMount variant="backdrop" />
      </div>

      {/*
        Deux voiles AU-DESSUS du camion, SOUS le texte : un vertical pour
        l'assise generale, un radial cale sur le bloc de texte centre —
        c'est lui qui garantit la lisibilite quoi que dessinent le shader
        et le filaire. pointer-events-none : les clics traversent
        jusqu'au canvas du camion.
      */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-bg via-bg/40 to-bg/15" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(58%_62%_at_50%_52%,rgba(10,14,20,0.8),transparent_72%)]" />

      {/*
        Le texte s'integre PAR-DESSUS l'arriere-plan (z-10), centre,
        au lieu d'occuper une colonne a gauche.
      */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-cta">
          <span
            className="inline-block h-2 w-2 rounded-full bg-cta"
            aria-hidden="true"
          />
          {c.hero.eyebrow}
        </p>

        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {c.hero.title}
        </h1>

        {/* max-w-[60ch] : 65-75 caracteres par ligne max (regle UX) */}
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          {c.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <CallButton label={c.hero.callCta} variant="primary" showNumber />
          <a
            href={getPathname({ href: '/contact', locale })}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-6 py-3 text-base text-text transition-colors duration-200 hover:border-cta hover:text-cta"
          >
            {c.hero.quoteCta}
          </a>
        </div>

        <p className="mt-4 text-sm text-muted">{c.hero.availability}</p>
      </div>

      {/*
        Indicateur de scroll : deux chevrons semi-transparents qui pulsent
        vers le bas en cascade. La premiere version etait un trait de 1 px
        — present dans le DOM, anime, et pourtant invisible a l'ecran :
        un indicateur doit etre RECONNAISSABLE, pas seulement exister.
        CSS pur : il vit dans tous les paliers, y compris Static. Avec
        prefers-reduced-motion, la regle globale fige l'animation sur son
        etat de repos : chevrons statiques a faible opacite, l'affordance
        reste sans le mouvement. aria-hidden : purement decoratif.
      */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
      >
        <svg
          className="scroll-chevron h-4 w-7 text-cta"
          viewBox="0 0 28 14"
          fill="none"
        >
          <path
            d="M3 3l11 8 11-8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className="scroll-chevron scroll-chevron-delayed -mt-1.5 h-4 w-7 text-cta"
          viewBox="0 0 28 14"
          fill="none"
        >
          <path
            d="M3 3l11 8 11-8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
