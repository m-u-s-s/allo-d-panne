'use client';

import * as React from 'react';

/**
 * Coque client du header flottant. Le CONTENU du header (marque, nav,
 * langues, bouton d'appel) reste rendu serveur — SiteHeader le passe en
 * children, la coque n'apporte que le comportement :
 *
 * - transparent en haut de page, verre flou (backdrop-blur) des 24 px ;
 * - se cache au scroll vers le bas (passe 160 px), reapparait au
 *   moindre scroll vers le haut — hysteresis de 8 px contre le jitter ;
 * - menu mobile anime (le mobile n'avait AUCUNE nav : elle vivait dans
 *   le footer — constat de l'audit UX), hamburger qui morphe en croix.
 *
 * Garde-fous d'accessibilite, non negociables :
 * - jamais cache si le focus clavier vit dans le header (focusin le
 *   revele), ni menu ouvert, ni prefers-reduced-motion ;
 * - le menu est un <details>/<summary> NATIF : il s'ouvre sans
 *   JavaScript (contrat finding 5 — l'e2e no-JS l'exige), expose son
 *   etat aux lecteurs d'ecran nativement, et son contenu ferme est
 *   hors arbre a11y et hors tabulation par le navigateur lui-meme.
 *   React n'enrichit que : Echap (ferme + focus au summary), libelle
 *   localise par etat, fond verre pendant l'ouverture ;
 * - le panneau est une landmark <nav> distincte (nom different de la
 *   nav principale — l'unicite role+nom est une regle axe).
 *
 * `tone="light"` (accueil : sommet creme) re-teinte le texte en encre a
 * l'etat transparent via globals.css — les enfants restent serveur, on
 * ne les convertit pas pour une couleur. data-scrolled reflete
 * scrolled OU menu ouvert : panneau ouvert = fond verre, texte clair.
 *
 * La conversion ne depend pas de ce header sur mobile : StickyCallBar
 * (fixe en bas, testee e2e) porte l'appel meme header cache.
 */
export function HeaderShell({
  tone,
  menu,
  menuOpenLabel,
  menuCloseLabel,
  children,
}: {
  tone: 'light' | 'dark';
  /** Panneau mobile (landmark <nav> complete), rendu serveur. */
  menu: React.ReactNode;
  menuOpenLabel: string;
  menuCloseLabel: string;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const burgerRef = React.useRef<HTMLElement>(null);
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const lastY = React.useRef(0);
  const raf = React.useRef(0);
  const reduced = React.useRef(false);

  React.useEffect(() => {
    // matchMedia absent en jsdom : la coque reste inerte (header
    // toujours visible) — meme garde que tier.ts.
    if (typeof window.matchMedia === 'function') {
      reduced.current = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
    }
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const y = window.scrollY;
        setScrolled(y > 24);
        const dy = y - lastY.current;
        if (Math.abs(dy) < 8) return; // hysteresis anti-jitter
        lastY.current = y;
        if (reduced.current) return; // reduced-motion : jamais cache
        if (dy > 0 && y > 160) {
          // jamais cache sous le focus clavier
          if (!headerRef.current?.contains(document.activeElement)) {
            setHidden(true);
          }
        } else {
          setHidden(false);
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Tabuler dans un header cache doit le reveler (WCAG 2.4.7 : le focus
  // doit etre visible — un lien focalise sous un header translate ne
  // l'est pas).
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const reveal = () => setHidden(false);
    el.addEventListener('focusin', reveal);
    return () => el.removeEventListener('focusin', reveal);
  }, []);

  // Echap ferme le menu (en fermant le <details> natif) et rend le
  // focus au summary qui l'a ouvert.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailsRef.current) detailsRef.current.open = false;
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const glass = scrolled || open;

  return (
    <header
      ref={headerRef}
      data-tone={tone}
      data-scrolled={glass ? 'true' : 'false'}
      // `translate` et non `transform` : Tailwind v4 emet la propriete
      // CSS translate pour -translate-y-full — une transition declaree
      // sur transform ne l'animerait pas (constate : hide instantane).
      className={`sticky top-0 z-40 transition-[translate,background-color,border-color,box-shadow] duration-300 ease-out ${
        hidden && !open ? '-translate-y-full' : 'translate-y-0'
      } ${
        glass
          ? 'border-b border-border/70 bg-bg/70 shadow-lg shadow-black/20 backdrop-blur-md'
          : tone === 'light'
            ? // « transparent » sur sommet clair = voile creme quasi
              // invisible sur le hero creme, mais ANCETRE calculable :
              // axe evalue le contraste du texte encre contre ce voile
              // (deterministe), pas contre le body sombre derriere —
              // sans lui, sa passe de scroll attrapait la course entre
              // son analyse et la bascule d'etat (violations flaky).
              'border-b border-transparent bg-[#efefe5]/70 backdrop-blur-sm'
            : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {children}
        <details
          ref={detailsRef}
          className="hdr-menu md:hidden"
          onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary
            ref={burgerRef as React.Ref<HTMLElement>}
            aria-label={open ? menuCloseLabel : menuOpenLabel}
            className="-mr-2 flex h-11 w-11 shrink-0 cursor-pointer list-none items-center justify-center rounded-md text-text [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden="true" className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-200 ${
                  open ? 'translate-y-[6px] rotate-45' : ''
                }`}
              />
              {/* barre basse plus courte (detail editorial), pleine en croix */}
              <span
                className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-current transition-all duration-200 ${
                  open ? 'w-5 -translate-y-[6px] -rotate-45' : 'w-3.5'
                }`}
              />
            </span>
          </summary>
          {/* panneau : verre propre (le header peut etre transparent
              au-dessus) ; l'animation d'entree vient de @starting-style
              (globals.css) — details ferme = display:none natif. */}
          <div className="hdr-panel absolute inset-x-0 top-full border-b border-border/70 bg-bg/90 backdrop-blur-xl">
            {menu}
          </div>
        </details>
      </div>
    </header>
  );
}
