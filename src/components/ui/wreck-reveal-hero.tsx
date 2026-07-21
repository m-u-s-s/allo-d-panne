'use client';

import * as React from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from 'framer-motion';
import {
  ContourLayer,
  LaurelIcon,
  MorphingContours,
  PhoneIcon,
} from './scroll-assembly-hero';
import { MarqueeRow } from './scroll-assembly-hero';

/**
 * WreckRevealHero — hero au scroll (architecture landonorris) dont la
 * piece maitresse est une revelation avant/apres a la souris : la couche
 * de base montre une berline accidentee ; sous le curseur, dans un halo
 * doux qui le suit, la MEME voiture restauree avec la depanneuse neuve
 * garee derriere. C'est la promesse du metier en une interaction.
 *
 * ── PRODUCTION DES VRAIS ASSETS (la paire n'existe pas en stock) ─────
 * 1. Generer d'abord le master RESTAURE (texte→image, 16:10, 2560×1600,
 *    ex. Nano Banana Pro / Flux) : « Photographie studio photorealiste.
 *    Berline noire de luxe immaculee, design generique sans logo, trois
 *    quarts avant, centree, ~55 % de la largeur, sol studio uni,
 *    arriere-plan plat #EFEFE5, lumiere douce diffuse, ombre de contact
 *    subtile. Garee derriere en arriere-plan, partiellement coupee par
 *    le bord du cadre, une depanneuse a plateau neuve noire, chromes
 *    polis, rampe rangee. 16:10. »
 * 2. Deriver la version ACCIDENTEE par DEUX passes d'inpainting a
 *    masque confine (FLUX.1 Fill / Generative Fill — les pixels hors
 *    masque sont intouches PAR CONSTRUCTION, jamais par discipline de
 *    prompt) :
 *    – passe 1, masque = carrosserie seule : degats DANS la silhouette
 *      (portes cabossees, capot, pare-brise fissure, phare eclate,
 *      pneu a plat). Ne JAMAIS froisser le contour : reparer un contour
 *      deforme change la silhouette et casse l'alignement.
 *    – passe 2, masque = zone du camion : supprimer le camion, remplir
 *      en #EFEFE5 plat.
 *    Plusieurs seeds par passe, choisis PAR SCRIPT (RMSE minimal hors
 *    masque), pas a l'oeil.
 * 3. Composer dans UN document : recoller uniquement les zones editees
 *    sur le master, adoucir les coutures, exporter LES DEUX finals de ce
 *    seul document aux memes dimensions (re-echantillonner les sorties
 *    des modeles d'abord — ils changent silencieusement la resolution).
 * 4. wreckedSrc = plein cadre ; revealSrc = decoupe TRANSPARENTE plein
 *    canevas (voiture restauree + camion + ombres), meme encodeur pour
 *    les deux (AVIF/WebP q≥85, chroma 4:4:4 — le fond plat band sinon).
 * 5. Valider avec ?heroQA=1 (mode difference) : tout halo fantome hors
 *    zone voiture/camion = echec, re-exporter.
 * En attendant : deux SVG placeholder alignes par construction (meme
 * document de coordonnees) — l'effet est demontrable, pas livrable.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Mecanique de revelation : COMPOSITEUR UNIQUEMENT. Le masque radial est
 * rasterise une fois (radial-gradient statique) ; la fenetre se place et
 * se dimensionne par transforms (translate + scale) et l'image interieure
 * recoit la transform INVERSE — l'image reste verrouillee au pixel sur
 * la couche A pendant que seules des transforms animent. Jamais de
 * useState sur le chemin pointeur/scroll.
 *
 * Adaptations projet (memes raisons que scroll-assembly-hero) :
 * framer-motion, Inter, Instrument Serif deja en place, pas de lucide,
 * pilule lime = bouton d'APPEL, tokens calibres sur le vrai site
 * (#D2FF00/#EFEFE5), reduced-motion = un ecran statique restaure.
 */

interface WreckRevealHeroProps {
  /** Plein cadre : berline accidentee, fond studio plat #EFEFE5. */
  wreckedSrc: string;
  /** Decoupe transparente MEME TAILLE : voiture restauree + camion + ombres. */
  revealSrc: string;
  /** Rayon du halo pointeur, px. */
  revealRadius?: number;
  className?: string;
  marqueeSerif?: string;
  marqueeSans?: string;
  caption?: string;
  cardTitle?: string;
  cardCaption?: string;
  callHref: string;
  callLabel: string;
  callNumber: string;
  brandTop?: string;
  brandBottom?: string;
}

const MASK: React.CSSProperties = {
  WebkitMaskImage:
    'radial-gradient(circle closest-side, black 60%, transparent 100%)',
  maskImage:
    'radial-gradient(circle closest-side, black 60%, transparent 100%)',
};

export default function WreckRevealHero({
  wreckedSrc,
  revealSrc,
  revealRadius = 180,
  className = '',
  marqueeSerif = 'Alo-Dépannage',
  marqueeSans = 'En panne ? On arrive.',
  caption = 'Disponible 24h/24, 7j/7',
  cardTitle = '24/7',
  cardCaption = 'Bruxelles & périphérie',
  callHref,
  callLabel,
  callNumber,
  brandTop = 'Alo-',
  brandBottom = 'Dépannage',
}: WreckRevealHeroProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const revealRef = React.useRef<HTMLDivElement>(null);
  const windowRef = React.useRef<HTMLDivElement>(null);
  const imgARef = React.useRef<HTMLImageElement>(null);
  const imgBRef = React.useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  /* ----- Geometrie mesuree (jamais de state). ---------------------- */
  const cw = useMotionValue(0);
  const ch = useMotionValue(0);
  // RMAX = rayon plein-cadre / 0.6 : compense le feather du masque pour
  // que les coins soient opaques a la completion.
  const RMAX = useMotionValue(1200);
  React.useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const measure = () => {
      cw.set(el.clientWidth);
      ch.set(el.clientHeight);
      RMAX.set(Math.hypot(el.clientWidth, el.clientHeight) / 2 / 0.6);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cw, ch, RMAX]);

  /* ----- Pointeur : ressorts + machine a deux etats. --------------- */
  const rawMx = useMotionValue(0);
  const rawMy = useMotionValue(0);
  const mx = useSpring(rawMx, { stiffness: 300, damping: 30 });
  const my = useSpring(rawMy, { stiffness: 300, damping: 30 });

  // Gonflement par velocite : depuis les ressorts DEJA lisses, jamais
  // depuis les deltas d'evenements (trop bruites), puis re-amorti.
  const vmx = useVelocity(mx);
  const vmy = useVelocity(my);
  const speed = useTransform([vmx, vmy], (v: number[]) =>
    Math.min(Math.hypot(v[0], v[1]), 1500),
  );
  const swellRaw = useTransform(speed, [0, 1500], [1, 1.3]);
  const swell = useSpring(swellRaw, { stiffness: 60, damping: 20 });

  const pointerRadius = useMotionValue(0);
  const pr = useTransform([pointerRadius, swell], (v: number[]) => v[0] * v[1]);

  /* ----- Completion au scroll : valeur SEPAREE, combinee par max —
     le decay d'inactivite ne touche que pointerRadius, la revelation
     au scroll est monotone et ne peut jamais etre "de-revelee". ----- */
  const scrollRadius = useTransform(
    [scrollYProgress, RMAX],
    (v: number[]) => Math.min(1, v[0] / 0.38) * v[1],
  );
  const radius = useTransform([pr, scrollRadius], (v: number[]) =>
    Math.max(v[0], v[1]),
  );

  // Le centre glisse du pointeur vers le centre du cadre sur [0, 0.25] :
  // le bloom plein ecran nait du milieu, meme au tactile.
  const mixT = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const cx = useTransform(
    [mx, cw, mixT],
    (v: number[]) => v[0] + (v[1] / 2 - v[0]) * v[2],
  );
  const cy = useTransform(
    [my, ch, mixT],
    (v: number[]) => v[0] + (v[1] / 2 - v[0]) * v[2],
  );

  /* ----- Fenetre + inverse : compositeur seul. ---------------------
     Fenetre (origine centre)   : translate(cx−R, cy−R) scale(r/R)
     Interieur (origine 0 0)    : translate(R − c/s) scale(1/s)
     ⇒ l'image interieure reste identiquement posee sur la couche A. */
  const winScale = useTransform([radius, RMAX], (v: number[]) =>
    Math.max(v[0] / v[1], 0.001),
  );
  const invScale = useTransform(winScale, (s) => 1 / s);
  const winX = useTransform([cx, RMAX], (v: number[]) => v[0] - v[1]);
  const winY = useTransform([cy, RMAX], (v: number[]) => v[0] - v[1]);
  const innerX = useTransform(
    [cx, winScale, RMAX],
    (v: number[]) => v[2] - v[0] / v[1],
  );
  const innerY = useTransform(
    [cy, winScale, RMAX],
    (v: number[]) => v[2] - v[0] / v[1],
  );
  const twoR = useTransform(RMAX, (r) => r * 2);
  const winSize = useMotionTemplate`${twoR}px`;
  const cwPx = useMotionTemplate`${cw}px`;
  const chPx = useMotionTemplate`${ch}px`;

  // visibility par ABONNEMENT (pas de state) : au repos, cout nul.
  React.useEffect(() => {
    const unsub = radius.on('change', (r) => {
      const el = windowRef.current;
      if (el) el.style.visibility = r < 0.5 ? 'hidden' : 'visible';
    });
    return unsub;
  }, [radius]);

  /* ----- Ecouteurs pointeur : gate capacite + decode + machine. ---- */
  React.useEffect(() => {
    if (reduced) return;
    const el = revealRef.current;
    if (!el) return;
    // Pointeurs fins uniquement : au tactile, suivre le doigt se bat
    // avec le defilement de page (touch-action: pan-y) — la revelation
    // au scroll suffit.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    let ready = false;
    let active = false;
    let lastMove = 0;
    let anim: AnimationPlaybackControls | undefined;
    let rect: DOMRect | null = null;
    let rectFresh = false;

    // decode() des DEUX images avant d'armer la revelation : sinon le
    // premier survol paie le decodage en pleine interaction.
    Promise.all(
      [imgARef.current, imgBRef.current].map((img) =>
        img && !img.complete ? img.decode().catch(() => {}) : img?.decode().catch(() => {}),
      ),
    ).then(() => {
      ready = true;
    });

    // Le rect se remesure AU PLUS une fois par frame — jamais fige au
    // montage : le conteneur sticky bouge avec le scroll et retrecit en
    // carte pendant la phase B.
    const getRect = () => {
      if (!rectFresh) {
        rect = el.getBoundingClientRect();
        rectFresh = true;
        requestAnimationFrame(() => {
          rectFresh = false;
        });
      }
      return rect as DOMRect;
    };

    const onEnter = (e: PointerEvent) => {
      const r = getRect();
      // .jump AVANT toute croissance du rayon : le halo apparait sous
      // le curseur au lieu d'arriver en fronde depuis un coin.
      mx.jump(e.clientX - r.left);
      my.jump(e.clientY - r.top);
    };

    const onMove = (e: PointerEvent) => {
      if (!ready) return;
      // Detachement souple : une fois la revelation scroll au-dela du
      // maximum pointeur, le halo n'apporte plus rien.
      if (scrollRadius.get() > revealRadius * 1.4) return;
      const r = getRect();
      rawMx.set(e.clientX - r.left);
      rawMy.set(e.clientY - r.top);
      lastMove = performance.now();
      if (!active) {
        active = true;
        anim?.stop();
        anim = animate(pointerRadius, revealRadius, {
          duration: 0.4,
          ease: [0.65, 0.05, 0, 1],
        });
      }
    };

    const decay = () => {
      if (!active) return;
      active = false;
      anim?.stop();
      anim = animate(pointerRadius, 0, {
        duration: 0.55,
        ease: [0.65, 0.05, 0, 1],
      });
    };

    // Le halo ne vit que TANT QU'IL Y A DU MOUVEMENT : pointermove ne
    // fait que rafraichir un horodatage ; une seule minuterie decide de
    // la decroissance — deux animations par cycle, pas une par event.
    const idleTimer = window.setInterval(() => {
      if (active && performance.now() - lastMove > 400) decay();
    }, 120);

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', decay);
    return () => {
      window.clearInterval(idleTimer);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', decay);
      anim?.stop();
    };
  }, [reduced, revealRadius, mx, my, rawMx, rawMy, pointerRadius, scrollRadius]);

  /* ----- Parallaxe souris des nappes de fond. ---------------------- */
  const mouseNX = useMotionValue(0);
  const mouseNY = useMotionValue(0);
  const springNX = useSpring(mouseNX, { stiffness: 60, damping: 18 });
  const springNY = useSpring(mouseNY, { stiffness: 60, damping: 18 });
  React.useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouseNX.set(e.clientX / window.innerWidth - 0.5);
      mouseNY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mouseNX, mouseNY, reduced]);
  const blobX = useTransform(springNX, (v) => v * 24);
  const blobY = useTransform(springNY, (v) => v * 24);
  const blobXInv = useTransform(springNX, (v) => v * -24);

  /* ----- Theme, carte, signature : memes fenetres que le hero
     precedent — l'architecture landonorris est inchangee. ----------- */
  // Studio SOMBRE on-brand (retour client : voiture sur fond sombre). Le
  // fond du composant matche le bord sombre de la nouvelle image voiture,
  // pour que le retrait de la carte plein cadre → carte ne montre pas de
  // saut de couleur ; le chrome passe clair (il etait encre sur creme).
  const backgroundColor = useTransform(
    scrollYProgress,
    [0.4, 0.55],
    ['#0b1119', '#0a0e14'],
  );
  const chromeColor = useTransform(
    scrollYProgress,
    [0.4, 0.55],
    ['#EBEEE0', '#EBEEE0'],
  );
  const lightPattern = useTransform(scrollYProgress, [0.4, 0.55], [1, 0]);
  const darkPattern = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0.4, 0.5], [1, 0]);

  const wVw = useTransform(scrollYProgress, [0.42, 0.58], [100, 46]);
  const hVh = useTransform(scrollYProgress, [0.42, 0.58], [100, 32]);
  const maxW = useTransform(scrollYProgress, [0.42, 0.58], [9999, 560]);
  const cardW = useMotionTemplate`${wVw}vw`;
  const cardH = useMotionTemplate`${hVh}vh`;
  const cardMaxW = useMotionTemplate`${maxW}px`;
  const cardY = useTransform(scrollYProgress, [0.42, 0.58], [0, -30]);
  const gray = useTransform(scrollYProgress, [0.42, 0.58], [0, 1]);
  const cardFilter = useMotionTemplate`grayscale(${gray})`;
  const tintOpacity = useTransform(scrollYProgress, [0.42, 0.58], [0, 0.4]);

  const sig1 = useTransform(scrollYProgress, [0.58, 0.74], [0, 1]);
  const sig2 = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);
  const sig3 = useTransform(scrollYProgress, [0.74, 0.86], [0, 1]);
  // pathLength 0 + linecap round = un POINT peint a chaque commande M
  // (constate : constellation lime avant le trace). On cache le trait
  // tant qu'il n'a pas commence.
  const sig1Vis = useTransform(sig1, (v) => (v < 0.004 ? 0 : 1));
  const sig2Vis = useTransform(sig2, (v) => (v < 0.004 ? 0 : 1));
  const sig3Vis = useTransform(sig3, (v) => (v < 0.004 ? 0 : 1));
  const laurelOpacity = useTransform(scrollYProgress, [0.78, 0.86], [0, 1]);
  const barScale = useTransform(scrollYProgress, [0.82, 0.92], [0, 1]);

  /* ----- Mode QA (?heroQA=1) : hors chemin pointeur/scroll. -------- */
  const [qa, setQa] = React.useState<'hidden' | 'off' | 'show' | 'diff'>(
    'hidden',
  );
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get('heroQA') === '1') {
      setQa('off');
    }
  }, []);

  /* ----- Variante reduced-motion : un ecran, etat restaure. -------- */
  if (reduced) {
    return (
      <section
        className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e14] ${className}`}
      >
        <ContourLayer stroke="rgba(235,238,224,0.07)" />
        <div className="relative aspect-[16/10] w-full max-w-5xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- paire
              pixel-verrouillee : les deux couches doivent etre rendues a
              l'identique, hors de tout pipeline d'optimisation. */}
          <img src={wreckedSrc} alt="" width={1600} height={1000} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
          <img src={revealSrc} alt="" width={1600} height={1000} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <div className="absolute left-6 top-24 text-[#EBEEE0]">
          <p className="text-2xl tracking-wide" style={{ fontFamily: 'var(--font-instrument), serif', fontStyle: 'italic' }}>
            {brandTop}
          </p>
          <p className="-mt-1 font-black uppercase tracking-tight">{brandBottom}</p>
        </div>
        <a
          href={callHref}
          className="absolute right-6 top-24 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D2FF00] px-4 py-2 text-sm font-bold uppercase text-[#111112]"
        >
          <PhoneIcon />
          {callLabel} <span className="font-mono tabular-nums">{callNumber}</span>
        </a>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={`relative min-h-[300vh] ${className}`}>
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor, contain: 'layout paint' }}
      >
        <MorphingContours progress={scrollYProgress} />

        {/* Nappes sauge (parallaxe + derive + deformation). */}
        <motion.div
          className="absolute left-[-6%] top-[12%] h-[48vh] w-[42vw]"
          style={{ x: blobX, y: blobY }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full blur-3xl"
            animate={{ x: [0, 120, 0], scaleX: [1, 1.14, 1], scaleY: [1, 0.92, 1] }}
            transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div className="h-full w-full bg-[#DDE1D2]" style={{ opacity: lightPattern, borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }} />
            <motion.div className="-mt-[48vh] h-full w-full bg-[#3B3C38]" style={{ opacity: darkPattern, borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }} />
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute bottom-[6%] right-[-4%] h-[40vh] w-[34vw]"
          style={{ x: blobXInv, y: blobY }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full blur-3xl"
            animate={{ x: [0, -100, 0], scaleX: [1, 0.9, 1], scaleY: [1, 1.12, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div className="h-full w-full bg-[#DDE1D2]" style={{ opacity: lightPattern, borderRadius: '44% 56% 40% 60% / 55% 42% 58% 45%' }} />
            <motion.div className="-mt-[40vh] h-full w-full bg-[#3B3C38]" style={{ opacity: darkPattern, borderRadius: '44% 56% 40% 60% / 55% 42% 58% 45%' }} />
          </motion.div>
        </motion.div>

        {/* Marquees (phase C), derriere la carte. */}
        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
          <MarqueeRow progress={scrollYProgress} text={marqueeSerif} direction={-1} serif />
          <MarqueeRow progress={scrollYProgress} text={marqueeSans} direction={1} />
        </div>

        {/* ----- La scene avant/apres : plein cadre → carte. --------- */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            ref={revealRef}
            className="relative overflow-hidden touch-pan-y"
            style={{ width: cardW, height: cardH, maxWidth: cardMaxW, y: cardY, filter: cardFilter }}
          >
            {/* Couche A : l'accidentee. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- la
                paire doit etre rendue au pixel identique (meme decodage,
                meme crop object-cover) : next/image genererait des
                candidats srcset differents par couche et casserait la
                superposition — opt-out deliberc, exige par le contrat
                d'images du composant. */}
            <img
              ref={imgARef}
              src={wreckedSrc}
              alt=""
              width={1600}
              height={1000}
              loading="eager"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
            />

            {/* Fenetre de revelation : masque statique + transforms. */}
            <motion.div
              ref={windowRef}
              className="pointer-events-none absolute left-0 top-0 will-change-transform"
              style={{
                width: winSize,
                height: winSize,
                x: winX,
                y: winY,
                scale: winScale,
                visibility: 'hidden',
                ...MASK,
              }}
              aria-hidden="true"
            >
              <motion.div
                className="absolute left-0 top-0"
                style={{
                  width: cwPx,
                  height: chPx,
                  x: innerX,
                  y: innerY,
                  scale: invScale,
                  transformOrigin: '0 0',
                }}
              >
                {/* Couche B : la restauree + la depanneuse. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- idem couche A */}
                <img
                  ref={imgBRef}
                  src={revealSrc}
                  alt=""
                  width={1600}
                  height={1000}
                  loading="eager"
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
                />
              </motion.div>
            </motion.div>

            {/* Teinte olive de la phase carte. */}
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[#282C20]"
              style={{ opacity: tintOpacity, mixBlendMode: 'multiply' }}
            />

            {/* Calque QA : validation d'alignement de la paire. */}
            {(qa === 'show' || qa === 'diff') && (
              // eslint-disable-next-line @next/next/no-img-element -- outil QA
              <img
                src={revealSrc}
                alt=""
                width={1600}
                height={1000}
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                style={qa === 'diff' ? { mixBlendMode: 'difference' } : undefined}
              />
            )}
          </motion.div>
        </div>

        {/* Signature + lauriers (phase C). */}
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <svg viewBox="0 0 600 260" className="w-[min(64vw,780px)] overflow-visible" fill="none" aria-hidden="true">
            <motion.path
              d="M40 150 C 60 60 90 40 100 70 C 108 92 96 128 82 150 C 70 168 60 160 66 140 L 150 60 C 160 50 168 54 162 70 L 130 150 C 126 160 132 164 140 156 C 168 130 200 120 210 140 C 222 162 200 186 178 178 C 160 172 164 148 186 142"
              stroke="#D2FF00" strokeWidth="10" strokeLinecap="round" style={{ pathLength: sig1, opacity: sig1Vis }}
            />
            <motion.path d="M30 200 C 120 230 260 220 330 180" stroke="#D2FF00" strokeWidth="10" strokeLinecap="round" style={{ pathLength: sig2, opacity: sig2Vis }} />
            <motion.path
              d="M360 70 C 380 50 404 56 404 76 C 404 96 372 108 360 124 L 408 124 M446 60 L 424 104 L 462 104 M452 84 L 452 128 M486 130 L 512 56 M520 60 L 560 60 L 534 130"
              stroke="#D2FF00" strokeWidth="10" strokeLinecap="round" style={{ pathLength: sig3, opacity: sig3Vis }}
            />
          </svg>
        </div>
        <motion.div
          className="absolute inset-x-0 bottom-[7%] z-30 flex flex-col items-center gap-1 text-[#EBEEE0]"
          style={{ opacity: laurelOpacity }}
        >
          <LaurelIcon className="h-6 w-6" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{caption}</p>
          <motion.div className="h-0.5 w-24 origin-left bg-[#D2FF00]" style={{ scaleX: barScale }} />
        </motion.div>

        {/* Chrome fixe (sous le header sticky du site : top-24). */}
        <motion.div className="pointer-events-none absolute left-6 top-24 z-40" style={{ color: chromeColor }}>
          <p className="text-2xl tracking-wide" style={{ fontFamily: 'var(--font-instrument), serif', fontStyle: 'italic' }}>
            {brandTop}
          </p>
          <p className="-mt-1 font-black uppercase tracking-tight">{brandBottom}</p>
        </motion.div>
        <motion.a
          href={callHref}
          className="absolute right-6 top-24 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D2FF00] px-4 py-2 text-sm font-bold uppercase text-[#111112]"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          <PhoneIcon />
          {callLabel} <span className="font-mono tabular-nums">{callNumber}</span>
        </motion.a>
        <motion.div
          className="pointer-events-none absolute left-1/2 top-24 z-40 flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ color: chromeColor }}
        >
          <svg viewBox="0 0 24 16" className="h-4 w-6" aria-hidden="true">
            <path d="M2 14 L9 2 L12 8" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 14 L17 4 L22 14" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{caption}</p>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute bottom-6 left-6 z-40 w-[110px] rounded-2xl border border-current/20 p-4"
          style={{ color: chromeColor, opacity: cardOpacity }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">{cardTitle}</p>
          <svg viewBox="0 0 80 34" className="mt-2 h-8 w-full" aria-hidden="true">
            <path d="M6 26 C 10 12 22 6 34 10 C 44 13 46 22 56 20 C 66 18 70 10 74 12 L 74 26 C 60 30 20 30 6 26 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div className="my-2 h-px bg-current/20" />
          <div className="flex items-center gap-1.5">
            <LaurelIcon className="h-4 w-4 shrink-0" />
            <p className="text-[8px] font-bold uppercase leading-tight tracking-[0.12em]">{cardCaption}</p>
          </div>
        </motion.div>

        {/* Boutons QA (?heroQA=1 uniquement). */}
        {qa !== 'hidden' && (
          <div className="absolute bottom-6 right-6 z-50 flex gap-2">
            {(['off', 'show', 'diff'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setQa(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                  qa === mode ? 'bg-[#D2FF00] text-[#111112]' : 'bg-black/60 text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
