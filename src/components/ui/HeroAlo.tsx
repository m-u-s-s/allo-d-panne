'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';
import { company, isResolved } from '@/content/company';
import { ContourLayer } from './scroll-assembly-hero';

/**
 * HeroAlo — panneau final « plein cadre » de l'accueil, calque sur la
 * composition de la reference (landonorris.com) fournie par le client :
 * grand panneau sombre a coins tres arrondis pose sur un fond clair, encoche
 * concave au centre du bord haut, titre geant en collage typographique
 * (grotesque grasse + serif accent lime), signature reelle en overlay, la
 * depanneuse qui emerge du bas derriere le titre, deux colonnes laterales
 * (pages / reseaux), frise de reassurance, CTA pilule a cheval sur le bord
 * bas, et un pied de section fin.
 *
 * Palette « neon » : panneau olive tres sombre #171912, accent VERT #2DFF00
 * (couleur principale du site, retour client 2026-07-22 — remplace l'ancien
 * lime/orange), texte #F4F4F4 / secondaire #9A9A9A. La signature et tous les
 * accents du site partagent desormais ce meme vert.
 *
 * Composant autonome et TRILINGUE : sa copie vit dans COPY[locale] plutot
 * que dans le systeme de contenu partage (il ne sert qu'ici). Les liens
 * internes passent par getPathname (slugs localises) ; les reseaux ne
 * listent que les URLs REELLES de company.socials (jamais de handle
 * invente — Instagram/Google absents tant que le client ne les fournit pas).
 *
 * Degradation : framer respecte prefers-reduced-motion (rien ne bouge, tout
 * est visible d'emblee) ; sans JS le HTML reste complet (le panneau, le
 * texte, les liens et le CTA existent — seules les entrees animees sont
 * neutralisees).
 */

type TitlePart = { t: string; accent?: boolean };
type LinkItem = { label: string; href: string };

const COPY: Record<
  Locale,
  {
    title: TitlePart[];
    pagesLabel: string;
    pages: LinkItem[];
    urgence: string;
    followLabel: string;
    devis: string;
    menu: string;
    ctaLabel: string;
    reassurance: string[];
    rights: string;
    legal: LinkItem[];
  }
> = {
  fr: {
    title: [
      { t: 'TOUJOURS ' },
      { t: 'LÀ', accent: true },
      { t: ' QUAND ÇA ' },
      { t: 'LÂCHE', accent: true },
      { t: '.' },
    ],
    pagesLabel: 'PAGES',
    pages: [
      { label: 'ACCUEIL', href: '/' },
      { label: 'SERVICES', href: '/services' },
      { label: "ZONE D'INTERVENTION", href: '/zones' },
      { label: 'TARIFS', href: '/tarifs' },
    ],
    urgence: 'URGENCE',
    followLabel: 'SUIVEZ-NOUS',
    devis: 'DEVIS',
    menu: 'Menu',
    ctaLabel: 'URGENCE',
    reassurance: [
      '24H/24 · 7J/7',
      'INTERVENTION ASSURÉE',
      'DEVIS GRATUIT',
      'BRUXELLES & PÉRIPHÉRIE',
      'TRANSPORT EUROPE',
    ],
    rights: '© 2026 Allo-Dépannage. Tous droits réservés.',
    legal: [
      { label: 'CONFIDENTIALITÉ', href: '/confidentialite' },
      { label: 'MENTIONS LÉGALES', href: '/mentions-legales' },
    ],
  },
  nl: {
    title: [
      { t: 'ALTIJD ' },
      { t: 'ER', accent: true },
      { t: ' ALS HET ' },
      { t: 'MISLOOPT', accent: true },
      { t: '.' },
    ],
    pagesLabel: "PAGINA'S",
    pages: [
      { label: 'HOME', href: '/' },
      { label: 'DIENSTEN', href: '/services' },
      { label: 'INTERVENTIEZONE', href: '/zones' },
      { label: 'TARIEVEN', href: '/tarifs' },
    ],
    urgence: 'NOODGEVAL',
    followLabel: 'VOLG ONS',
    devis: 'OFFERTE',
    menu: 'Menu',
    ctaLabel: 'NOODGEVAL',
    reassurance: [
      '24U/24 · 7D/7',
      'VERZEKERDE INTERVENTIE',
      'GRATIS OFFERTE',
      'BRUSSEL & RAND',
      'TRANSPORT EUROPA',
    ],
    rights: '© 2026 Allo-Dépannage. Alle rechten voorbehouden.',
    legal: [
      { label: 'PRIVACY', href: '/confidentialite' },
      { label: 'JURIDISCHE INFO', href: '/mentions-legales' },
    ],
  },
  en: {
    title: [
      { t: 'ALWAYS ' },
      { t: 'THERE', accent: true },
      { t: ' WHEN IT ' },
      { t: 'BREAKS', accent: true },
      { t: '.' },
    ],
    pagesLabel: 'PAGES',
    pages: [
      { label: 'HOME', href: '/' },
      { label: 'SERVICES', href: '/services' },
      { label: 'SERVICE AREA', href: '/zones' },
      { label: 'PRICING', href: '/tarifs' },
    ],
    urgence: 'EMERGENCY',
    followLabel: 'FOLLOW US',
    devis: 'QUOTE',
    menu: 'Menu',
    ctaLabel: 'EMERGENCY',
    reassurance: [
      '24/7',
      'INSURED INTERVENTION',
      'FREE QUOTE',
      'BRUSSELS & AROUND',
      'EUROPE TRANSPORT',
    ],
    rights: '© 2026 Allo-Dépannage. All rights reserved.',
    legal: [
      { label: 'PRIVACY', href: '/confidentialite' },
      { label: 'LEGAL', href: '/mentions-legales' },
    ],
  },
};

const ACCENT = '#2DFF00';
const PANEL_BG = '#F2F4E6'; // couleur du fond clair au niveau du bord haut (encoche)

export function HeroAlo({ locale }: { locale: Locale }) {
  const reduced = useReducedMotion();
  const t = COPY[locale] ?? COPY.fr;

  // Reseaux : uniquement les URLs REELLES (temporaires cote client) —
  // aucun handle invente. Ordre affiche stable.
  const socials = (
    [
      { label: 'FACEBOOK', field: company.socials.facebook },
      { label: 'TIKTOK', field: company.socials.tiktok },
      { label: 'LINKEDIN', field: company.socials.linkedin },
    ] as const
  ).filter((s) => isResolved(s.field));

  const linkFor = (href: string) => getPathname({ href, locale });

  // Entree (whileInView) : la section est en bas de page, on la joue quand
  // elle entre. reduced-motion → pas d'etat initial, tout visible.
  const rise = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
      };

  return (
    <section
      aria-label="Allo-Dépannage"
      className="relative isolate w-full overflow-hidden px-3 pb-20 pt-3 sm:px-5 sm:pt-5"
      style={{ background: 'linear-gradient(180deg, #F2F4E6 0%, #E7EEC4 100%)' }}
    >
      <div className="relative mx-auto flex min-h-[92vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[28px] bg-[#171912] text-[#F4F4F4] sm:rounded-[40px] lg:min-h-[94vh]">
        {/* Encoche concave organique au centre du bord haut : un bombe
            descendant rempli de la couleur du fond clair « creuse » le
            panneau (SVG, pas un simple border-radius). */}
        <svg
          width="320"
          height="52"
          viewBox="0 0 320 52"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2"
          aria-hidden="true"
        >
          <path
            d="M0,0 L320,0 C 250,0 232,50 160,50 C 88,50 70,0 0,0 Z"
            fill={PANEL_BG}
          />
        </svg>

        {/* Lignes topographiques en filigrane (reutilise ContourLayer). */}
        <ContourLayer stroke="rgba(198,238,42,0.06)" />

        {/* Grain leger. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* ---- Barre superieure ---- */}
        <header className="relative z-20 flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <div className="leading-[0.82]">
            <span
              className="block text-2xl font-normal tracking-[-0.02em] sm:text-3xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ALLO
            </span>
            <span
              className="block text-2xl font-normal tracking-[-0.02em] sm:text-3xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              DÉPANNAGE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={linkFor('/tarifs')}
              className="inline-flex min-h-[40px] items-center rounded-full px-5 text-xs font-bold uppercase tracking-widest text-[#171912] transition-transform duration-200 hover:scale-[1.04]"
              style={{ backgroundColor: ACCENT }}
            >
              {t.devis}
            </a>
            <a
              href={linkFor('/contact')}
              aria-label={t.menu}
              className="inline-flex h-10 w-11 items-center justify-center rounded-full border border-white/25 text-[#F4F4F4] transition-colors duration-200 hover:border-white/60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-5" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </header>

        {/* ---- Zone centrale : titre + depanneuse + CTA (mobile) ----
            Mobile : flux vertical centre (titre -> sujet -> CTA) ; la barre
            d'appel fixe occupe deja le tout bas, donc le CTA vit ICI dans le
            flux plutot qu'a cheval sur le bord (sinon il chevauchait la
            barre). Desktop (lg) : composition absolue — titre en haut, sujet
            emergeant du bas, CTA a cheval (hors de cette zone). */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 lg:block lg:gap-0">
          {/* Titre + signature. */}
          <div className="relative z-10 w-full px-6 text-center lg:absolute lg:inset-x-0 lg:top-[7%]">
            {/* Signature reelle, overlay au-dessus du titre, ~ -3°. */}
            <motion.img
              src="/signature-ad.webp"
              alt=""
              aria-hidden="true"
              draggable={false}
              initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
              whileInView={reduced ? undefined : { clipPath: 'inset(0 0% 0 0)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.1, ease: [0.65, 0.05, 0, 1], delay: 0.35 }}
              className="pointer-events-none absolute -top-[3rem] left-1/2 w-[min(40%,160px)] -translate-x-1/2 -rotate-3 select-none lg:-top-[5.5rem] lg:left-[54%] lg:w-[min(38%,300px)]"
            />

            <motion.h2
              {...(reduced
                ? {}
                : {
                    initial: 'hidden',
                    whileInView: 'show',
                    viewport: { once: true, amount: 0.4 },
                    variants: {
                      hidden: {},
                      show: { transition: { staggerChildren: 0.08 } },
                    },
                  })}
              className="mx-auto max-w-[13ch] text-[12vw] uppercase leading-[0.9] tracking-[-0.02em] sm:max-w-[14ch] sm:text-[9vw] md:text-[clamp(3rem,8.6vw,7.2rem)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t.title.map((part, i) => (
                <motion.span
                  key={i}
                  variants={
                    reduced
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 24 },
                          show: { opacity: 1, y: 0 },
                        }
                  }
                  className="inline"
                  style={
                    part.accent
                      ? {
                          color: ACCENT,
                          fontFamily: 'var(--font-instrument), serif',
                          fontStyle: 'italic',
                          textTransform: 'none',
                        }
                      : undefined
                  }
                >
                  {part.t}
                </motion.span>
              ))}
            </motion.h2>
          </div>

          {/* Depanneuse : sous le titre (mobile) / emergeant du bas (lg),
              DERRIERE le titre. */}
          <div className="pointer-events-none relative z-0 flex w-full justify-center lg:absolute lg:inset-x-0 lg:bottom-0">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 40 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[3/2] w-[96%] max-w-[440px] sm:w-[74%] sm:max-w-none lg:w-[min(64%,660px)]"
            >
              <Image
                src="/hero-truck-loaded.webp"
                alt=""
                fill
                sizes="(max-width: 1024px) 92vw, 660px"
                className="object-contain object-bottom"
              />
            </motion.div>
          </div>

          {/* CTA d'urgence — MOBILE uniquement, dans le flux (le desktop a
              son CTA a cheval sur le bord ; ici on evite la barre d'appel
              fixe du bas). Pleine largeur, cible tactile confortable. */}
          <div className="flex w-full justify-center px-6 lg:hidden">
            <a
              href={TEL_HREF}
              className="inline-flex min-h-[48px] w-full max-w-[360px] items-center justify-center gap-3 rounded-full px-6 text-sm font-bold uppercase tracking-widest text-[#171912] shadow-lg transition-transform duration-200 active:scale-[0.98]"
              style={{ backgroundColor: ACCENT }}
            >
              <span>{t.ctaLabel}</span>
              <span className="font-mono tabular-nums">{PHONE_NATIONAL}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* ---- Colonnes laterales (desktop) ---- */}
        <motion.nav
          {...rise}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          aria-label={t.pagesLabel}
          className="absolute bottom-[26%] left-8 z-20 hidden lg:block xl:left-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A9A9A]">
            {t.pagesLabel}
          </p>
          <ul className="mt-4 space-y-2">
            {t.pages.map((p) => (
              <li key={p.href}>
                <a
                  href={linkFor(p.href)}
                  className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F4] transition-colors hover:text-[#2DFF00]"
                >
                  {p.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href={TEL_HREF}
                className="text-lg font-extrabold uppercase tracking-tight"
                style={{ color: ACCENT }}
              >
                {t.urgence}
              </a>
            </li>
          </ul>
        </motion.nav>

        <motion.div
          {...rise}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          className="absolute bottom-[26%] right-8 z-20 hidden text-right lg:block xl:right-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A9A9A]">
            {t.followLabel}
          </p>
          <ul className="mt-4 space-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={isResolved(s.field) ? s.field.value : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F4] transition-colors hover:text-[#2DFF00]"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ---- Frise de reassurance ---- */}
        <div className="relative z-20 mt-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 pb-6 pt-4">
          {t.reassurance.map((r) => (
            <span
              key={r}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]"
            >
              {r}
            </span>
          ))}
        </div>

        {/* ---- Pied de section ---- */}
        <footer className="relative z-20 flex flex-col items-center justify-between gap-2 border-t border-white/10 px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-[#9a9a92] sm:flex-row sm:px-10">
          <span>{t.rights}</span>
          <span className="flex gap-4">
            {t.legal.map((l) => (
              <a key={l.href} href={linkFor(l.href)} className="hover:text-[#F4F4F4]">
                {l.label}
              </a>
            ))}
          </span>
        </footer>
      </div>

      {/* ---- CTA pilule a cheval sur le bord bas (DESKTOP) ----
          Masque sur mobile : la barre d'appel fixe occupe le bas et le CTA
          mobile vit dans le flux du panneau. */}
      <a
        href={TEL_HREF}
        className="absolute bottom-[calc(5rem-1.4rem)] left-1/2 z-40 hidden min-h-[44px] -translate-x-1/2 items-center gap-3 rounded-full px-7 text-sm font-bold uppercase tracking-widest text-[#171912] shadow-lg transition-transform duration-200 hover:scale-[1.04] lg:inline-flex"
        style={{ backgroundColor: ACCENT }}
      >
        <span>{t.ctaLabel}</span>
        <span className="font-mono tabular-nums">{PHONE_NATIONAL}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
