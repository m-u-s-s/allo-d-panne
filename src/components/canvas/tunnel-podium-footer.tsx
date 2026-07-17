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
const MORPH_SECONDS = 1.15;
const WORLD_SIZE = 3.2;
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
    // enveloppe triangle : pic en plein vol, zero au repos
    float flight = 1.0 - abs(t * 2.0 - 1.0);
    vFlight = flight;

    vec3 pos = mix(aPositionFrom, aPositionTo, t);
    pos += swirl(pos, aRand.z, t * aRand.w) * flight * 0.55;
    // micro-vie au repos + lente derive de groupe
    pos.x += sin(uTime * 0.6 + aRand.z * 40.0) * 0.012;
    pos.y += cos(uTime * 0.5 + aRand.z * 28.0) * 0.012;
    float g = uTime * 0.12;
    pos = vec3(
      pos.x * cos(g) - pos.z * sin(g),
      pos.y + sin(uTime * 0.4) * 0.06,
      pos.x * sin(g) + pos.z * cos(g)
    );

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
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const clouds = useRef<Array<Float32Array | null>>([]);
  const prevSelected = useRef(0);
  const pressRef = useRef({ t: 0, x: 0, y: 0 });

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
  });

  return (
    <group position={[0, PODIUM_Y + 3.3, 0]}>
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

function Tunnel() {
  const geo = React.useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      const r = 4 + seeded(i, 31) * 1.1;
      const ring = displace(
        new THREE.TorusGeometry(r, 1.35 + seeded(i, 37) * 0.5, 10, 26),
        0.3,
        i * 3,
      );
      ring.rotateX(Math.PI / 2);
      ring.rotateY(seeded(i, 41) * Math.PI);
      ring.translate(
        (seeded(i, 43) - 0.5) * 0.8,
        -7.5 - i * 3.2,
        (seeded(i, 47) - 0.5) * 0.8,
      );
      rings.push(ring);
    }
    // UNE geometrie fusionnee, faces vers l'INTERIEUR (BackSide) — la
    // camera vole dedans, sans ca le tunnel est invisible.
    return mergeGeometries(rings)!;
  }, []);

  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={PALETTE.rock}
          roughness={0.9}
          side={THREE.BackSide}
        />
      </mesh>
      {/* jonc emissif d'entree + disque lumineux du fond : fog:false,
          ils percent la brume comme dans la reference */}
      <mesh position={[0, -7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.6, 0.09, 8, 64]} />
        <meshStandardMaterial
          color={PALETTE.ember}
          emissive={PALETTE.ember}
          emissiveIntensity={2.5}
          fog={false}
        />
      </mesh>
      <mesh position={[0, -45.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 48]} />
        <meshStandardMaterial
          color={PALETTE.discGlow}
          emissive={PALETTE.discGlow}
          emissiveIntensity={1.3}
          fog={false}
        />
      </mesh>
    </group>
  );
}

function Podium() {
  return (
    <group position={[0, PODIUM_Y, 0]}>
      {[
        [6.5, 0.28, 0],
        [5.2, 0.28, 0.24],
        [3.9, 0.28, 0.48],
        [2.6, 0.28, 0.72],
      ].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y + h / 2, 0]}>
          <cylinderGeometry args={[r, r * 1.04, h, 72]} />
          <meshStandardMaterial
            color={PALETTE.metal}
            metalness={0.75}
            roughness={0.4}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[1.5, 1.62, 0.6, 64]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* couture lumineuse du pourtour */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.52, 0.05, 8, 96]} />
        <meshStandardMaterial
          color={PALETTE.ember}
          emissive={PALETTE.ember}
          emissiveIntensity={1.7}
          fog={false}
        />
      </mesh>
      {/* halo plafond + puits volumetrique factice (additif, fog:false —
          additif + fog = voile laiteux, l'alpha fait le fondu) */}
      <mesh position={[0, 8.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.9, 0.16, 10, 72]} />
        <meshStandardMaterial
          color={PALETTE.emberSoft}
          emissive={PALETTE.emberSoft}
          emissiveIntensity={2.2}
          fog={false}
        />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <coneGeometry args={[3.9, 6.8, 48, 1, true]} />
        <meshBasicMaterial
          color={PALETTE.emberSoft}
          transparent
          opacity={0.035}
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
/* Camera + brouillard : pilotage par la progression amortie.         */
/* ------------------------------------------------------------------ */
function Rig() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const look = React.useMemo(() => new THREE.Vector3(), []);
  const lamp = useRef<THREE.PointLight>(null);

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
      look.set(0, -50 + (PODIUM_Y + 2.9 + 50) * C, 0);
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
    }
  });
  return <pointLight ref={lamp} intensity={18} distance={26} color="#cfd8e6" />;
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
              color={PALETTE.emberSoft}
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
          <p className="absolute left-6 top-6">Alo-Dépannage — 24/7</p>
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
              aria-label="Précédent"
              onClick={() =>
                setSelected((s) => (s + items.length - 1) % items.length)
              }
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-text/60 transition-colors hover:text-text"
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
                    ? 'text-text before:pr-2 before:text-cta before:content-["["] after:pl-2 after:text-cta after:content-["]"]'
                    : 'text-text/35 hover:text-text/70'
                }`}
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              aria-label="Suivant"
              onClick={() => setSelected((s) => (s + 1) % items.length)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-text/60 transition-colors hover:text-text"
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
