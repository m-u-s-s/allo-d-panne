'use client';

import { timer, type Timer } from 'd3-timer';
import { useEffect, useRef, useState } from 'react';

/**
 * Depanneuse filaire en halftone — canvas 2D pur.
 *
 * Aucun WebGL, aucun asset, aucune requete reseau : la geometrie est
 * declaree ici en coordonnees locales, le nuage de points est genere UNE
 * fois au montage, et seule la re-projection tourne a chaque frame. d3
 * n'est utilise que pour d3.timer — d'ou l'import du seul paquet
 * d3-timer (2 ko) plutot que d3 entier.
 *
 * La projection orthographique (lacet puis tangage, sin/cos main) expose
 * scale()/rotate() facon d3 pour que le code d'interaction se lise comme
 * l'original qu'il remplace.
 */

interface RotatingTowTruckProps {
  width?: number;
  height?: number;
  className?: string;
}

type Vec3 = [number, number, number];

interface TruckPart {
  name: string;
  vertices: Vec3[];
  edges: [number, number][];
  chrome: boolean;
}

type Mesh = { vertices: Vec3[]; edges: [number, number][] };

/* ------------------------------------------------------------------ */
/* Helpers de geometrie — le camion entier est fait de ces deux formes. */
/* ------------------------------------------------------------------ */

function makeBox(w: number, h: number, d: number, offset: Vec3): Mesh {
  const [ox, oy, oz] = offset;
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const vertices: Vec3[] = [
    [ox - x, oy - y, oz - z],
    [ox + x, oy - y, oz - z],
    [ox + x, oy + y, oz - z],
    [ox - x, oy + y, oz - z],
    [ox - x, oy - y, oz + z],
    [ox + x, oy - y, oz + z],
    [ox + x, oy + y, oz + z],
    [ox - x, oy + y, oz + z],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0], // face arriere
    [4, 5], [5, 6], [6, 7], [7, 4], // face avant
    [0, 4], [1, 5], [2, 6], [3, 7], // aretes longitudinales
  ];
  return { vertices, edges };
}

function makeCylinder(
  radius: number,
  length: number,
  segments: number,
  axis: 'x' | 'y' | 'z',
  offset: Vec3,
): Mesh {
  const [ox, oy, oz] = offset;
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];
  const half = length / 2;

  for (const side of [-1, 1]) {
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const u = Math.cos(a) * radius;
      const v = Math.sin(a) * radius;
      if (axis === 'x') vertices.push([ox + side * half, oy + u, oz + v]);
      else if (axis === 'y') vertices.push([ox + u, oy + side * half, oz + v]);
      else vertices.push([ox + u, oy + v, oz + side * half]);
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    edges.push([i, next]); // anneau 1
    edges.push([segments + i, segments + next]); // anneau 2
    edges.push([i, segments + i]); // generatrices
  }
  return { vertices, edges };
}

/* ------------------------------------------------------------------ */

export default function RotatingTowTruck({
  width = 800,
  height = 600,
  className = '',
}: RotatingTowTruckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rotationTimer: Timer | undefined;
    let onMouseDown: ((e: MouseEvent) => void) | undefined;
    let onWheel: ((e: WheelEvent) => void) | undefined;
    let onDocMove: ((e: MouseEvent) => void) | undefined;
    let onDocUp: (() => void) | undefined;

    const setup = async () => {
      try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D indisponible');

        /* ----- Dimensionnement responsive + retine (comme le globe). */
        const containerWidth = Math.min(width, window.innerWidth - 40);
        const containerHeight = Math.min(height, window.innerHeight - 100);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        context.scale(dpr, dpr);

        const cx = containerWidth / 2;
        const cy = containerHeight / 2;
        const radius = Math.min(containerWidth, containerHeight) / 2.5;

        /* ----- Le camion : plateau porte-char, cabine, fleche, crochet.
           Coordonnees locales, X = longueur (avant vers +X), Y = haut.
           GEOM ramene l'empattement (~3.5 unites brutes) dans le rayon
           projete pour que le camion tienne au cadrage a lacet 90°. */
        const GEOM = 0.78;
        const raw: Array<{ name: string; mesh: Mesh; chrome: boolean }> = [
          // Carrosserie (rendu sombre)
          { name: 'cab shell', mesh: makeBox(0.7, 0.55, 0.9, [0.95, 0.06, 0]), chrome: false },
          { name: 'hood', mesh: makeBox(0.42, 0.32, 0.78, [1.4, -0.06, 0]), chrome: false },
          { name: 'flatbed deck', mesh: makeBox(1.7, 0.06, 0.95, [-0.55, -0.16, 0]), chrome: false },
          { name: 'deck rail L', mesh: makeBox(1.7, 0.05, 0.05, [-0.55, -0.1, 0.47]), chrome: false },
          { name: 'deck rail R', mesh: makeBox(1.7, 0.05, 0.05, [-0.55, -0.1, -0.47]), chrome: false },
          { name: 'fender L', mesh: makeBox(0.55, 0.07, 0.08, [-0.6, -0.28, 0.5]), chrome: false },
          { name: 'fender R', mesh: makeBox(0.55, 0.07, 0.08, [-0.6, -0.28, -0.5]), chrome: false },
          // Chromes (rendu brillant)
          { name: 'grille', mesh: makeBox(0.06, 0.3, 0.72, [1.62, -0.05, 0]), chrome: true },
          { name: 'front bumper', mesh: makeBox(0.12, 0.12, 0.98, [1.66, -0.3, 0]), chrome: true },
          { name: 'rear bumper', mesh: makeBox(0.1, 0.1, 0.92, [-1.45, -0.3, 0]), chrome: true },
          { name: 'exhaust stack L', mesh: makeCylinder(0.035, 0.6, 8, 'y', [0.55, 0.28, 0.42]), chrome: true },
          { name: 'exhaust stack R', mesh: makeCylinder(0.035, 0.6, 8, 'y', [0.55, 0.28, -0.42]), chrome: true },
          { name: 'mirror arm L', mesh: makeBox(0.05, 0.05, 0.2, [1.28, 0.3, 0.55]), chrome: true },
          { name: 'mirror arm R', mesh: makeBox(0.05, 0.05, 0.2, [1.28, 0.3, -0.55]), chrome: true },
          { name: 'wheel front L', mesh: makeCylinder(0.17, 0.14, 12, 'z', [1.15, -0.33, 0.42]), chrome: true },
          { name: 'wheel front R', mesh: makeCylinder(0.17, 0.14, 12, 'z', [1.15, -0.33, -0.42]), chrome: true },
          { name: 'wheel rear1 L', mesh: makeCylinder(0.17, 0.14, 12, 'z', [-0.35, -0.33, 0.42]), chrome: true },
          { name: 'wheel rear1 R', mesh: makeCylinder(0.17, 0.14, 12, 'z', [-0.35, -0.33, -0.42]), chrome: true },
          { name: 'wheel rear2 L', mesh: makeCylinder(0.17, 0.14, 12, 'z', [-0.8, -0.33, 0.42]), chrome: true },
          { name: 'wheel rear2 R', mesh: makeCylinder(0.17, 0.14, 12, 'z', [-0.8, -0.33, -0.42]), chrome: true },
          { name: 'fuel tank L', mesh: makeCylinder(0.1, 0.45, 10, 'x', [0.35, -0.34, 0.46]), chrome: true },
          { name: 'fuel tank R', mesh: makeCylinder(0.1, 0.45, 10, 'x', [0.35, -0.34, -0.46]), chrome: true },
          { name: 'boom post', mesh: makeCylinder(0.05, 0.5, 8, 'y', [-1.15, 0.08, 0]), chrome: true },
          { name: 'boom arm', mesh: makeCylinder(0.04, 0.75, 8, 'x', [-1.35, 0.3, 0]), chrome: true },
          { name: 'tow cable', mesh: makeBox(0.012, 0.22, 0.012, [-1.72, 0.17, 0]), chrome: true },
          { name: 'tow hook', mesh: makeCylinder(0.06, 0.03, 10, 'z', [-1.72, 0.02, 0]), chrome: true },
        ];

        const parts: TruckPart[] = raw.map((p) => ({
          name: p.name,
          chrome: p.chrome,
          vertices: p.mesh.vertices.map(
            ([x, y, z]): Vec3 => [x * GEOM, y * GEOM, z * GEOM],
          ),
          edges: p.mesh.edges,
        }));

        /* ----- Nuage halftone : marche a pas constant le long de chaque
           arete, emis UNE fois ici — jamais par frame. */
        let dotSpacing = 16;

        const generateDots = () => {
          const xyz: number[] = [];
          const chromeFlags: number[] = [];
          const stepSize = dotSpacing * 0.008;
          let totalDots = 0;

          for (const part of parts) {
            let pointsGenerated = 0;
            for (const [a, b] of part.edges) {
              const va = part.vertices[a];
              const vb = part.vertices[b];
              const len = Math.hypot(
                vb[0] - va[0],
                vb[1] - va[1],
                vb[2] - va[2],
              );
              const steps = Math.max(1, Math.round(len / stepSize));
              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                xyz.push(
                  va[0] + (vb[0] - va[0]) * t,
                  va[1] + (vb[1] - va[1]) * t,
                  va[2] + (vb[2] - va[2]) * t,
                );
                chromeFlags.push(part.chrome ? 1 : 0);
                pointsGenerated++;
              }
            }
            totalDots += pointsGenerated;
            console.log(
              `[v0] Generated ${pointsGenerated} points for part:`,
              part.name,
            );
          }
          console.log(
            `[v0] Total dots generated: ${totalDots} across ${parts.length} parts`,
          );
          return { xyz, chromeFlags, totalDots };
        };

        let cloud = generateDots();
        while (cloud.totalDots > 6000) {
          dotSpacing = Math.round(dotSpacing * 1.5);
          console.log(
            `[v0] Dot budget exceeded (${cloud.totalDots} > 6000), dotSpacing raised to ${dotSpacing}`,
          );
          cloud = generateDots();
        }
        const { xyz, chromeFlags } = cloud;
        const dotCount = chromeFlags.length;

        /* ----- Projection main : lacet (Y) puis tangage (X), accesseurs
           scale/rotate facon d3 pour garder le code d'interaction
           identique a l'original. */
        let rotation: [number, number] = [0, -12];
        let currentScale = radius;

        const rotatePoint = (
          x: number,
          y: number,
          z: number,
        ): [number, number, number] => {
          const yaw = (rotation[0] * Math.PI) / 180;
          const pitch = (rotation[1] * Math.PI) / 180;
          const cy1 = Math.cos(yaw);
          const sy1 = Math.sin(yaw);
          const cx1 = Math.cos(pitch);
          const sx1 = Math.sin(pitch);
          const x1 = x * cy1 + z * sy1;
          const z1 = -x * sy1 + z * cy1;
          const y2 = y * cx1 - z1 * sx1;
          const z2 = y * sx1 + z1 * cx1;
          return [x1, y2, z2];
        };

        const project = (
          x: number,
          y: number,
          z: number,
        ): [number, number, number] => {
          const [rx, ry, rz] = rotatePoint(x, y, z);
          return [cx + rx * currentScale, cy - ry * currentScale, rz];
        };

        const projection = {
          scale(s?: number): number {
            if (s !== undefined) currentScale = s;
            return currentScale;
          },
          rotate(r?: [number, number]): [number, number] {
            if (r) rotation = r;
            return rotation;
          },
        };

        /* ----- Rendu — meme squelette que le render() du globe. */
        const render = () => {
          context.clearRect(0, 0, containerWidth, containerHeight);
          const scaleNow = projection.scale();
          const scaleFactor = scaleNow / radius;

          // 1. Fond noir profond.
          context.fillStyle = '#000000';
          context.fillRect(0, 0, containerWidth, containerHeight);

          // 2. Ombre de contact elliptique sous les roues — le seul
          // remplissage non-pointille de la scene.
          const groundY = cy + 0.52 * scaleNow;
          context.save();
          context.translate(cx, groundY);
          context.scale(1, 0.26);
          const shadow = context.createRadialGradient(
            0, 0, 0,
            0, 0, 1.35 * scaleNow,
          );
          shadow.addColorStop(0, 'rgba(255,255,255,0.06)');
          shadow.addColorStop(1, 'rgba(255,255,255,0)');
          context.fillStyle = shadow;
          context.beginPath();
          context.arc(0, 0, 1.35 * scaleNow, 0, Math.PI * 2);
          context.fill();
          context.restore();

          // 3. Aretes filaires — DEUX traces par frame (un par godet
          // d'alpha), jamais un par arete.
          context.strokeStyle = '#ffffff';
          context.lineWidth = 1 * scaleFactor;
          for (const nearPass of [false, true]) {
            context.globalAlpha = nearPass ? 1 : 0.25;
            context.beginPath();
            for (const part of parts) {
              for (const [a, b] of part.edges) {
                const va = part.vertices[a];
                const vb = part.vertices[b];
                const [x0, y0, d0] = project(va[0], va[1], va[2]);
                const [x1, y1, d1] = project(vb[0], vb[1], vb[2]);
                const near = (d0 + d1) / 2 >= 0;
                if (near !== nearPass) continue;
                context.moveTo(x0, y0);
                context.lineTo(x1, y1);
              }
            }
            context.stroke();
          }
          context.globalAlpha = 1;

          // 4. Nuage halftone — quatre godets (pres/loin × chrome/corps),
          // garde d'ecran identique au globe.
          const buckets: Array<{
            alpha: number;
            r: number;
            fill: string;
            near: boolean;
            chrome: boolean;
          }> = [
            { alpha: 0.25, r: 0.8 * scaleFactor, fill: '#999999', near: false, chrome: false },
            { alpha: 0.25, r: 0.8 * scaleFactor, fill: '#ffffff', near: false, chrome: true },
            { alpha: 1, r: 1.2 * scaleFactor, fill: '#999999', near: true, chrome: false },
            { alpha: 1, r: 1.2 * scaleFactor, fill: '#ffffff', near: true, chrome: true },
          ];
          for (const bucket of buckets) {
            context.globalAlpha = bucket.alpha;
            context.fillStyle = bucket.fill;
            context.beginPath();
            for (let i = 0; i < dotCount; i++) {
              if ((chromeFlags[i] === 1) !== bucket.chrome) continue;
              const [sx, sy, depth] = project(
                xyz[i * 3],
                xyz[i * 3 + 1],
                xyz[i * 3 + 2],
              );
              if (depth >= 0 !== bucket.near) continue;
              if (sx < 0 || sx > containerWidth || sy < 0 || sy > containerHeight) continue;
              context.moveTo(sx + bucket.r, sy);
              context.arc(sx, sy, bucket.r, 0, Math.PI * 2);
            }
            context.fill();
          }
          context.globalAlpha = 1;

          // 5. Passe de rive blanc froid : les chromes proches de la
          // silhouette (bande etroite de profondeur) grossissent — le
          // camion reste lisible sur noir sous tous les angles.
          context.fillStyle = '#ffffff';
          context.beginPath();
          const rim = 1.6 * scaleFactor;
          for (let i = 0; i < dotCount; i++) {
            if (chromeFlags[i] !== 1) continue;
            const [sx, sy, depth] = project(
              xyz[i * 3],
              xyz[i * 3 + 1],
              xyz[i * 3 + 2],
            );
            if (depth < 0 || depth > 0.12) continue;
            if (sx < 0 || sx > containerWidth || sy < 0 || sy > containerHeight) continue;
            context.moveTo(sx + rim, sy);
            context.arc(sx, sy, rim, 0, Math.PI * 2);
          }
          context.fill();
        };

        /* ----- Animation + interactions : identiques a l'original. */
        let autoRotate = true;
        const rotationSpeed = 0.5;

        const rotate = () => {
          if (autoRotate) {
            rotation[0] += rotationSpeed;
            projection.rotate(rotation);
            render();
          }
        };
        rotationTimer = timer(rotate);

        onMouseDown = (event: MouseEvent) => {
          autoRotate = false;
          const startX = event.clientX;
          const startY = event.clientY;
          const startRotation: [number, number] = [...rotation];
          const sensitivity = 0.5;

          onDocMove = (e: MouseEvent) => {
            rotation = [
              startRotation[0] + (e.clientX - startX) * sensitivity,
              Math.max(
                -90,
                Math.min(
                  90,
                  startRotation[1] - (e.clientY - startY) * sensitivity,
                ),
              ),
            ];
            projection.rotate(rotation);
            render();
          };
          onDocUp = () => {
            if (onDocMove) document.removeEventListener('mousemove', onDocMove);
            if (onDocUp) document.removeEventListener('mouseup', onDocUp);
            setTimeout(() => {
              autoRotate = true;
            }, 10);
          };
          document.addEventListener('mousemove', onDocMove);
          document.addEventListener('mouseup', onDocUp);
        };
        canvas.addEventListener('mousedown', onMouseDown);

        onWheel = (event: WheelEvent) => {
          event.preventDefault();
          const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
          projection.scale(
            Math.max(
              radius * 0.5,
              Math.min(radius * 3, projection.scale() * scaleFactor),
            ),
          );
          render();
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });

        render();
        setIsLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Rendu impossible');
        setIsLoading(false);
      }
    };

    void setup();

    return () => {
      rotationTimer?.stop();
      if (onMouseDown) canvas.removeEventListener('mousedown', onMouseDown);
      if (onWheel) canvas.removeEventListener('wheel', onWheel);
      // Si le composant meurt en plein drag, les listeners document
      // survivraient a la souris levee — on les enleve aussi.
      if (onDocMove) document.removeEventListener('mousemove', onDocMove);
      if (onDocUp) document.removeEventListener('mouseup', onDocUp);
    };
  }, [width, height]);

  if (error) {
    return (
      <div className="dark flex items-center justify-center rounded-2xl bg-card p-8">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="dark h-auto w-full rounded-2xl bg-background"
        style={{ maxWidth: '100%', height: 'auto' }}
        aria-label="Dépanneuse en fil de fer, rotation interactive"
      />
      {!isLoading && (
        <div className="dark absolute bottom-4 left-4 rounded-md bg-neutral-900 px-2 py-1 text-xs text-muted-foreground">
          Glisser pour pivoter · Molette pour zoomer
        </div>
      )}
    </div>
  );
}
