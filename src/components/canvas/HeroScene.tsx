'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { ShaderMaterial, Vector2 } from 'three';
import { scrollState } from './scroll-state';

/**
 * Le plan est dessine directement en espace de clip : gl_Position prend
 * position.xy tel quel, sans matrice. Un planeGeometry(2,2) couvre donc
 * exactement l'ecran quelle que soit la camera — pas de calcul de
 * viewport a maintenir, pas de plan qui se decadre au resize.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Fond aurora : nappes de couleur radieuses (bleu electrique, violet,
 * pointe d'ambre) flottant sur une base profonde — le langage moderne
 * type Linear/Stripe (demande client : « moderne et lumineux »).
 * Garde-fou : tout le site pose du texte BLANC sur ce fond ; la
 * luminosite vient des lueurs, jamais d'un fond clair — la base reste
 * sous ~0.3 de luminance la ou vit le texte.
 *
 * Entierement genere, aucune texture. uQuality 1.0 = Full, 0.0 = Lite
 * (2 octaves de fbm, pas de grain) : la version simplifiee de la spec,
 * pas un shader en double.
 */
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uQuality;
  uniform float uReveal;
  uniform float uEnergy;
  uniform float uScroll;

  varying vec2 vUv;

  const vec3 BG    = vec3(0.039, 0.055, 0.078);
  const vec3 AMBER = vec3(0.976, 0.451, 0.086);
  const vec3 BLUE  = vec3(0.231, 0.510, 0.965);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(1.8, 1.0);

    // La parallaxe souris et le scroll animent la MATIERE des nappes.
    vec2 drift = uMouse * 0.06;
    int octaves = uQuality > 0.5 ? 4 : 2;
    vec2 flow = vec2(uTime * 0.03, uTime * 0.015 - uScroll * 1.2);
    float mist = fbm(p * 2.2 + drift + flow, octaves);

    // Trois nappes aurora aux centres derivant lentement ; le scroll les
    // fait glisser verticalement — le fond accompagne la page.
    vec2 c1 = vec2(-0.55 + 0.10 * sin(uTime * 0.11), 0.28 + 0.08 * cos(uTime * 0.09) - uScroll * 0.35);
    vec2 c2 = vec2(0.62 + 0.12 * cos(uTime * 0.07), -0.05 + 0.10 * sin(uTime * 0.13) + uScroll * 0.25);
    vec2 c3 = vec2(0.05 + 0.18 * sin(uTime * 0.05), -0.42 - uScroll * 0.2);

    float g1 = exp(-dot(p - c1, p - c1) * 2.6) * (0.55 + mist * 0.7);
    float g2 = exp(-dot(p - c2, p - c2) * 3.2) * (0.5 + mist * 0.8);
    float g3 = exp(-dot(p - c3, p - c3) * 4.5) * (0.4 + mist * 0.6);

    const vec3 VIOLET = vec3(0.545, 0.361, 0.965);

    vec3 col = BG * 1.35; // base legerement relevee : profonde, pas noire
    col += BLUE * g1 * (0.55 + uEnergy * 0.2);
    col += VIOLET * g2 * 0.42;
    col += AMBER * g3 * 0.30;
    // sheen : leger degrade vertical qui eclaircit le haut, tres doux
    col += vec3(0.10, 0.12, 0.17) * smoothstep(0.2, 1.0, uv.y) * 0.5;

    // Compression exponentielle : les coeurs de nappes saturent en
    // douceur sans deriver de teinte, la luminance reste maitrisee la
    // ou vit le texte blanc.
    col = vec3(1.0) - exp(-col * 1.35);

    // Vignette adoucie : le centre respire, les bords tiennent le cadre.
    col *= 1.0 - 0.22 * length(uv - 0.5);

    // Grain, palier Full uniquement. Il casse le banding des degrades
    // sombres, tres visible sur un fond aussi proche du noir.
    if (uQuality > 0.5) {
      float grain = hash(uv * 900.0 + uTime) - 0.5;
      col += grain * 0.012;
    }

    // uReveal : le canvas s'invite en fondu au lieu d'apparaitre d'un
    // coup une fois le bundle charge. Anime cote JS, pas en CSS, pour ne
    // pas declencher une composition de couche sur un canvas plein ecran.
    gl_FragColor = vec4(col, uReveal);
  }
`;

export function HeroScene({ quality }: { quality: number }) {
  const material = useRef<ShaderMaterial>(null);
  const { pointer } = useThree();
  const smoothed = useRef(new Vector2(0, 0));
  const energy = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uQuality: { value: quality },
      uReveal: { value: 0 },
      uEnergy: { value: 0 },
      uScroll: { value: 0 },
    }),
    // quality ne change qu'au changement de palier, ou tout le canvas est
    // remonte de toute facon.
    [quality],
  );

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;

    // La velocite Lenis arrive brute (px/frame, signee, nerveuse). On la
    // normalise et on la lisse ICI, cote lecture : le shader ne recoit
    // qu'une energie 0..1 amortie, et la couche motion n'a pas besoin de
    // connaitre les besoins du rendu.
    const target = Math.min(Math.abs(scrollState.velocity) / 45, 1);
    energy.current += (target - energy.current) * Math.min(1, delta * 4);

    // Le temps s'ecoule plus vite pendant le scroll : la brume et le
    // balayage s'activent avec le mouvement, retombent au repos.
    m.uniforms.uTime.value += delta * (1 + energy.current * 2.0);
    m.uniforms.uEnergy.value = energy.current;
    m.uniforms.uScroll.value = scrollState.progress;

    // Fondu d'entree ~0.8s. Borne a 1 pour ne pas depasser en alpha.
    m.uniforms.uReveal.value = Math.min(1, m.uniforms.uReveal.value + delta * 1.25);

    // Lissage du pointeur : le suivi direct donne un rendu nerveux et
    // fait paraitre le decor mecanique. Le retard est ce qui le rend
    // atmospherique.
    smoothed.current.lerp(pointer, Math.min(1, delta * 2.5));
    m.uniforms.uMouse.value.copy(smoothed.current);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
