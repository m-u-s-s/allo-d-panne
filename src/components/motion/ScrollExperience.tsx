'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { scrollState } from '@/components/canvas/scroll-state';
import { useTier } from '@/components/canvas/useTier';

/**
 * Le systeme de scroll du site — la transposition de la recette des sites
 * primes (reference analysee : risk.film) dans NOS contraintes.
 *
 * La recette de reference tient en trois morceaux :
 *   1. Lenis donne du poids au scroll (inertie, arrivees amorties) ;
 *   2. le fond WebGL ne defile pas, il REAGIT (la velocite nourrit le
 *      shader via scrollState) ;
 *   3. les sections ne descendent pas betement : l'entrante se revele
 *      depuis la profondeur (scale 1.05 -> 1, remontee, ouverture d'un
 *      cadre clip-path), la sortante s'y enfonce (scale 0.95, fondu).
 *   Le tout n'anime QUE transform / opacity / clip-path — jamais de
 *   layout, exactement comme le bundle de reference (scale, opacity,
 *   yPercent en tete de ses proprietes animees).
 *
 * Degradation par palier (spec section 3.2) :
 *   - Full  : Lenis + transitions scrubbed + reaction shader.
 *   - Lite  : reveals d'entree joues une fois (pas de scrub par frame,
 *             pas de Lenis) — l'orchestration sans le cout.
 *   - Static: CE COMPOSANT REND NULL. Rien n'est charge, rien n'est
 *             anime. Le contenu, rendu serveur, est deja complet.
 *
 * Volontairement SANS pinning : les pin-spacers changent la longueur de
 * page (fragile pour le test e2e « scroll en bas -> footer visible »),
 * se comportent mal sur mobile, et supposent des sections pleine hauteur
 * — les notres ont des hauteurs libres. La profondeur vient des
 * transformations, pas de l'epinglage.
 *
 * GSAP et Lenis n'entrent JAMAIS dans le bundle initial : imports
 * dynamiques dans l'effet, apres hydratation. Le budget « JS initial
 * < 100 ko » (spec section 9) ne les voit pas.
 */
export function ScrollExperience() {
  const tier = useTier();
  // Monte dans le layout, ce composant survit aux navigations client :
  // les sections [data-stage] de la page precedente meurent, celles de la
  // nouvelle n'ont pas de triggers. pathname dans les deps refait donc
  // toute l'installation a chaque route — le cleanup tue les triggers
  // orphelins, la re-execution decouvre les nouvelles sections.
  const pathname = usePathname();
  const progressBar = useRef<HTMLDivElement>(null);
  // Premiere execution = chargement initial de la page (le HTML etait
  // visible avant l'hydratation). Les suivantes = navigations client,
  // ou le DOM arrive avec JS deja pret.
  const firstRun = useRef(true);

  useEffect(() => {
    if (tier === 'static') return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const teardown: Array<() => void> = [];
      const stages = gsap.utils.toArray<HTMLElement>('[data-stage]');
      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]');

      // ----- Lenis : palier Full uniquement (spec). ------------------
      if (tier === 'full') {
        const { default: Lenis } = await import('lenis');
        if (cancelled) return;

        // autoRaf coupe : UNE seule boucle (le ticker GSAP) pilote
        // Lenis ET ScrollTrigger, sinon les deux rAF se marchent dessus
        // et le scrub vibre.
        const lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
        lenis.on('scroll', ScrollTrigger.update);

        const raf = (time: number) => {
          lenis.raf(time * 1000);
          scrollState.velocity = lenis.velocity;
        };
        gsap.ticker.add(raf);
        // Lenis lisse deja ; le lag smoothing GSAP par-dessus cree des
        // a-coups apres un blocage de main thread.
        gsap.ticker.lagSmoothing(0);

        teardown.push(() => {
          gsap.ticker.remove(raf);
          lenis.destroy();
          scrollState.velocity = 0;
        });
      }

      // ----- Progression globale + barre. ----------------------------
      const bar = progressBar.current;
      const progressTrigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          scrollState.progress = self.progress;
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
        },
      });
      teardown.push(() => progressTrigger.kill());

      // ----- Entree du hero. -------------------------------------------
      // Le HTML sert le texte VISIBLE : le LCP est mesure sur le premier
      // rendu, l'entree se rejoue par-dessus apres hydratation. Garde
      // anti-blink : au chargement initial, si l'hydratation arrive
      // tard (page lente, texte deja lu depuis des secondes), cacher le
      // texte pour rejouer l'entree serait pire que pas d'animation —
      // on s'abstient. En navigation client, le DOM et JS arrivent
      // ensemble : on joue toujours.
      let intro: gsap.core.Timeline | undefined;
      const revealEls = gsap.utils.toArray<HTMLElement>('[data-hero-reveal]');
      const maskEls = gsap.utils.toArray<HTMLElement>('[data-hero-reveal-mask]');
      const revealBg = document.querySelector<HTMLElement>('[data-hero-reveal-bg]');
      const playIntro = !firstRun.current || performance.now() < 2500;
      firstRun.current = false;

      if (playIntro && (revealEls.length || maskEls.length)) {
        const introTargets = [
          ...revealEls,
          ...maskEls,
          ...(revealBg ? [revealBg] : []),
        ];
        intro = gsap.timeline({
          defaults: { ease: 'power3.out' },
          // Rend le DOM vierge de tout style inline une fois l'entree
          // finie : l'etat final EST l'etat serveur.
          onComplete: () => gsap.set(introTargets, { clearProps: 'all' }),
        });
        if (revealBg) {
          intro.from(revealBg, { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0);
        }
        // Montee masquee du titre : l'overflow-hidden du parent (dans le
        // JSX du hero) fait le masque, on ne deplace que le texte.
        if (maskEls.length) {
          intro.from(
            maskEls,
            { yPercent: 112, duration: 1.05, ease: 'power4.out' },
            0.2,
          );
        }
        intro.from(
          revealEls,
          { y: 26, opacity: 0, duration: 0.8, stagger: 0.11 },
          0.12,
        );
      }

      // ----- Transitions de sections. ---------------------------------
      const tweens: gsap.core.Tween[] = [];

      // ----- Defilement horizontal (Full) : les sections du milieu ----
      // glissent vers la GAUCHE pendant que la page defile en Y. La
      // piste est epinglee le temps de sa traversee ; la distance de
      // scroll vertical consommee egale la distance horizontale
      // parcourue, donc la vitesse percue reste celle de la molette.
      if (tier === 'full') {
        const wrapper = document.querySelector<HTMLElement>('[data-hscroll]');
        const track = wrapper?.querySelector<HTMLElement>(
          '[data-hscroll-track]',
        );
        if (wrapper && track) {
          // C'est CET attribut qui fait passer la mise en page en rangee
          // de panneaux plein ecran (globals.css). Le HTML reste vertical
          // pour tous les autres paliers — l'etat degrade est l'etat par
          // defaut, pas un repli.
          wrapper.setAttribute('data-hscroll', 'on');
          teardown.push(() => wrapper.setAttribute('data-hscroll', ''));

          // Fonctionnel + invalidateOnRefresh : recalcule au resize, la
          // piste ne se decadre jamais.
          const dist = () => track.scrollWidth - window.innerWidth;

          const horiz = gsap.to(track, {
              x: () => -dist(),
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: () => `+=${dist()}`,
                scrub: 0.7,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // Aimantation par panneau (demande client) : en fin de
                // molette, la piste se pose sur le panneau le plus
                // proche — jamais arretee entre deux sections. Les
                // increments viennent du nombre reel de panneaux.
                snap: {
                  snapTo: 1 / (track.children.length - 1),
                  duration: { min: 0.3, max: 0.8 },
                  ease: 'power2.inOut',
                  delay: 0.15,
                },
              },
            });
          tweens.push(horiz);

          // ----- Choregraphie par panneau (demande client) : les
          // enfants de chaque panneau se revelent en cascade quand SON
          // bord entre a l'ecran pendant la traversee (containerAnimation
          // — les seuils se calculent dans l'espace de la piste animee).
          // Le panneau 1 est deja en scene a l'epinglage : il se revele
          // a l'approche VERTICALE, sinon sa cascade serait consommee
          // avant l'arrivee. Selecteur cure : jamais un parent ET son
          // enfant (li mais pas li>p) — sinon les fondus se composent.
          const CHORE_SEL =
            'h2, section > p, section > div > p, li, article, dl > div';
          const panelKids: HTMLElement[] = [];
          Array.from(track.children).forEach((panel, i) => {
            const kids = gsap.utils.toArray<HTMLElement>(
              (panel as HTMLElement).querySelectorAll(CHORE_SEL),
            );
            if (!kids.length) return;
            panelKids.push(...kids);
            tweens.push(
              gsap.from(kids, {
                opacity: 0,
                y: 36,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.06,
                scrollTrigger:
                  i === 0
                    ? { trigger: panel as HTMLElement, start: 'top 75%' }
                    : {
                        trigger: panel as HTMLElement,
                        containerAnimation: horiz,
                        start: 'left 78%',
                        toggleActions: 'play none none reverse',
                      },
              }),
            );
          });
          teardown.push(() => {
            if (panelKids.length) gsap.set(panelKids, { clearProps: 'all' });
          });

          // Le ruban de chevrons n'est PLUS pilote au scroll (retour
          // client : il defile en continu vers la droite, animation CSS
          // seamless — voir .chevron-marquee dans globals.css). GSAP ne
          // le touche pas, sinon sa transform de scrub ecraserait celle
          // de la marquee.
        }
      }

      for (const el of stages) {
        const isHero = el.dataset.stage === 'hero';

        // Entree : la section arrive de la profondeur, cadree par un
        // clip arrondi qui s'ouvre. Pas pour le hero : il est deja la au
        // chargement, et c'est le LCP — on ne lui applique aucun etat
        // initial.
        if (!isHero) {
          if (tier === 'full') {
            tweens.push(
              gsap.fromTo(
                el,
                {
                  opacity: 0.15,
                  scale: 0.96,
                  yPercent: 7,
                  clipPath: 'inset(7% 5% 2% 5% round 28px)',
                },
                {
                  opacity: 1,
                  scale: 1,
                  yPercent: 0,
                  clipPath: 'inset(0% 0% 0% 0% round 0px)',
                  ease: 'none',
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 94%',
                    end: 'top 42%',
                    scrub: 0.6,
                  },
                },
              ),
            );
          } else {
            // Lite : le meme vocabulaire visuel, joue une fois a
            // l'entree — aucun travail par frame ensuite.
            tweens.push(
              gsap.from(el, {
                opacity: 0,
                y: 48,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%' },
              }),
            );
          }
        }

        // Sortie (Full) : la section quitte le plan par la profondeur.
        // C'est elle qui fait le « changement de section » : pendant
        // qu'elle s'enfonce, la suivante se revele par-dessus, et le
        // gyrophare respire entre les deux.
        if (tier === 'full') {
          tweens.push(
            gsap.fromTo(
              el,
              { opacity: 1, scale: 1, yPercent: 0 },
              {
                opacity: 0.2,
                scale: 0.955,
                yPercent: -5,
                ease: 'none',
                // Sans immediateRender:false, ce fromTo appliquerait son
                // etat initial a l'init et ecraserait celui du tween
                // d'entree qui partage opacity/scale.
                immediateRender: false,
                scrollTrigger: {
                  trigger: el,
                  start: 'bottom 38%',
                  end: 'bottom -10%',
                  scrub: 0.6,
                },
              },
            ),
          );
        }
      }

      // Lite : la piste reste verticale (pas de scrub par frame), mais
      // chaque panneau garde le vocabulaire d'entree, joue une fois.
      if (tier === 'lite') {
        for (const el of panels) {
          tweens.push(
            gsap.from(el, {
              opacity: 0,
              y: 48,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%' },
            }),
          );
        }
      }

      teardown.push(() => {
        // Une navigation en pleine entree ne doit pas laisser du texte
        // fige a moitie cache.
        if (intro) {
          intro.kill();
          gsap.set(
            [...revealEls, ...maskEls, ...(revealBg ? [revealBg] : [])],
            { clearProps: 'all' },
          );
        }
        for (const t of tweens) {
          t.scrollTrigger?.kill();
          t.kill();
        }
        // Rend le DOM tel que le serveur l'avait produit : sans ca, un
        // changement de palier a chaud laisserait des sections figees en
        // demi-transition.
        gsap.set([...stages, ...panels], { clearProps: 'all' });
      });

      // Les polices (next/font, swap) et images arrivent apres l'init et
      // decalent les positions de declenchement calculees.
      const refresh = () => ScrollTrigger.refresh();
      if (document.readyState === 'complete') refresh();
      else {
        window.addEventListener('load', refresh, { once: true });
        teardown.push(() => window.removeEventListener('load', refresh));
      }

      cleanup = () => {
        for (const fn of teardown.reverse()) fn();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
      scrollState.velocity = 0;
      scrollState.progress = 0;
    };
  }, [tier, pathname]);

  if (tier === 'static') return null;

  return (
    // Barre de progression : une ligne ambre d'un pixel sous le header.
    // scaleX pilote par ScrollTrigger — transform seul, jamais de layout.
    <div
      ref={progressBar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left bg-cta"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
