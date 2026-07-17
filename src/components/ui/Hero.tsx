import Image from 'next/image';
import { getContent } from '@/content';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';

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
        Voile lateral plutot que vertical : le texte vit a gauche, on
        l'assombrit ; la droite reste claire pour laisser passer le
        gyrophare. Un voile vertical opaque en bas masquait tout le canvas.
      */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16">
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

        <div className="mt-8 flex flex-wrap items-center gap-4">
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
    </section>
  );
}
