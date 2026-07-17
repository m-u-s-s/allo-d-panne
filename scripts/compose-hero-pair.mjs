/**
 * Compositeur de la paire wrecked/reveal — l'etape « un seul document »
 * du workflow : toutes les couches vivent dans les memes coordonnees
 * 1600×1000, les deux finals sortent du meme pipeline.
 *
 *   base    = master genere, objet d'arriere-plan rate EFFACE (fond plat)
 *   wrecked = base + degats DESSINES SOUS MASQUE (silhouette voiture)
 *   reveal  = transparent + patch camion (tons harmonises) + decoupe
 *             emplumee de la voiture propre + ombres
 *
 * Confinement par construction : les degats sont clippes par un masque
 * flou de la silhouette ; hors masques, wrecked === base au bit pres —
 * verifie en fin de script (echantillonnage), pas suppose.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const S = process.argv[2];
const OUT = process.argv[3];

const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const baseUrl = b64(`${S}/base-1600.png`, 'image/png');
const truckUrl = b64(`${S}/truck-31.jpg`, 'image/jpeg');

const browser = await chromium.launch();
const page = await browser.newPage();
const result = await page.evaluate(
  async ({ baseUrl, truckUrl }) => {
    const W = 1600;
    const H = 1000;
    const load = (src) =>
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
    const [baseImg, truckImg] = await Promise.all([load(baseUrl), load(truckUrl)]);
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      return [c, c.getContext('2d')];
    };

    /* ---- 1. Base nettoyee : effacer l'objet rate au fond plat. ---- */
    const [baseC, bctx] = mk();
    bctx.drawImage(baseImg, 0, 0, W, H);
    // teinte du fond echantillonnee autour de la zone a effacer
    const sampleAvg = (ctx, x, y, w, h) => {
      const d = ctx.getImageData(x, y, w, h).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      return [r / n, g / n, b / n];
    };
    // echantillons DIRECTEMENT au-dessus et en-dessous de la zone, meme
    // x : le fond a un gradient vertical, un echantillon lateral donnait
    // un rectangle gris visible (constate a l'oeil, v1).
    const bgTop = sampleAvg(bctx, 200, 288, 120, 22);
    const bgBot = sampleAvg(bctx, 200, 566, 120, 22);
    const [patchC, pctx] = mk();
    const patch = pctx.createLinearGradient(0, 312, 0, 570);
    patch.addColorStop(0, `rgb(${bgTop.map(Math.round).join(',')})`);
    patch.addColorStop(1, `rgb(${bgBot.map(Math.round).join(',')})`);
    pctx.fillStyle = patch;
    pctx.fillRect(30, 308, 430, 268);
    const [pm, pmctx] = mk();
    pmctx.filter = 'blur(14px)';
    pmctx.fillStyle = '#000';
    pmctx.beginPath();
    pmctx.roundRect(60, 398, 372, 152, 26);
    pmctx.fill();
    // l'antenne de l'objet efface depasse au-dessus de la zone (vestige
    // constate en v2) : extension fine du masque vers le haut
    pmctx.beginPath();
    pmctx.roundRect(258, 318, 70, 100, 18);
    pmctx.fill();
    pmctx.filter = 'none';
    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(pm, 0, 0);
    pctx.globalCompositeOperation = 'source-over';
    bctx.drawImage(patchC, 0, 0);
    // bruit leger pour eviter l'aplat mort sur la zone effacee
    const nz = bctx.getImageData(55, 395, 380, 160);
    for (let i = 0; i < nz.data.length; i += 4) {
      const n = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const v = (n - 0.5) * 3;
      nz.data[i] += v; nz.data[i + 1] += v; nz.data[i + 2] += v;
    }
    bctx.putImageData(nz, 55, 395);

    /* ---- 2. Patch camion : tons harmonises, plume large. ---------- */
    // source (971×607) : camion x60..940, y195..480 (ombre comprise)
    const SRC = { x: 60, y: 195, w: 880, h: 285 };
    const SCALE = 0.72; // ~175px de caisse : « plusieurs metres derriere »
    const DST = { w: SRC.w * SCALE, h: SRC.h * SCALE };
    DST.x = -55;              // avant coupe par le bord du cadre (spec)
    DST.y = 535 - DST.h;      // ligne de sol arriere-plan ≈ 535
    const [truckC, tctx] = mk();
    // Le principe du composant applique au patch lui-meme : on peint le
    // camion PAR-DESSUS les pixels de la base nettoyee, puis on matte
    // serre sur sa silhouette — la bordure du patch est ainsi faite des
    // memes pixels que la couche A, invisible par construction (le
    // rectangle de fond embarque de la v1 se voyait sur fond vert).
    tctx.drawImage(baseC, 0, 0);
    tctx.drawImage(
      truckImg,
      SRC.x, SRC.y, SRC.w, SRC.h,
      DST.x, DST.y, DST.w, DST.h,
    );
    // harmonisation : delta entre le fond du cliche camion et le fond base
    const tBg = (() => {
      const [c2, x2] = mk();
      x2.drawImage(truckImg, 0, 0);
      return sampleAvg(x2, 700, 60, 80, 60);
    })();
    const delta = [bgTop[0] - tBg[0], bgTop[1] - tBg[1], bgTop[2] - tBg[2]];
    const td = tctx.getImageData(0, 0, W, H);
    for (let i = 0; i < td.data.length; i += 4) {
      if (td.data[i + 3] === 0) continue;
      td.data[i] += delta[0]; td.data[i + 1] += delta[1]; td.data[i + 2] += delta[2];
    }
    tctx.putImageData(td, 0, 0);
    // matte serre : silhouette du camion en coords source, mappee dst
    const truckHull = [
      [62, 330], [88, 250], [175, 218], [330, 202], [560, 196],
      [930, 200], [944, 300], [936, 432], [880, 466], [170, 468], [84, 430],
    ];
    const mapPt = ([x, y]) => [
      (x - SRC.x) * SCALE + DST.x,
      (y - SRC.y) * SCALE + DST.y,
    ];
    const [fm, fctx] = mk();
    fctx.filter = 'blur(10px)';
    fctx.fillStyle = '#000';
    fctx.beginPath();
    const th = truckHull.map(mapPt);
    fctx.moveTo(th[0][0], th[0][1]);
    for (const [x, y] of th.slice(1)) fctx.lineTo(x, y);
    fctx.closePath();
    fctx.fill();
    // ombre de contact du camion
    fctx.beginPath();
    const shc = mapPt([500, 462]);
    fctx.ellipse(shc[0], shc[1], 330 * SCALE, 16, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.filter = 'none';
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(fm, 0, 0);
    tctx.globalCompositeOperation = 'source-over';

    /* ---- 3. Masques voiture (degats + decoupe). ------------------- */
    const carHull = [
      [186, 648], [205, 598], [298, 562], [420, 542], [520, 540],
      [600, 502], [700, 480], [910, 478], [1090, 502], [1210, 528],
      [1345, 538], [1455, 552], [1526, 578], [1536, 640], [1530, 706],
      [1488, 744], [1360, 758], [1252, 800], [1150, 800], [1044, 764],
      [700, 764], [516, 806], [330, 800], [232, 752], [190, 700],
    ];
    const hullPath = (ctx, pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
    };
    const maskCanvas = (pts, blur, growY = 0) => {
      const [c2, x2] = mk();
      x2.filter = `blur(${blur}px)`;
      x2.fillStyle = '#000';
      hullPath(x2, pts.map(([x, y]) => [x, y + growY]));
      x2.fill();
      x2.filter = 'none';
      return c2;
    };
    const damageMask = maskCanvas(carHull, 10);
    // decoupe : coque + ombre au sol
    const cutHull = [...carHull];
    const cutMask = (() => {
      const [c2, x2] = mk();
      x2.filter = 'blur(16px)';
      x2.fillStyle = '#000';
      hullPath(x2, cutHull);
      x2.fill();
      // ombre : bandeau sous la voiture
      x2.beginPath();
      x2.ellipse(860, 800, 700, 46, 0, 0, Math.PI * 2);
      x2.fill();
      x2.filter = 'none';
      return c2;
    })();

    /* ---- 4. Degats : dessines puis clippes par le masque. --------- */
    const [dmg, dctx] = mk();
    // pare-brise fissure (la voiture regarde a GAUCHE)
    dctx.strokeStyle = 'rgba(235,238,224,0.75)';
    dctx.lineWidth = 2.5;
    dctx.lineCap = 'round';
    const crack = (cx, cy, arms) => {
      for (const [dx, dy, mx, my] of arms) {
        dctx.beginPath();
        dctx.moveTo(cx, cy);
        dctx.quadraticCurveTo(cx + mx, cy + my, cx + dx, cy + dy);
        dctx.stroke();
      }
    };
    crack(583, 540, [[-42, -18, -18, -14], [-30, 26, -10, 16], [38, -30, 12, -20], [46, 14, 22, 2], [-8, -38, -2, -22], [12, 36, 2, 20]]);
    dctx.strokeStyle = 'rgba(235,238,224,0.4)';
    dctx.lineWidth = 1.4;
    crack(583, 540, [[-64, -6, -30, -10], [58, -44, 30, -26], [64, 30, 30, 16]]);
    // phare avant casse
    dctx.fillStyle = 'rgba(20,20,22,0.85)';
    dctx.beginPath();
    dctx.ellipse(247, 618, 40, 16, -0.12, 0, Math.PI * 2);
    dctx.fill();
    for (let i = 0; i < 14; i++) {
      const a = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const b2 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      dctx.fillStyle = `rgba(235,238,224,${0.35 + Math.abs(a) * 0.4})`;
      dctx.fillRect(215 + Math.abs(a) * 66, 606 + Math.abs(b2) * 24, 2.2, 2.2);
    }
    // pli de capot
    dctx.strokeStyle = 'rgba(235,238,224,0.5)';
    dctx.lineWidth = 3;
    dctx.beginPath();
    dctx.moveTo(320, 585);
    dctx.quadraticCurveTo(390, 566, 470, 562);
    dctx.stroke();
    // enfoncements (ombre radiale + croissant de lumiere)
    const dent = (x, y, r, rot) => {
      const g = dctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.ellipse(x, y, r, r * 0.62, rot, 0, Math.PI * 2);
      dctx.fill();
      dctx.strokeStyle = 'rgba(226,229,215,0.32)';
      dctx.lineWidth = 1.6;
      dctx.beginPath();
      dctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.55, r * 0.3, rot - 0.4, Math.PI * 0.9, Math.PI * 1.9);
      dctx.stroke();
    };
    dent(705, 645, 54, 0.2);
    dent(872, 668, 42, -0.15);
    dent(1392, 622, 38, 0.3);
    // rayures laterales
    dctx.strokeStyle = 'rgba(226,229,215,0.45)';
    dctx.lineWidth = 1.6;
    for (const [x1, y1, x2, y2] of [[598, 662, 792, 648], [806, 676, 984, 664], [1030, 650, 1180, 640]]) {
      dctx.beginPath();
      dctx.moveTo(x1, y1);
      dctx.lineTo(x2, y2);
      dctx.stroke();
    }
    // salissures bas de caisse
    for (let i = 0; i < 26; i++) {
      const a = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1);
      const b2 = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
      dctx.fillStyle = `rgba(92,84,66,${0.10 + a * 0.14})`;
      dctx.beginPath();
      dctx.ellipse(430 + a * 780, 726 + b2 * 26, 26 + b2 * 30, 8 + a * 7, 0, 0, Math.PI * 2);
      dctx.fill();
    }
    // pneu avant a plat : assombrir + bourrelet au sol
    dctx.fillStyle = 'rgba(0,0,0,0.45)';
    dctx.beginPath();
    dctx.ellipse(415, 742, 96, 62, 0, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = 'rgba(12,12,14,0.5)';
    dctx.beginPath();
    dctx.ellipse(415, 790, 94, 11, 0, 0, Math.PI);
    dctx.fill();
    // clip par le masque flou
    dctx.globalCompositeOperation = 'destination-in';
    dctx.drawImage(damageMask, 0, 0);
    dctx.globalCompositeOperation = 'source-over';

    /* ---- 5. Exports jumeaux. -------------------------------------- */
    // wrecked = base nettoyee + degats
    const [wreck, wctx] = mk();
    wctx.drawImage(baseC, 0, 0);
    wctx.drawImage(dmg, 0, 0);
    // reveal = camion + decoupe voiture propre (transparent ailleurs)
    const [rev, rctx] = mk();
    rctx.drawImage(truckC, 0, 0);
    const [carCut, cctx] = mk();
    cctx.drawImage(baseC, 0, 0);
    cctx.globalCompositeOperation = 'destination-in';
    cctx.drawImage(cutMask, 0, 0);
    cctx.globalCompositeOperation = 'source-over';
    rctx.drawImage(carCut, 0, 0);

    /* ---- 6. QA : hors masques, wrecked === base au bit pres. ------ */
    const wd = wctx.getImageData(0, 0, W, H).data;
    const bd = bctx.getImageData(0, 0, W, H).data;
    const md = damageMask.getContext('2d').getImageData(0, 0, W, H).data;
    let checked = 0;
    let diff = 0;
    for (let i = 0; i < 40000; i++) {
      const x = Math.floor(Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * W);
      const y = Math.floor(Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1) * H);
      const p = (y * W + x) * 4;
      if (md[p + 3] > 0) continue; // dans le masque degats : ignorer
      checked++;
      if (wd[p] !== bd[p] || wd[p + 1] !== bd[p + 1] || wd[p + 2] !== bd[p + 2]) diff++;
    }
    return {
      wrecked: wreck.toDataURL('image/webp', 0.9),
      reveal: rev.toDataURL('image/webp', 0.9),
      qa: { checked, diff },
    };
  },
  { baseUrl, truckUrl },
);
await browser.close();

const save = (dataUrl, name) => {
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(`${OUT}/${name}`, buf);
  return buf.length;
};
const a = save(result.wrecked, 'hero-car-wrecked.webp');
const b = save(result.reveal, 'hero-car-restored-cutout.webp');
console.log(`wrecked: ${(a / 1024).toFixed(0)} ko | cutout: ${(b / 1024).toFixed(0)} ko`);
console.log(`QA hors masque: ${result.qa.checked} px echantillonnes, ${result.qa.diff} differents (attendu 0)`);
process.exit(result.qa.diff === 0 ? 0 : 1);
