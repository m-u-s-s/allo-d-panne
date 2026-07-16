import Image from 'next/image';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';
import { Link } from '@/i18n/navigation';

/**
 * Le poster est le LCP. Le WebGL (Plan 2) se posera PAR-DESSUS via le
 * canvas racine, sans jamais entrer dans le chemin de rendu initial.
 * C'est ce qui permet d'avoir l'ambition visuelle desktop sans sacrifier
 * le client immobilise en 4G degradee.
 *
 * Ce composant n'importe rien de Three.js. Verifie par test.
 */
export function Hero({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="relative isolate flex min-h-[85svh] items-center overflow-hidden">
      <Image
        src="/hero-poster.webp"
        alt={c.hero.posterAlt}
        fill
        priority
        fetchPriority="high"
        quality={90}
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />

      <div className="mx-auto w-full max-w-7xl px-4 py-16">
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
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-6 py-3 text-base text-text transition-colors duration-200 hover:border-cta hover:text-cta"
          >
            {c.hero.quoteCta}
          </Link>
        </div>

        <p className="mt-4 text-sm text-muted">{c.hero.availability}</p>
      </div>
    </section>
  );
}
