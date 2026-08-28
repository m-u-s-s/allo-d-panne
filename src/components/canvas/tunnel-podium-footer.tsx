'use client';

import * as React from 'react';
import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * TunnelPodiumFooter — la descente igloo.inc en footer de page contact :
 * champ de debris dans la brume, plongee verticale dans un puits de
 * roche, chambre du podium ou une sculpture de particules morphe entre
 * les CANAUX DE CONTACT reels (telephone, email, devis — l'entreprise
 * n'a aucun reseau social connu et la regle du projet interdit d'en
 * inventer). Scroll NATIF : wrapper 520svh + viewport sticky, aucun
 * evenement capture, remonter c'est juste... remonter.
 *
 * Adaptations au brief, assumees :
 * - three@0.180 + fiber@9 (matrice du projet — fiber@8 ne supporte pas
 *   React 19, epingle exact ici) ; APIs ere-courante partout.
 * - store module mutable (pattern scroll-state du projet) au lieu de
 *   zustand : meme garantie zero-setState sur le chemin frame/scroll,
 *   zero dependance.
 * - palette integree au site (nuit #151b24, emissifs ambre #f97316)
 *   plutot que le gris pale igloo : ce footer vit sur une page sombre.
 *   Revenir au look igloo = echanger les constantes PALETTE.
 * - vit dans components/canvas/ (regle ESLint : three n'entre jamais
 *   dans ui/), monte par palier via DescentFooterMount — les autres
 *   paliers recoivent la meme <nav> de liens reels sans canvas.
 * - pas de leva/stats (?debug omis), pas de simple-icons (les glyphes
 *   sont des SVG maison inline).
 *
 * Zero allocation dans useFrame ; rendu entierement suspendu hors
 * viewport (IntersectionObserver → frameloop "never").
 */

export interface DescentItem {
  id: string;
  label: string;
  href: string;
  /** SVG complet (chaine) — parse par SVGLoader, jamais charge par URL. */
  svg: string;
  external?: boolean;
}

interface TunnelPodiumFooterProps {
  items: DescentItem[];
  ariaLabel: string;
  /** Libelles LOCALISES des fleches du carrousel : ils etaient ecrits en
      francais en dur et partaient donc tels quels aux lecteurs d’ecran
      sur /nl et /en. */
  prevLabel: string;
  nextLabel: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Store module : ecrit par le scroll et la boucle, lu par les frames. */
/* Aucun setState React n'est joignable depuis ces chemins.           */
/* ------------------------------------------------------------------ */
const store = {
  target: 0,
  current: 0,
  velocity: 0,
  morphT: 1,
  selected: 0,
};

const PALETTE = {
  bg: '#151b24',
  debris: '#2a3442',
  rock: '#1a222e',
  metal: '#2b3646',
  ember: '#f97316',
  emberSoft: '#fca55f',
  discGlow: '#ffd9b0',
  particle: '#94a3b8',
};

const COUNT = 30000;
const STAGGER = 0.6;
const MORPH_SECONDS = 2.2; // retour client : morph ralenti (1.15 -> 2.2)
const WORLD_SIZE = 3.8; // retour client : logos agrandis (3.2 -> 3.8)
const PODIUM_Y = -54;

const seeded = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const ease = (t: number) => t * t * (3 - 2 * t);

/* Deplacement de sommets seede, UNE fois a la construction — jamais de
   bruit CPU par frame. */
function displace(geo: THREE.BufferGeometry, amp: number, seed: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n =
      seeded(Math.round(v.x * 13.7) + seed, Math.round(v.y * 9.1)) +
      seeded(Math.round(v.z * 11.3), seed) -
      1;
    v.addScaledVector(v.clone().normalize(), n * amp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ */
/* SVG → nuage de points (l'ordre du pipeline est celui du brief).    */
/* ------------------------------------------------------------------ */
function sampleIcon(svg: string, count: number): Float32Array {
  const data = new SVGLoader().parse(svg);
  const geos: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    // createShapes respecte fill-rule et enroulement : les contre-formes
    // (trous) deviennent de vrais trous — zero particule dedans.
    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes) {
      geos.push(
        new THREE.ExtrudeGeometry(shape, {
          depth: 8,
          bevelEnabled: false,
          curveSegments: 24,
        }),
      );
    }
  }
  const merged = mergeGeometries(geos)!;
  geos.forEach((g) => g.dispose());
  // SVG est Y-vers-le-bas, Three Y-vers-le-haut.
  merged.scale(1, -1, 1);
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  merged.translate(-center.x, -center.y, -center.z);
  const size = box.getSize(new THREE.Vector3());
  // UNE echelle uniforme sur la dimension max : masse visuelle
  // constante entre glyphes, jamais de normalisation par viewBox.
  const s = WORLD_SIZE / Math.max(size.x, size.y, size.z);
  merged.scale(s, s, s);

  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  const out = new Float32Array(count * 3);
  const scratch = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(scratch);
    out[i * 3] = scratch.x;
    out[i * 3 + 1] = scratch.y;
    out[i * 3 + 2] = scratch.z;
  }
  merged.dispose();
  return out;
}

/* ------------------------------------------------------------------ */
/* Sculpture de particules : un THREE.Points, ShaderMaterial custom.  */
/* ------------------------------------------------------------------ */
const VERT = /* glsl */ `
  #include <fog_pars_vertex>
  attribute vec3 aPositionFrom;
  attribute vec3 aPositionTo;
  attribute vec4 aRand; // decalage, jitter taille, graine bruit, vitesse
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform float uScaleFactor;
  uniform vec3 uPointer;
  uniform float uPointerK;
  varying float vFlight;

  float easeT(float t) { return t * t * (3.0 - 2.0 * t); }

  vec3 swirl(vec3 p, float seed, float t) {
    float a = t * 6.2831 + seed * 12.0;
    return vec3(
      sin(a + p.y * 1.7),
      cos(a * 0.9 + p.z * 1.3),
      sin(a * 1.1 + p.x * 1.5)
    );
  }

  void main() {
    float s = ${STAGGER.toFixed(2)};
    float t = clamp((uProgress * (1.0 + s) - s * aRand.x), 0.0, 1.0);
    t = easeT(t);
    // enveloppe sinusoidale : le triangle cassait la derivee au sommet,
    // le vol paraissait mecanique (retour client « pas fluide »)
    float flight = sin(3.14159 * t);
    vFlight = flight;

    vec3 pos = mix(aPositionFrom, aPositionTo, t);
    // trajectoire en ARC propre a chaque particule (plus de lignes
    // droites interpolees) + tourbillon a DEUX octaves dephasees
    pos += vec3(
      sin(aRand.z * 6.2831),
      cos(aRand.y * 6.2831) * 0.8 + 0.35,
      sin(aRand.w * 6.2831)
    ) * flight * 0.4;
    pos += swirl(pos, aRand.z, t * aRand.w) * flight * 0.5;
    pos += swirl(pos * 2.3, aRand.z * 1.7, t * aRand.w * 1.6) * flight * 0.22;
    // micro-vie au repos : deux ondes lentes sur trois axes
    pos += vec3(
      sin(uTime * 0.55 + aRand.z * 40.0),
      cos(uTime * 0.48 + aRand.z * 28.0),
      sin(uTime * 0.62 + aRand.y * 33.0)
    ) * 0.02;
    pos += vec3(
      sin(uTime * 0.21 + aRand.w * 17.0),
      sin(uTime * 0.17 + aRand.x * 23.0),
      cos(uTime * 0.19 + aRand.z * 11.0)
    ) * 0.014;
    float g = uTime * 0.12;
    pos = vec3(
      pos.x * cos(g) - pos.z * sin(g),
      pos.y + sin(uTime * 0.4) * 0.06,
      pos.x * sin(g) + pos.z * cos(g)
    );

    // survol : les particules proches du curseur sont repoussees et
    // scintillent — applique apres la rotation de groupe, dans le meme
    // espace que uPointer (espace objet).
    vec3 dp = pos - uPointer;
    float pd = length(dp);
    float push = smoothstep(1.6, 0.0, pd) * uPointerK;
    vec3 dir = dp / max(pd, 0.001);
    pos += dir * push * 0.85;
    // composante tangentielle : le creux tourbillonne au lieu de
    // seulement s'ecarter — bien plus organique
    pos += cross(dir, vec3(0.0, 1.0, 0.0)) * push * 0.45;
    vFlight = max(vFlight, push * 0.7);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (0.75 + aRand.y * 0.5) * uDpr * (uScaleFactor / -mvPosition.z);
    #include <fog_vertex>
  }
`;

const FRAG = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uColor;
  varying float vFlight;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.18, r);
    // en vol : blanc HDR — seul lui depasse le seuil du Bloom
    vec3 col = mix(uColor, vec3(2.5), vFlight * vFlight);
    gl_FragColor = vec4(col, alpha * 0.9);
    #include <fog_fragment>
  }
`;

function ParticleSculpture({
  items,
  selected,
  anchorRefs,
}: {
  items: DescentItem[];
  selected: number;
  anchorRefs: React.MutableRefObject<Array<HTMLAnchorElement | null>>;
}) {
  const points = useRef<THREE.Points>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const clouds = useRef<Array<Float32Array | null>>([]);
  const prevSelected = useRef(0);
  const pressRef = useRef({ t: 0, x: 0, y: 0 });
  // survol : cible mise a jour par les evenements, lissee dans useFrame
  const colorDark = useRef(new THREE.Color(PALETTE.particle));
  const colorInk = useRef(new THREE.Color('#2c3440'));
  const hover = useRef({
    point: new THREE.Vector3(0, 0, 99),
    raw: new THREE.Vector3(0, 0, 99),
    scratch: new THREE.Vector3(),
    k: 0,
    target: 0,
    last: 0,
  });

  const { geometry, material, rand } = React.useMemo(() => {
    const first = sampleIcon(items[0].svg, COUNT);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aPositionFrom', new THREE.BufferAttribute(first.slice(), 3));
    geo.setAttribute('aPositionTo', new THREE.BufferAttribute(first.slice(), 3));
    // position requis par three pour le bounding — jamais lu par le shader
    geo.setAttribute('position', new THREE.BufferAttribute(first.slice(), 3));
    const r = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      r[i * 4] = seeded(i, 1);
      r[i * 4 + 1] = seeded(i, 2);
      r[i * 4 + 2] = seeded(i, 3);
      r[i * 4 + 3] = 0.6 + seeded(i, 4) * 0.8;
    }
    geo.setAttribute('aRand', new THREE.BufferAttribute(r, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), WORLD_SIZE);

    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uProgress: { value: 1 },
          uTime: { value: 0 },
          uSize: { value: 0.11 },
          uDpr: { value: 1 },
          uScaleFactor: { value: 400 },
          uColor: { value: new THREE.Color(PALETTE.particle) },
          // survol : position du curseur en espace objet + intensite
          uPointer: { value: new THREE.Vector3(0, 0, 99) },
          uPointerK: { value: 0 },
        },
      ]),
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      // fog: true + chunks : la sculpture DOIT brumer comme le decor,
      // sinon elle « pope » et la signature visuelle meurt.
      fog: true,
    });
    return { geometry: geo, material: mat, rand: r };
  }, [items]);

  // Le premier glyphe est echantillonne en synchrone (ci-dessus) ; les
  // suivants en requestIdleCallback pour ne pas bloquer l'arrivee.
  React.useEffect(() => {
    clouds.current = items.map(() => null);
    clouds.current[0] = (
      geometry.getAttribute('aPositionTo') as THREE.BufferAttribute
    ).array as Float32Array;
    let cancelled = false;
    const idle: (cb: () => void) => number =
      typeof window.requestIdleCallback === 'function'
        ? (cb) => window.requestIdleCallback(() => cb())
        : (cb) => window.setTimeout(cb, 60);
    let i = 1;
    const next = () => {
      if (cancelled || i >= items.length) return;
      const idx = i++;
      clouds.current[idx] = sampleIcon(items[idx].svg, COUNT);
      idle(next);
    };
    idle(next);
    return () => {
      cancelled = true;
    };
  }, [items, geometry]);

  /* Interruption : meme maths que le shader, offset de vol volontairement
     omis (pop sous-pixel, acceptable). Jamais de re-echantillonnage ici. */
  React.useEffect(() => {
    if (selected === prevSelected.current) return;
    const to = clouds.current[selected];
    if (!to) return; // pas encore echantillonne : on garde l'actuel
    const from = geometry.getAttribute('aPositionFrom') as THREE.BufferAttribute;
    const cur = geometry.getAttribute('aPositionTo') as THREE.BufferAttribute;
    const P = store.morphT;
    const fa = from.array as Float32Array;
    const ca = cur.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const t = ease(
        Math.min(1, Math.max(0, P * (1 + STAGGER) - STAGGER * rand[i * 4])),
      );
      fa[i * 3] += (ca[i * 3] - fa[i * 3]) * t;
      fa[i * 3 + 1] += (ca[i * 3 + 1] - fa[i * 3 + 1]) * t;
      fa[i * 3 + 2] += (ca[i * 3 + 2] - fa[i * 3 + 2]) * t;
    }
    ca.set(to);
    from.needsUpdate = true;
    cur.needsUpdate = true;
    prevSelected.current = selected;
    store.morphT = 0;
  }, [selected, geometry, rand]);

  useFrame((_, delta) => {
    store.morphT = Math.min(1, store.morphT + delta / MORPH_SECONDS);
    const u = material.uniforms;
    u.uProgress.value = store.morphT;
    u.uTime.value += delta;
    u.uDpr.value = dpr;
    u.uScaleFactor.value = size.height * 0.5;

    // dynamique du survol : monte vite sous le curseur, retombe des
    // qu'il s'immobilise ou quitte — amorti dt-corrige comme le reste
    // chambre claire : la sculpture bascule vers l'encre (la reference
    // pose un sujet SOMBRE sur fond laiteux — gris-bleu invisible sinon)
    const chamberT = Math.min(1, Math.max(0, (store.current - 0.78) / 0.22));
    (u.uColor.value as THREE.Color)
      .copy(colorDark.current)
      .lerp(colorInk.current, chamberT);

    const h = hover.current;
    if (performance.now() - h.last > 160) h.target = 0;
    h.k += (h.target - h.k) * (1 - Math.exp(-6 * delta));
    // le creux SUIT le curseur en douceur au lieu de sauter d'un
    // evenement a l'autre
    h.point.lerp(h.raw, 1 - Math.exp(-10 * delta));
    u.uPointerK.value = h.k;
    (u.uPointer.value as THREE.Vector3).copy(h.point);
  });

  return (
    <group ref={groupRef} position={[0, PODIUM_Y + 3.75, 0]}>
      <points geometry={geometry} material={material} ref={points} />
      {/* Proxy de clic : sphere invisible — on ne raycaste JAMAIS les
          30k points. Clic = pointerup a moins de 8 px / 300 ms du down,
          activation SYNCHRONE de la vraie ancre (anti popup-blocker). */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          pressRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const p = pressRef.current;
          if (
            performance.now() - p.t < 300 &&
            Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8
          ) {
            anchorRefs.current[selected]?.click();
          }
        }}
        onPointerMove={(e) => {
          // e.point est en monde ; le shader repousse en espace objet
          const h = hover.current;
          h.scratch.copy(e.point);
          groupRef.current.worldToLocal(h.scratch);
          if (h.target === 0) h.point.copy(h.scratch); // entree : pas de fronde
          h.raw.copy(h.scratch);
          h.target = 1;
          h.last = performance.now();
        }}
        onPointerLeave={() => {
          hover.current.target = 0;
        }}
      >
        <sphereGeometry args={[WORLD_SIZE * 0.75, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Decor : debris, tunnel, podium.                                    */
/* ------------------------------------------------------------------ */
function DebrisField() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const N = 10;
  const geo = React.useMemo(
    () => displace(new THREE.IcosahedronGeometry(1, 2), 0.38, 7),
    [],
  );
  const seeds = React.useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        pos: new THREE.Vector3(
          (seeded(i, 11) - 0.5) * 16,
          4 - i * 1.6,
          (seeded(i, 13) - 0.5) * 12 - 3,
        ),
        rot: seeded(i, 17) * Math.PI * 2,
        spin: 0.05 + seeded(i, 19) * 0.12,
        scale: 0.5 + seeded(i, 23) * 1.1,
      })),
    [],
  );
  const m4 = React.useMemo(() => new THREE.Matrix4(), []);
  const q = React.useMemo(() => new THREE.Quaternion(), []);
  const eu = React.useMemo(() => new THREE.Euler(), []);
  const pv = React.useMemo(() => new THREE.Vector3(), []);
  const sv = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      eu.set(s.rot + t * s.spin, s.rot * 1.3 + t * s.spin * 0.8, s.rot);
      q.setFromEuler(eu);
      pv.set(
        s.pos.x + Math.sin(t * 0.2 + i) * 0.3,
        s.pos.y + Math.cos(t * 0.17 + i * 2) * 0.3,
        s.pos.z,
      );
      sv.setScalar(s.scale);
      m4.compose(pv, q, sv);
      mesh.current.setMatrixAt(i, m4);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, N]}>
      <meshStandardMaterial color={PALETTE.debris} roughness={0.55} />
    </instancedMesh>
  );
}

const RING_COUNT = 3; // 3 anneaux max (retour client), repartis sur la profondeur

/* ------------------------------------------------------------------ */
/* Anneau igloo — porte depuis le projet fourni par le client          */
/* (Desktop/igloo-ring/src/IglooRing.tsx) : dalles d'arc biseautees,   */
/* monogramme central en 7 fragments, disque givre au reseau           */
/* triangule, neon a scintillement. Adaptations : nos fenetres de      */
/* formation par anneau pilotent l'assemblage ; disque et monogramme   */
/* se DISSOLVENT a l'approche de la camera (on traverse nos anneaux,   */
/* igloo regarde le sien de face).                                     */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeArcSlabGeometry(
  innerR: number,
  outerR: number,
  startA: number,
  endA: number,
  depth: number,
  roughAmp: number,
  seed: number,
) {
  const shape = new THREE.Shape();
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const a = startA + ((endA - startA) * i) / steps;
    if (i === 0) shape.moveTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
    else shape.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
  }
  for (let i = steps; i >= 0; i--) {
    const a = startA + ((endA - startA) * i) / steps;
    shape.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.35,
    bevelSize: (outerR - innerR) * 0.12,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  // relief rocheux cuit UNE fois — bruit continu en espace position :
  // deux sommets confondus se deplacent pareil, les faces ne dechirent pas
  const ph = seed * 0.37;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n =
      Math.sin(x * 2.1 + y * 1.7 + ph) * 0.45 +
      Math.sin(y * 3.6 + z * 2.9 + ph * 2) * 0.35 +
      Math.sin(z * 5.1 + x * 2.3 + ph * 3) * 0.2;
    const len = Math.hypot(x, y) || 1;
    pos.setX(i, x + (x / len) * n * roughAmp);
    pos.setY(i, y + (y / len) * n * roughAmp);
    pos.setZ(i, z + n * roughAmp * 0.8);
  }
  geo.computeVertexNormals();
  return geo;
}

function makeDiscTexture(): THREE.CanvasTexture {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.5);
  g.addColorStop(0, '#e9ecf0');
  g.addColorStop(0.55, '#dde1e7');
  g.addColorStop(1, '#cdd2d9');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  c.strokeStyle = 'rgba(160,166,175,0.35)';
  c.lineWidth = 2;
  for (const rr of [0.16, 0.27, 0.38]) {
    c.beginPath();
    c.arc(S / 2, S / 2, S * rr, 0, Math.PI * 2);
    c.stroke();
  }
  // reseau de givre triangule, plus dense vers la rive
  const rng = mulberry32(7);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 170; i++) {
    const a = rng() * Math.PI * 2;
    const r = S * (0.18 + Math.pow(rng(), 0.45) * 0.31);
    pts.push([S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r]);
  }
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < S * 0.07) {
        const rim =
          (Math.hypot(pts[i][0] - S / 2, pts[i][1] - S / 2) / (S * 0.5) - 0.35) /
          0.65;
        c.strokeStyle = 'rgba(255,255,255,' + (0.12 + Math.max(0, rim) * 0.5) + ')';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(pts[i][0], pts[i][1]);
        c.lineTo(pts[j][0], pts[j][1]);
        c.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface RingFrag {
  geo: THREE.BufferGeometry;
  home: [number, number, number];
  scatter: { pos: [number, number, number]; rot: [number, number, number] };
  window: [number, number];
}

function scatterFor(seed: number, spread: number): RingFrag['scatter'] {
  const rng = mulberry32(seed);
  return {
    pos: [
      (rng() - 0.5) * spread * 2,
      (rng() - 0.5) * spread * 1.4,
      1 + rng() * 3,
    ],
    rot: [(rng() - 0.5) * 2.4, (rng() - 0.5) * 2.4, (rng() - 0.5) * 2.4],
  };
}

function buildRingFrags(): RingFrag[] {
  const frags: RingFrag[] = [];
  const N = 8;
  const gap = 0.028;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 + gap;
    const a1 = ((i + 1) / N) * Math.PI * 2 - gap;
    frags.push({
      geo: makeArcSlabGeometry(3.45, 4.65, a0, a1, 0.85, 0.05, 100 + i),
      home: [0, 0, 0],
      scatter: scatterFor(200 + i, 7.5),
      window: [i * 0.055, 0.5 + i * 0.03],
    });
  }
  // (monogramme central retire — retour client : pas de debris au centre)
  return frags;
}

function Tunnel() {
  const camera = useThree((st) => st.camera);

  // geometries et textures partagees entre les 3 anneaux, construites 1x
  const shared = React.useMemo(() => {
    const frags = buildRingFrags();
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(S, S);
    const rng = mulberry32(42);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 165 + rng() * 70;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    const noise = new THREE.CanvasTexture(cv);
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set(3, 3);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: '#ccd0d7',
      roughness: 0.85,
      metalness: 0.06,
      bumpMap: noise,
      bumpScale: 0.6,
      roughnessMap: noise,
    });
    return { frags, stoneMat, discTex: makeDiscTexture() };
  }, []);

  const rings = React.useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, i) => {
        const camB = (5 + i * 12.5) / 40;
        return {
          baseY: -9 - i * 12.5,
          start: 0.3 + camB * 0.48 - 0.14,
          spin: seeded(i, 41) * Math.PI * 2,
          offX: (seeded(i, 43) - 0.5) * 0.7,
          offZ: (seeded(i, 47) - 0.5) * 0.7,
          // le disque fond a l'approche : materiaux par anneau
          neonMat: new THREE.MeshStandardMaterial({
            color: '#dff4ff',
            emissive: '#dff4ff',
            emissiveIntensity: 0,
            roughness: 0.3,
            toneMapped: false,
            fog: false,
          }),
          haloMat: new THREE.MeshBasicMaterial({
            color: '#dff4ff',
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            fog: false,
          }),
          discMat: new THREE.MeshStandardMaterial({
            roughness: 0.55,
            metalness: 0.02,
            transparent: true,
          }),
        };
      }),
    [],
  );
  React.useEffect(() => {
    for (const r of rings) {
      r.discMat.map = shared.discTex;
      r.discMat.needsUpdate = true;
    }
  }, [rings, shared]);

  const groupRefs = useRef<Array<THREE.Group | null>>([]);
  const fragRefs = useRef<Array<THREE.Mesh | null>>([]);
  const lightRefs = useRef<Array<THREE.PointLight | null>>([]);
  const F = shared.frags.length;

  useFrame(({ clock }) => {
    const p = store.current;
    const time = clock.elapsedTime;
    for (let i = 0; i < RING_COUNT; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;
      const r = rings[i];
      const ringT = clamp01((p - r.start) / 0.12);
      group.visible = ringT > 0.001;
      if (!group.visible) continue;

      // lente respiration de l'anneau assemble
      group.rotation.z = r.spin + ringT * 0.35 + time * 0.02;

      // assemblage : chaque fragment vole vers sa place dans SA fenetre
      for (let j = 0; j < F; j++) {
        const mesh = fragRefs.current[i * F + j];
        if (!mesh) continue;
        const fr = shared.frags[j];
        const t = easeOutCubic(
          clamp01((ringT - fr.window[0]) / (fr.window[1] - fr.window[0] || 1)),
        );
        mesh.position.set(
          THREE.MathUtils.lerp(fr.scatter.pos[0], fr.home[0], t),
          THREE.MathUtils.lerp(fr.scatter.pos[1], fr.home[1], t),
          THREE.MathUtils.lerp(fr.scatter.pos[2], fr.home[2], t),
        );
        mesh.rotation.set(
          fr.scatter.rot[0] * (1 - t),
          fr.scatter.rot[1] * (1 - t),
          fr.scatter.rot[2] * (1 - t),
        );
      }

      // allumage neon (seuil relatif igloo : 70 % de la formation) + flicker
      const ignite = easeOutCubic(clamp01((ringT - 0.7) / 0.3));
      const flicker = 1 + Math.sin(time * 20) * 0.035 * ignite;
      r.neonMat.emissiveIntensity = ignite * 4.2 * flicker;
      r.haloMat.opacity = ignite * 0.34;
      const light = lightRefs.current[i];
      if (light) light.intensity = ignite * 6 * flicker;

      // ON TRAVERSE l'anneau : le disque givre se dissout a l'approche
      // de la camera (et reapparait en remontant)
      const near = Math.abs(camera.position.y - r.baseY);
      const membrane = clamp01((near - 1.2) / 2.2);
      r.discMat.opacity = ringT * membrane;
    }
  });

  return (
    <group>
      {rings.map((r, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[r.offX, r.baseY, r.offZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          {shared.frags.map((fr, j) => (
            <mesh
              key={j}
              ref={(el) => {
                fragRefs.current[i * F + j] = el;
              }}
              geometry={fr.geo}
              material={shared.stoneMat}
            />
          ))}
          <mesh>
            <torusGeometry args={[3.22, 0.09, 24, 128]} />
            <primitive object={r.neonMat} attach="material" />
          </mesh>
          <pointLight
            ref={(el) => {
              lightRefs.current[i] = el;
            }}
            position={[0, 0, 2.5]}
            color="#dff4ff"
            intensity={0}
            distance={14}
            decay={2}
          />
          <mesh position={[0, 0, -0.1]}>
            <ringGeometry args={[2.6, 3.9, 96]} />
            <primitive object={r.haloMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, -0.25]}>
            <circleGeometry args={[3.35, 96]} />
            <primitive object={r.discMat} attach="material" />
          </mesh>
        </group>
      ))}
      {/* disque lumineux du fond, assorti aux neons */}
      <mesh position={[0, -45.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 48]} />
        <meshStandardMaterial
          color="#dff2ff"
          emissive="#bfe9ff"
          emissiveIntensity={1.3}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Podium igloo — porte depuis IglooPodium.tsx du projet fourni par    */
/* le client (igloo-ring) : 5 disques de pierre chanfreines au tour,   */
/* VAGUE RADIALE (chaque gradin oscille avec un dephasage — le         */
/* mouvement coule vers l'exterieur), rainures gravees, couture        */
/* lumineuse scintillante sur le 2e gradin, coeur pulsant additif sur  */
/* le piedestal. Adaptations : notre Rig garde la camera (leur lookAt  */
/* retire) ; halo plafond + cone volumetrique de la chambre conserves. */
/* ------------------------------------------------------------------ */

const WAVE_AMPLITUDE = 0.16;
const WAVE_SPEED = 1.1;
const WAVE_PHASE_STEP = 0.85;

function makeDiscGeometry(radius: number, thickness: number, chamfer: number) {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.001, thickness),
    new THREE.Vector2(radius - chamfer, thickness),
    new THREE.Vector2(radius, thickness - chamfer),
    new THREE.Vector2(radius, 0),
    new THREE.Vector2(0.001, 0),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

function makeGlowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(220,240,255,0.55)');
  g.addColorStop(1, 'rgba(220,240,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface PodiumRingDef {
  radius: number;
  thickness: number;
  baseY: number;
  grooves: number[];
}

// exterieur → interieur ; chaque gradin un peu plus haut (butte etagee)
const PODIUM_RINGS: PodiumRingDef[] = [
  { radius: 7.6, thickness: 0.34, baseY: 0.0, grooves: [6.9] },
  { radius: 6.1, thickness: 0.36, baseY: 0.22, grooves: [5.5] },
  { radius: 4.7, thickness: 0.38, baseY: 0.46, grooves: [4.1, 3.6] },
  { radius: 3.4, thickness: 0.4, baseY: 0.72, grooves: [2.9] },
  { radius: 2.1, thickness: 0.46, baseY: 1.0, grooves: [1.45] }, // piedestal
];
const SEAM_RING = 1;

function Podium() {
  const ringRefs = useRef<Array<THREE.Group | null>>([]);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null!);
  const seamMat = useRef<THREE.MeshStandardMaterial>(null!);
  const group = useRef<THREE.Group>(null!);
  const pointer = useThree((st) => st.pointer);

  const stoneTex = React.useMemo(() => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d')!;
    const img = c.createImageData(S, S);
    const rng = mulberry32(1337);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 170 + rng() * 60;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);
  const glowTex = React.useMemo(() => makeGlowTexture(), []);
  const discGeos = React.useMemo(
    () => PODIUM_RINGS.map((r) => makeDiscGeometry(r.radius, r.thickness, 0.07)),
    [],
  );
  const stoneMat = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c2c6ce',
        roughness: 0.72,
        metalness: 0.08,
        bumpMap: stoneTex,
        bumpScale: 0.5,
        roughnessMap: stoneTex,
      }),
    [stoneTex],
  );
  const grooveMat = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#9aa0ab',
        transparent: true,
        opacity: 0.55,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // vague radiale : chaque gradin oscille avec un dephasage — le
    // mouvement coule du centre vers l'exterieur
    for (let i = 0; i < PODIUM_RINGS.length; i++) {
      const g = ringRefs.current[i];
      if (!g) continue;
      g.position.y =
        PODIUM_RINGS[i].baseY +
        WAVE_AMPLITUDE * Math.sin(t * WAVE_SPEED - i * WAVE_PHASE_STEP);
    }

    // pulsation du coeur + scintillement de la couture
    const pulse = 0.75 + Math.sin(t * 1.7) * 0.25;
    coreMat.current.opacity = 0.55 + pulse * 0.45;
    seamMat.current.emissiveIntensity = 2.6 + Math.sin(t * 2.3) * 0.5;

    // lente derive + parallaxe pointeur
    const g = group.current;
    g.rotation.y += 0.0004;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.04, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pointer.x * 0.03, 0.05);
  });

  return (
    <group ref={group} position={[0, PODIUM_Y, 0]}>
      {PODIUM_RINGS.map((def, i) => (
        <group
          key={i}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          position={[0, def.baseY, 0]}
        >
          <mesh geometry={discGeos[i]} material={stoneMat} />
          {def.grooves.map((gr, j) => (
            <mesh
              key={j}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, def.thickness + 0.002, 0]}
            >
              <ringGeometry args={[gr - 0.012, gr + 0.012, 128]} />
              <primitive object={grooveMat} attach="material" />
            </mesh>
          ))}
          {i === SEAM_RING && (
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, def.thickness * 0.5, 0]}
            >
              <torusGeometry args={[def.radius + 0.02, 0.045, 16, 160]} />
              <meshStandardMaterial
                ref={seamMat}
                color="#e6f4ff"
                emissive="#e6f4ff"
                emissiveIntensity={2.6}
                roughness={0.3}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* coeur pulsant sur le piedestal, sous la sculpture */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, PODIUM_RINGS[4].baseY + PODIUM_RINGS[4].thickness + 0.06, 0]}
      >
        <circleGeometry args={[1.35, 64]} />
        <meshBasicMaterial
          ref={coreMat}
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          color="#dff2ff"
          fog={false}
        />
      </mesh>

      {/* fill au niveau de la couture */}
      <pointLight position={[0, 2.4, 0]} color="#e6f4ff" intensity={9} distance={16} decay={2} />

      {/* halo plafond + puits volumetrique de la chambre (conserves) */}
      <mesh position={[0, 8.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.9, 0.16, 10, 72]} />
        <meshStandardMaterial
          color="#dff2ff"
          emissive="#bfe9ff"
          emissiveIntensity={2.6}
          fog={false}
        />
      </mesh>
      <mesh position={[0, 5, 0]}>
        {/* colonne cylindrique (retour client : plus de cone evase) —
            meme rayon que le halo, elle s'y raccorde exactement */}
        <cylinderGeometry args={[3.9, 3.9, 6.8, 48, 1, true]} />
        <meshBasicMaterial
          color="#dff2ff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
function Rig() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const look = React.useMemo(() => new THREE.Vector3(), []);
  const lamp = useRef<THREE.PointLight>(null);
  const chamberLight = useRef<THREE.AmbientLight>(null);
  // Retour client : la chambre s'eclaircit une fois le tunnel passe.
  // Brouillard ET couleur de fond lerpes ensemble (ils doivent rester
  // identiques, c'est ce qui fond la scene), en zone C uniquement.
  const bgFrom = React.useMemo(() => new THREE.Color(PALETTE.bg), []);
  const bgTo = React.useMemo(() => new THREE.Color('#8f9aab'), []); // chambre laiteuse (retour client : eclatant)
  const bgScratch = React.useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    // amorti dt-corrige : meme sensation a 60 et 144 Hz
    const prev = store.current;
    store.current += (store.target - store.current) * (1 - Math.exp(-4 * delta));
    store.velocity = (store.current - prev) / Math.max(delta, 1e-4);

    const p = store.current;
    // Fenetres reequilibrees apres retour client (« la plongee va trop
    // vite ») : le tunnel occupe 48 % du parcours au lieu de 40 %, sur
    // un wrapper passe de 400 a 520svh.
    const A = THREE.MathUtils.smoothstep(p, 0, 0.3);
    const B = THREE.MathUtils.smoothstep(p, 0.3, 0.78);
    const C = THREE.MathUtils.smoothstep(p, 0.78, 1);

    // zone A : approche des debris vers la bouche du puits ; B : plongee
    // dans l'axe ; C : pose face au podium (tenue a p=1)
    if (C > 0) {
      camera.position.set(0, -44 - 6.4 * C, 7.4 * C);
      look.set(0, -50 + (PODIUM_Y + 3.0 + 50) * C, 0);
    } else if (B > 0) {
      camera.position.set(0, -4 - 40 * B, 2.4 * (1 - B));
      look.set(0, camera.position.y - 6, 0);
    } else {
      camera.position.set(0, 5 - 9 * A, 9 - 6.6 * A);
      look.set(0, camera.position.y - 2 - 4 * A, camera.position.z - 8);
    }
    camera.lookAt(look);
    // roulis proportionnel a la velocite amortie, zone tunnel seulement
    const roll =
      THREE.MathUtils.clamp(store.velocity * 4, -1, 1) * 0.07 * B * (1 - C);
    camera.rotateZ(roll);

    if (lamp.current) {
      lamp.current.position.set(0, camera.position.y - 1.2, camera.position.z * 0.4);
    }

    // densite de brouillard : +20 % au coeur du puits, s'eclaircit en bas
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.density =
        0.045 * (1 + 0.2 * Math.sin(Math.PI * B) * (1 - C)) - C * 0.017;
      // la chambre s'illumine : nuit → gris-bleu clair, fond et
      // brouillard synchrones, plus une ambiance dediee qui monte
      bgScratch.copy(bgFrom).lerp(bgTo, C);
      fog.color.copy(bgScratch);
      gl.setClearColor(bgScratch);
      if (chamberLight.current) chamberLight.current.intensity = 1.1 * C;
    }
  });
  return (
    <group>
      <pointLight ref={lamp} intensity={6} distance={20} color="#cfd8e6" />
      <ambientLight ref={chamberLight} intensity={0} color="#e6edf6" />
    </group>
  );
}

/**
 * Les effets DOIVENT etre enfants directs de l'EffectComposer (il
 * collecte ses passes par instance) : un composant intermediaire fait
 * exploser l'arbre en erreur circulaire — constate. L'aberration est
 * animee par ref d'instance depuis le useFrame du meme composant.
 */
function Effects() {
  // Vector2 STABLE, mute en place : l'effet reference l'instance, la
  // muter l'anime — ni ref castee ni prop recreee par rendu (la
  // ChromaticAberration recevait un Vector2 neuf a chaque rendu et
  // faisait exploser la reconciliation en stringify circulaire).
  const caOffset = React.useMemo(() => new THREE.Vector2(0.0012, 0.0012), []);
  useFrame(() => {
    const k = 0.0012 * (1 + Math.min(Math.abs(store.velocity) * 3, 3));
    caOffset.set(k, k);
  });
  return (
    <EffectComposer>
      <Bloom mipmapBlur luminanceThreshold={1} intensity={0.7} />
      <ChromaticAberration offset={caOffset} />
      <Noise opacity={0.04} />
      <Vignette darkness={0.55} offset={0.25} />
    </EffectComposer>
  );
}


/* ------------------------------------------------------------------ */
/* Composant principal : wrapper scroll natif + sticky + overlay.     */
/* ------------------------------------------------------------------ */
export default function TunnelPodiumFooter({
  items,
  ariaLabel,
  prevLabel,
  nextLabel,
  className = '',
}: TunnelPodiumFooterProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [selected, setSelected] = React.useState(0);
  const [carouselActive, setCarouselActive] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [contextLost, setContextLost] = React.useState(false);

  /* Scroll natif : progression brute depuis le rect, clampee, cible du
     store. Ecouteur passif — on ne capture rien. */
  React.useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    let idleTimer = 0;
    const read = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = THREE.MathUtils.clamp(-r.top / Math.max(total, 1), 0, 1);
      store.target = raw;
      window.clearTimeout(idleTimer);
      // regle d'aimantation : jamais plante a mi-chemin devant le podium
      idleTimer = window.setTimeout(() => {
        if (raw > 0.78 && raw < 0.95) {
          window.scrollTo({
            top: window.scrollY + r.bottom - window.innerHeight,
            behavior: 'smooth',
          });
        }
      }, 700);
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      window.clearTimeout(idleTimer);
    };
  }, []);

  /* Hors ecran : boucle de rendu totalement suspendue. */
  React.useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Hysteresis du carrousel : actif ≥ 0.95, inactif < 0.90. */
  React.useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setCarouselActive((was) =>
        was ? store.current >= 0.9 : store.current >= 0.95,
      );
    }, 150);
    return () => window.clearInterval(id);
  }, [visible]);

  /* Fleches clavier, hors champs editables, carrousel actif seulement. */
  React.useEffect(() => {
    if (!carouselActive) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t.isContentEditable
      )
        return;
      if (e.key === 'ArrowLeft')
        setSelected((s) => (s + items.length - 1) % items.length);
      if (e.key === 'ArrowRight') setSelected((s) => (s + 1) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [carouselActive, items.length]);

  const revealPodium = () => {
    wrapper.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  return (
    <div
      ref={wrapper}
      className={`relative h-[520svh] ${className}`}
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div
        className="sticky top-0 h-svh overflow-hidden"
        style={{ contain: 'layout paint' }}
      >
        {!contextLost && (
          <Canvas
            aria-hidden="true"
            frameloop={visible ? 'always' : 'never'}
            dpr={[1, 1.75]}
            gl={{
              antialias: false,
              powerPreference: 'high-performance',
              stencil: false,
            }}
            camera={{ fov: 55, near: 0.1, far: 90, position: [0, 5, 9] }}
            onCreated={({ gl, scene }) => {
              gl.toneMapping = THREE.NoToneMapping;
              gl.setClearColor(PALETTE.bg);
              scene.fog = new THREE.FogExp2(PALETTE.bg, 0.045);
              gl.domElement.addEventListener(
                'webglcontextlost',
                (e) => {
                  e.preventDefault();
                  setContextLost(true);
                },
                false,
              );
            }}
          >
            <ambientLight intensity={0.5} color="#8fa3bf" />
            <directionalLight position={[4, 8, 6]} intensity={0.9} color="#cfd8e6" />
            <pointLight
              position={[0, PODIUM_Y + 8, 0]}
              intensity={16}
              color="#dff2ff"
            />
            <Rig />
            <DebrisField />
            <Tunnel />
            <Podium />
            <ParticleSculpture
              items={items}
              selected={selected}
              anchorRefs={anchorRefs}
            />
            <Effects />
          </Canvas>
        )}

        {contextLost && (
          <div
            className="flex h-full items-center justify-center"
            style={{ backgroundColor: PALETTE.bg }}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border border-border px-6 py-3 font-mono text-sm text-text"
            >
              WebGL interrompu — recharger
            </button>
          </div>
        )}

        {/* HUD decoratif */}
        <div className="pointer-events-none absolute inset-0 font-mono text-[10px] uppercase tracking-[0.2em] text-text/25">
          <p className="absolute left-6 top-6">Allo-Dépannage — 24/7</p>
          <p className="absolute right-6 top-6">SECT. BXL / RING</p>
          <p className="absolute left-6 bottom-6">FOG 0.045 · DPR 1.75</p>
        </div>

        {/* Carrousel : de VRAIES ancres, toujours dans le DOM — lecteur
            d'ecran et clavier n'ont pas besoin de la descente. */}
        <nav
          aria-label={ariaLabel}
          className={`absolute inset-x-0 bottom-8 z-10 transition-opacity duration-500 ${
            carouselActive ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-widest">
            <button
              type="button"
              aria-label={prevLabel}
              onClick={() =>
                setSelected((s) => (s + items.length - 1) % items.length)
              }
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-[#1e2733]/70 transition-colors hover:text-[#1e2733]"
            >
              ‹
            </button>
            {items.map((item, i) => (
              <a
                key={item.id}
                ref={(el) => {
                  anchorRefs.current[i] = el;
                }}
                href={item.href}
                {...(item.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                onClick={() => setSelected(i)}
                onFocus={revealPodium}
                className={`flex min-h-[44px] items-center px-3 transition-all duration-300 ${
                  i === selected
                    ? 'text-[#151b24] before:pr-2 before:text-cta before:content-["["] after:pl-2 after:text-cta after:content-["]"]'
                    : 'text-[#1e2733]/45 hover:text-[#1e2733]/80'
                }`}
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              aria-label={nextLabel}
              onClick={() => setSelected((s) => (s + 1) % items.length)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-[#1e2733]/70 transition-colors hover:text-[#1e2733]"
            >
              ›
            </button>
          </div>
          <p aria-live="polite" className="sr-only">
            {items[selected].label} — {selected + 1} / {items.length}
          </p>
        </nav>
      </div>
    </div>
  );
}
