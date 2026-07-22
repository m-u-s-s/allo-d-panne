'use client';

import * as React from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion';

/**
 * Hero a assemblage au scroll (integration 21st.dev « scroll-assembly-
 * hero », replique de l'experience landonorris.com) : un casque se
 * recompose en vol au-dessus d'un portrait, le theme bascule creme →
 * olive, puis double marquee et signature auto-tracee. Tout est pilote
 * par UN scrollYProgress — remonter la page desassemble le casque et
 * efface la signature. Aucun WebGL : douze copies de la meme image,
 * chacune reduite a un eclat par clip-path.
 *
 * Adaptations au projet, assumees :
 * - framer-motion (deja installe) au lieu du paquet `motion` ;
 * - Inter (deja chargee) au lieu de Mona Sans, Instrument Serif via
 *   next/font (layout) au lieu de fontsource ;
 * - pas de lucide-react : l'icone telephone existe deja en SVG inline ;
 * - le chrome du composant NE duplique PAS le header du site : pas de
 *   faux hamburger ni de wordmark concurrent — la pilule lime devient
 *   le bouton d'APPEL (tel:), la conversion reste dans le hero ;
 * - prefers-reduced-motion : variante statique assemblee sur un ecran
 *   (un hero 100 % scrolljack ne peut pas l'ignorer).
 *
 * Zero useState sur le chemin du scroll : uniquement des MotionValues,
 * aucun re-rendu React par frame. Les 12 eclats referencent la MEME URL
 * (une seule requete). will-change: transform sur eclats et marquees
 * seulement.
 */

interface ScrollAssemblyHeroProps {
  /** Portrait studio centre — REMPLACER le SVG placeholder par une
      vraie photo (fond clair ou transparent), tete centree en haut. */
  portraitSrc: string;
  /** Casque detoure — REMPLACER par un PNG/WebP transparent a la meme
      echelle visuelle que la tete du portrait. */
  helmetSrc: string;
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

/* ------------------------------------------------------------------ */
/* Donnees fixes des 12 eclats : decoupes irregulieres qui pavent      */
/* l'image (chevauchements volontaires — memes pixels alignes, donc    */
/* invisibles ; un jour serait visible), et departs disperses de part  */
/* et d'autre pour que les pieces arrivent de partout.                 */
/* ------------------------------------------------------------------ */

const FRAGMENTS: Array<{
  clip: string;
  x: string;
  y: string;
  rotate: number;
  scale: number;
}> = [
  { clip: 'polygon(0% 0%, 40% 0%, 32% 24%, 10% 32%, 0% 26%)', x: '-38vw', y: '-22vh', rotate: -118, scale: 1.35 },
  { clip: 'polygon(36% 0%, 70% 0%, 64% 22%, 30% 26%)', x: '12vw', y: '-32vh', rotate: 95, scale: 0.7 },
  { clip: 'polygon(66% 0%, 100% 0%, 100% 28%, 62% 24%)', x: '40vw', y: '-18vh', rotate: 128, scale: 1.15 },
  { clip: 'polygon(0% 22%, 14% 28%, 34% 22%, 30% 52%, 0% 56%)', x: '-44vw', y: '6vh', rotate: -72, scale: 0.85 },
  { clip: 'polygon(28% 22%, 66% 20%, 60% 50%, 26% 54%)', x: '-16vw', y: '28vh', rotate: 44, scale: 1.45 },
  { clip: 'polygon(58% 20%, 100% 24%, 100% 54%, 56% 52%)', x: '43vw', y: '12vh', rotate: 84, scale: 0.65 },
  { clip: 'polygon(0% 52%, 32% 48%, 28% 78%, 0% 82%)', x: '-40vw', y: '24vh', rotate: -128, scale: 1.05 },
  { clip: 'polygon(24% 50%, 62% 48%, 58% 80%, 22% 80%)', x: '8vw', y: '-34vh', rotate: -52, scale: 1.5 },
  { clip: 'polygon(54% 48%, 100% 50%, 100% 80%, 52% 82%)', x: '38vw', y: '27vh', rotate: 110, scale: 0.8 },
  { clip: 'polygon(0% 78%, 30% 74%, 26% 100%, 0% 100%)', x: '-28vw', y: '-30vh', rotate: 62, scale: 1.2 },
  { clip: 'polygon(22% 76%, 60% 76%, 56% 100%, 20% 100%)', x: '20vw', y: '30vh', rotate: -96, scale: 0.6 },
  { clip: 'polygon(52% 78%, 100% 76%, 100% 100%, 48% 100%)', x: '44vw', y: '-26vh', rotate: 130, scale: 0.95 },
];

/* Contours topographiques deterministes : le pseudo-aleatoire seede
   garantit le MEME dessin au SSR et au client — Math.random() ici
   provoquerait un mismatch d'hydratation. */
const seeded = (i: number, k: number) =>
  Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 -
  Math.floor(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

function contourPath(ring: number): string {
  // Centre decale hors cadre et rayons larges : sur le site de
  // reference (verifie sur la video du client), les contours sont
  // d'immenses courbes qui balayent tout l'ecran — pas des anneaux
  // concentriques au centre.
  const cx = 420;
  const cy = 980;
  const r = 340 + ring * 210;
  const pts: Array<[number, number]> = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 0.72 + seeded(ring, i) * 0.5;
    pts.push([cx + Math.cos(a) * r * wob * 1.45, cy + Math.sin(a) * r * wob * 0.85]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    const prev = pts[i - 1];
    const mx = (prev[0] + p[0]) / 2;
    const my = (prev[1] + p[1]) / 2;
    d += ` Q ${prev[0].toFixed(1)} ${prev[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + ' Z';
}
const CONTOURS = Array.from({ length: 7 }, (_, i) => contourPath(i));

export function ContourLayer({ stroke }: { stroke: string }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {CONTOURS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth="1" />
      ))}
    </svg>
  );
}

/**
 * Contours topographiques en MORPHING reel — l'equivalent canvas 2D de
 * l'animation Rive du site de reference.
 *
 * La version precedente derivait des chemins SVG rigides : les lignes
 * bougeaient en bloc, sans se deformer. Ici chaque point de controle
 * ondule dans le temps (sinus dephases par anneau et par point) : les
 * courbes respirent et se deforment organiquement, comme dans Rive.
 * Un vrai .riv exigerait leur editeur ; quatorze traits en quadratiques
 * redessines a 30 fps donnent le meme resultat pour zero dependance.
 *
 * La couleur suit le theme en lisant la MotionValue de progression par
 * frame — aucun re-rendu React, exactement comme le reste du hero.
 */
export function MorphingContours({ progress }: { progress: MotionValue<number> }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mid = (a: number[], b: number[]) => [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
    ];

    const family = (
      time: number,
      w: number,
      h: number,
      rings: number,
      baseR: number,
      speed: number,
      alphaMul: number,
      phase: number,
    ) => {
      // Derive d'ensemble lente, en plus du morphing par point.
      const gx = Math.sin(time * 0.05 + phase) * 0.06 * w;
      const gy = Math.cos(time * 0.04 + phase) * 0.03 * h;
      ctx.globalAlpha = alphaMul;
      for (let ring = 0; ring < rings; ring++) {
        const cx = w * 0.3 + gx;
        const cy = h * 1.15 + gy;
        const r = (baseR + ring * 0.15) * Math.max(w, h);
        const n = 9;
        const pts: number[][] = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          // LE morphing : l'amplitude de chaque point ondule.
          const wob =
            0.72 +
            seeded(ring + phase, i) * 0.5 +
            Math.sin(time * speed + ring * 1.7 + i * 2.1) * 0.09;
          pts.push([
            cx + Math.cos(a) * r * wob * 1.45,
            cy + Math.sin(a) * r * wob * 0.85,
          ]);
        }
        ctx.beginPath();
        let m = mid(pts[n - 1], pts[0]);
        ctx.moveTo(m[0], m[1]);
        for (let i = 0; i < n; i++) {
          m = mid(pts[i], pts[(i + 1) % n]);
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      // 30 fps suffisent largement pour des lignes lentes — la moitie
      // du budget d'un rAF plein pour un resultat indistinguable.
      if (t - last < 33) return;
      last = t;
      const time = t / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Couleur du trait : encre sur creme → blanc casse sur olive,
      // pilotee par la meme fenetre [0.40, 0.55] que le theme.
      const p = progress.get();
      const themeT = Math.min(1, Math.max(0, (p - 0.4) / 0.15));
      const c = [17 + (244 - 17) * themeT, 17 + (244 - 17) * themeT, 18 + (237 - 18) * themeT];
      const alpha = 0.08 * (1 - themeT) + 0.06 * themeT;
      ctx.strokeStyle = `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
      ctx.lineWidth = 1 * dpr;

      family(time, w, h, 7, 0.24, 0.35, 1, 0);
      family(time, w, h, 5, 0.34, 0.27, 0.6, 3.1);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

/* Dome filaire fantome au-dessus du crane : 8 latitudes × 10 arcs.
   Toutes les valeurs passent par toFixed : un flottant a precision non
   bornee dans un attribut SVG differe d'un ulp entre le rendu serveur
   et le client — mismatch d'hydratation reel, observe sur rx. */
function GhostDome() {
  const lats = Array.from({ length: 8 }, (_, i) => (i + 1) / 8);
  const lons = Array.from({ length: 10 }, (_, i) => (i + 1) / 11);
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden="true">
      {lats.map((t, i) => (
        <ellipse
          key={`la${i}`}
          cx="100"
          cy="100"
          rx={(95 * Math.sin(Math.acos(1 - t))).toFixed(2)}
          ry={(12 * t).toFixed(2)}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.75"
          transform={`translate(0 ${(-(1 - t) * 88).toFixed(2)})`}
        />
      ))}
      {lons.map((t, i) => {
        const c = 95 * Math.cos(t * Math.PI);
        return (
          <path
            key={`lo${i}`}
            d={`M ${(100 - c).toFixed(2)} 100 A ${Math.abs(c).toFixed(2)} 92 0 0 1 ${(100 + c).toFixed(2)} 100`}
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="0.75"
          />
        );
      })}
    </svg>
  );
}

/* Un eclat du casque : sa propre fenetre de progression, son vol. */
function HelmetShard({
  progress,
  src,
  index,
}: {
  progress: MotionValue<number>;
  src: string;
  index: number;
}) {
  const f = FRAGMENTS[index];
  const win: [number, number] = [0.04 + index * 0.014, 0.3 + index * 0.008];
  const x = useTransform(progress, win, [f.x, '0vw']);
  const y = useTransform(progress, win, [f.y, '0vh']);
  const rotate = useTransform(progress, win, [f.rotate, 0]);
  const scale = useTransform(progress, win, [f.scale, 1]);
  const opacity = useTransform(progress, [win[0], win[0] + 0.03], [0, 1]);
  const blur = useTransform(progress, win, [2, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full select-none object-contain will-change-transform"
      style={{ clipPath: f.clip, x, y, rotate, scale, opacity, filter }}
      draggable={false}
    />
  );
}

/* Rangee marquee : derive constante + acceleration par la velocite du
   scroll. Contenu duplique deux fois, enroulement a -50 %. */
export function MarqueeRow({
  progress,
  text,
  direction,
  serif,
}: {
  progress: MotionValue<number>;
  text: string;
  direction: 1 | -1;
  serif?: boolean;
}) {
  const base = useMotionValue(direction === 1 ? -50 : 0);
  const velocity = useVelocity(progress);
  const boost = useSpring(velocity, { damping: 50, stiffness: 400 });

  useAnimationFrame((_, delta) => {
    const speed = 1 + Math.min(Math.abs(boost.get()) * 40, 6);
    let next = base.get() + direction * (delta / 1000) * 2.4 * speed;
    if (next <= -50) next += 50;
    if (next > 0) next -= 50;
    base.set(next);
  });

  const x = useMotionTemplate`${base}%`;
  const opacity = useTransform(progress, [0.5, 0.58], [0, 1]);
  const y = useTransform(progress, [0.5, 0.58], [40, 0]);
  const copy = `${text} — ${text} — `;

  return (
    <motion.div
      className={
        serif
          ? 'whitespace-nowrap text-[9vw] leading-none text-[#96A82E] will-change-transform'
          : 'whitespace-nowrap font-black uppercase tracking-tight text-[8vw] leading-none text-[#BCC0B1] will-change-transform'
      }
      style={{
        x,
        opacity,
        y,
        fontFamily: serif ? 'var(--font-instrument), serif' : undefined,
        fontStyle: serif ? 'italic' : undefined,
      }}
      aria-hidden="true"
    >
      <span>{copy}</span>
      <span>{copy}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function ScrollAssemblyHero({
  portraitSrc,
  helmetSrc,
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
}: ScrollAssemblyHeroProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // Offset EXPLICITE : le defaut de framer (['start end','end start'])
  // etale la progression sur l'entree ET la sortie de la section — la
  // fin de la choregraphie se jouerait apres la liberation du sticky,
  // hors ecran (mesure : opacite marquee 0.49 la ou 1 etait attendue).
  // Avec start/start → end/end, progress atteint 1 exactement quand le
  // sticky se libere.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  /* Parallaxe souris, amortie au ressort. */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 18 });
  React.useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mouseX, mouseY, reduced]);

  const shardsX = useTransform(springX, (v) => v * -16);
  const shardsY = useTransform(springY, (v) => v * -16);
  const portraitX = useTransform(springX, (v) => v * -8);
  const blobX = useTransform(springX, (v) => v * 24);
  const blobY = useTransform(springY, (v) => v * 24);
  const blobXInv = useTransform(springX, (v) => v * -24);

  /* Phase B : fond, chrome et pattern basculent creme → olive. */
  const backgroundColor = useTransform(
    scrollYProgress,
    [0.4, 0.55],
    ['#EFEFE5', '#282C20'],
  );
  const chromeColor = useTransform(
    scrollYProgress,
    [0.4, 0.55],
    ['#111112', '#EFEFE5'],
  );
  const lightPattern = useTransform(scrollYProgress, [0.4, 0.55], [1, 0]);
  const darkPattern = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0.4, 0.5], [1, 0]);

  /* Dome fantome. */
  const domeOpacity = useTransform(scrollYProgress, [0.25, 0.38], [0.7, 0]);

  /* Portrait plein cadre → carte centree. */
  const wVw = useTransform(scrollYProgress, [0.42, 0.58], [100, 46]);
  const hVh = useTransform(scrollYProgress, [0.42, 0.58], [100, 32]);
  const maxW = useTransform(scrollYProgress, [0.42, 0.58], [9999, 560]);
  const cardW = useMotionTemplate`${wVw}vw`;
  const cardH = useMotionTemplate`${hVh}vh`;
  const cardMaxW = useMotionTemplate`${maxW}px`;
  const cardY = useTransform(scrollYProgress, [0.42, 0.58], [0, -30]);
  const gray = useTransform(scrollYProgress, [0.42, 0.58], [0, 1]);
  const portraitFilter = useMotionTemplate`grayscale(${gray})`;
  const tintOpacity = useTransform(scrollYProgress, [0.42, 0.58], [0, 0.4]);

  /* Signature : trois traces etages, reversibles au scroll. */
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

  /* ----- Variante reduced-motion : l'etat assemble, sur un ecran, ----
     sans choregraphie. Un hero entierement scrolljacke ne peut pas
     "reduire" — il doit se retirer. */
  if (reduced) {
    return (
      <section
        className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EFEFE5] ${className}`}
      >
        <ContourLayer stroke="rgba(0,0,0,0.06)" />
        <div className="relative flex h-[92vh] items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element --
              asset vectoriel : next/image n'optimise pas les SVG, et les
              copies animees du casque doivent rester des <img> bruts
              (clip-path + MotionValues). Meme regime ici par coherence. */}
          <img src={portraitSrc} alt="" className="h-full object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
          <img
            src={helmetSrc}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-[3%] w-[46%] -translate-x-1/2 object-contain"
          />
        </div>
        <div className="absolute left-6 top-24 text-[#111112]">
          <p
            className="text-2xl tracking-wide"
            style={{ fontFamily: 'var(--font-instrument), serif', fontStyle: 'italic' }}
          >
            {brandTop}
          </p>
          <p className="-mt-1 font-black uppercase tracking-tight">{brandBottom}</p>
        </div>
        <a
          href={callHref}
          className="absolute right-6 top-24 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2DFF00] px-4 py-2 text-sm font-bold uppercase text-[#111112]"
        >
          <PhoneIcon />
          {callLabel} <span className="font-mono tabular-nums">{callNumber}</span>
        </a>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-[300vh] ${className}`}
    >
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor }}
      >
        {/* ----- Fond : contours topographiques en MORPHING (canvas 2D,
               equivalent de l'animation Rive du site de reference).
               Deux familles de courbes dont chaque point ondule dans le
               temps — les lignes se deforment, elles ne derivent pas en
               bloc. Couleur asservie au theme par frame. ------------- */}
        <MorphingContours progress={scrollYProgress} />

        {/* Nappes organiques : la vague sauge du site de reference,
            en derive lente + parallaxe souris. Une copie claire, une
            copie sombre, en fondu croise avec le theme. */}
        {/* Deux ecrivains sur un meme x = conflit : la parallaxe souris
            (MotionValue) vit sur le conteneur, la derive (keyframes)
            sur l'enfant. */}
        <motion.div
          className="absolute left-[-6%] top-[12%] h-[48vh] w-[42vw]"
          style={{ x: blobX, y: blobY }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              // La nappe se deforme en plus de deriver — meme logique
              // organique que les contours.
              scaleX: [1, 1.14, 1],
              scaleY: [1, 0.92, 1],
            }}
            transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="h-full w-full bg-[#DDE1D2]"
              style={{ opacity: lightPattern, borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }}
            />
            <motion.div
              className="-mt-[48vh] h-full w-full bg-[#3B3C38]"
              style={{ opacity: darkPattern, borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }}
            />
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute bottom-[6%] right-[-4%] h-[40vh] w-[34vw]"
          style={{ x: blobXInv, y: blobY }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              scaleX: [1, 0.9, 1],
              scaleY: [1, 1.12, 1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="h-full w-full bg-[#DDE1D2]"
              style={{ opacity: lightPattern, borderRadius: '44% 56% 40% 60% / 55% 42% 58% 45%' }}
            />
            <motion.div
              className="-mt-[40vh] h-full w-full bg-[#3B3C38]"
              style={{ opacity: darkPattern, borderRadius: '44% 56% 40% 60% / 55% 42% 58% 45%' }}
            />
          </motion.div>
        </motion.div>

        {/* ----- Marquees (phase C), DERRIERE la carte portrait. ------ */}
        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
          <MarqueeRow progress={scrollYProgress} text={marqueeSerif} direction={-1} serif />
          <MarqueeRow progress={scrollYProgress} text={marqueeSans} direction={1} />
        </div>

        {/* ----- Portrait → carte. ------------------------------------ */}
        <div className="absolute inset-0 z-20 flex items-end justify-center">
          <motion.div
            className="relative flex items-start justify-center overflow-hidden"
            style={{ width: cardW, height: cardH, maxWidth: cardMaxW, y: cardY, x: portraitX }}
          >
            {/* h-[112%] : sur la video de reference le visage domine le
                cadre — le buste depasse du bas, seul le haut compte.
                Easing = --cubic-default / --duration-default du site. */}
            <motion.img
              src={portraitSrc}
              alt=""
              className="h-[112%] max-h-none object-contain object-top"
              style={{ filter: portraitFilter }}
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
              transition={{
                scale: { duration: 0.75, ease: [0.65, 0.05, 0, 1] },
                opacity: { duration: 0.75, ease: [0.65, 0.05, 0, 1] },
                y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 },
              }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[#282C20]"
              style={{ opacity: tintOpacity, mixBlendMode: 'multiply' }}
            />
          </motion.div>
        </div>

        {/* ----- Dome fantome + eclats du casque, sur la tete. -------- */}
        <motion.div
          className="absolute left-1/2 top-[3%] z-20 aspect-square w-[46vh] -translate-x-1/2"
          style={{ x: shardsX, y: shardsY }}
        >
          <motion.div className="absolute inset-x-0 top-[10%] h-[55%]" style={{ opacity: domeOpacity }}>
            <GhostDome />
          </motion.div>
          {FRAGMENTS.map((_, i) => (
            <HelmetShard key={i} progress={scrollYProgress} src={helmetSrc} index={i} />
          ))}
        </motion.div>

        {/* ----- Signature + lauriers (phase C), devant la carte. ----- */}
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <svg
            viewBox="0 0 600 260"
            className="w-[min(64vw,780px)] overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            <motion.path
              d="M40 150 C 60 60 90 40 100 70 C 108 92 96 128 82 150 C 70 168 60 160 66 140 L 150 60 C 160 50 168 54 162 70 L 130 150 C 126 160 132 164 140 156 C 168 130 200 120 210 140 C 222 162 200 186 178 178 C 160 172 164 148 186 142"
              stroke="#2DFF00" strokeWidth="10" strokeLinecap="round"
              style={{ pathLength: sig1, opacity: sig1Vis }}
            />
            <motion.path
              d="M30 200 C 120 230 260 220 330 180"
              stroke="#2DFF00" strokeWidth="10" strokeLinecap="round"
              style={{ pathLength: sig2, opacity: sig2Vis }}
            />
            <motion.path
              d="M360 70 C 380 50 404 56 404 76 C 404 96 372 108 360 124 L 408 124 M446 60 L 424 104 L 462 104 M452 84 L 452 128 M486 130 L 512 56 M520 60 L 560 60 L 534 130"
              stroke="#2DFF00" strokeWidth="10" strokeLinecap="round"
              style={{ pathLength: sig3, opacity: sig3Vis }}
            />
          </svg>
        </div>
        <motion.div
          className="absolute inset-x-0 bottom-[7%] z-30 flex flex-col items-center gap-1 text-[#EBEEE0]"
          style={{ opacity: laurelOpacity }}
        >
          <LaurelIcon className="h-6 w-6" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{caption}</p>
          <motion.div
            className="h-0.5 w-24 origin-left bg-[#2DFF00]"
            style={{ scaleX: barScale }}
          />
        </motion.div>

        {/* ----- Chrome fixe. Le header du site vit AU-DESSUS de cette
               section : pas de wordmark concurrent en haut, pas de faux
               menu — la marque et l'appel, rien d'autre. -------------- */}
        <motion.div
          className="pointer-events-none absolute left-6 top-24 z-40"
          style={{ color: chromeColor }}
        >
          <p
            className="text-2xl tracking-wide"
            style={{ fontFamily: 'var(--font-instrument), serif', fontStyle: 'italic' }}
          >
            {brandTop}
          </p>
          <p className="-mt-1 font-black uppercase tracking-tight">{brandBottom}</p>
        </motion.div>

        <motion.a
          href={callHref}
          className="absolute right-6 top-24 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2DFF00] px-4 py-2 text-sm font-bold uppercase text-[#111112]"
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

        {/* Carte bas-gauche (s'efface pendant la bascule de theme). */}
        <motion.div
          className="pointer-events-none absolute bottom-6 left-6 z-40 w-[110px] rounded-2xl border border-current/20 p-4"
          style={{ color: chromeColor, opacity: cardOpacity }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">{cardTitle}</p>
          <svg viewBox="0 0 80 34" className="mt-2 h-8 w-full" aria-hidden="true">
            <path
              d="M6 26 C 10 12 22 6 34 10 C 44 13 46 22 56 20 C 66 18 70 10 74 12 L 74 26 C 60 30 20 30 6 26 Z"
              fill="none" stroke="currentColor" strokeWidth="1.6"
            />
          </svg>
          <div className="my-2 h-px bg-current/20" />
          <div className="flex items-center gap-1.5">
            <LaurelIcon className="h-4 w-4 shrink-0" />
            <p className="text-[8px] font-bold uppercase leading-tight tracking-[0.12em]">
              {cardCaption}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function LaurelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M7 20 C 3 16 3 9 6 4 C 8 8 8 13 7 20 Z" />
      <path d="M17 20 C 21 16 21 9 18 4 C 16 8 16 13 17 20 Z" />
      <path d="M9 21 C 11 20 13 20 15 21" />
    </svg>
  );
}
