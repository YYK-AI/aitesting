/* =========================================================================
   Pixel Cherokee — Great Smoky Mountains at golden hour in fall.
   Fine pixel art drawn on a small canvas and scaled up crisp.
   Static layers are painted once (per resize); water, fog, leaves,
   fireflies and stars animate on top.
   ========================================================================= */
const Pixel = (() => {
  const cv = document.getElementById("pix");
  const g = cv.getContext("2d");
  let W, H, raf = 0, last = 0, layers = {}, geo = {};

  /* ---------- helpers */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const hash2 = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u; };
  const fbm = (x, s) => noise(x, s) * 0.52 + noise(x * 2.1, s + 7) * 0.27 + noise(x * 4.3, s + 13) * 0.14 + noise(x * 9.1, s + 21) * 0.07;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function newBuf() { return new ImageData(W, H); }
  function put(b, x, y, c, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    b.data[i] = c[0]; b.data[i + 1] = c[1]; b.data[i + 2] = c[2]; b.data[i + 3] = a;
  }
  function toCanvas(b) { const c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").putImageData(b, 0, 0); return c; }
  function disc(b, cx, cy, r, c, shade) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r * 0.8) continue;
      let col = c;
      if (shade) { if (dx + dy < -r * 0.6) col = shade[0]; else if (dx + dy > r * 0.7) col = shade[1]; }
      put(b, cx + dx, cy + dy, col);
    }
  }
  function sprite(b, rows, pal, x0, y0, s) {
    rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      const c = pal[ch]; if (!c) return;
      for (let a = 0; a < s; a++) for (let d = 0; d < s; d++) put(b, x0 + rx * s + a, y0 + ry * s + d, c);
    }));
  }

  /* ---------- palette */
  const SKY = ["#141a40", "#1d2150", "#2b2860", "#40306f", "#5d3a7a", "#7f437f", "#a54d80", "#c95a7c", "#e46f72", "#f38b68", "#f9a86a", "#ffc679", "#ffdf98"].map(hex);
  const AUTUMN = ["#c4532d", "#e0822c", "#e9b23b", "#a23a2c", "#7a2f2a", "#d9662e", "#f0c94a", "#3e5a3a", "#2f4a33", "#6b7a34"].map(hex);
  const ROCK = ["#4e4652", "#5f5662", "#736a74", "#8a8088", "#a29698"].map(hex);
  const MOSS = ["#4a6236", "#5d7a3e"].map(hex);
  const MIST = hex("#f1dfe9");
  const LAYERS = [
    { b: 0.40, a: 0.12, f: 1.6, c1: "#b6a2cf", c2: "#d6b3cc", forest: 0 },
    { b: 0.46, a: 0.12, f: 2.0, c1: "#9886bf", c2: "#bc9dc3", forest: 0 },
    { b: 0.52, a: 0.11, f: 2.5, c1: "#7867a8", c2: "#9b83b4", forest: 0 },
    { b: 0.59, a: 0.10, f: 3.1, c1: "#5b4f8c", c2: "#7a6699", forest: 0.5 },
    { b: 0.66, a: 0.09, f: 3.9, c1: "#463d6c", c2: "#5a4a72", forest: 0.8 },
    { b: 0.73, a: 0.07, f: 5.0, c1: "#33304d", c2: "#3e3550", forest: 1 },
  ].map((L) => ({ ...L, c1: hex(L.c1), c2: hex(L.c2) }));

  /* ---------- elk sprites (facing left) */
  const BULL = [
    "..A.A..A..........",
    "...AA.A...........",
    "A..A.AA...........",
    ".A.AAA............",
    "..AAA.............",
    "...MM.............",
    "..MMMM............",
    "EMMMMM............",
    "..MMMMBBBBBBBBTT..",
    "...MMBBBBBBBBBTTT.",
    "....MBBBBBBBBBBTT.",
    "....MbbbbbbbbbbT..",
    ".....bbbbbbbbbb...",
    ".....L.L.....L.L..",
    ".....L.L.....L.L..",
    ".....L.L.....L.L..",
    "....LL.LL...LL.LL.",
  ];
  const COW = [
    "....BBBBBBBBTT..",
    "...BBBBBBBBBBTT.",
    "..MBBBBBBBBBBTT.",
    ".MMbbbbbbbbbbT..",
    "MM..bbbbbbbbb...",
    "M...L.L....L.L..",
    "E...L.L....L.L..",
    "....L.L....L.L..",
    "...LL.LL..LL.LL.",
  ];
  const ELK_PAL = { A: hex("#eadcb9"), M: hex("#3b2516"), B: hex("#8d5d33"), b: hex("#6c4526"), T: hex("#dcb97f"), L: hex("#2a1a0e"), E: hex("#120a05") };

  /* ---------- build static layers */
  function build() {
    const S = Math.min(W, H); // scene unit so shapes keep proportions in portrait & landscape
    seed = 7;
    geo.sun = { x: Math.round(W * 0.7), y: Math.round(H * 0.3), r: Math.max(5, Math.round(S * 0.075)) };
    geo.riverTop = (x) => Math.round(H * 0.8 + 2 * Math.sin(x / 17) + 2 * noise(x / 9, 3));
    geo.riverBot = (x) => Math.round(H * 0.875 + 2.5 * Math.sin(x / 23 + 2) + 1.5 * noise(x / 11, 5));
    geo.cliff = { x0: Math.round(W * 0.07), x1: Math.round(W * 0.23), top: Math.round(H * 0.47), bot: Math.round(H * 0.8) };
    geo.fall = { x: Math.round(W * 0.155), w: Math.max(3, Math.round(S * 0.035)) };
    geo.s = Math.max(1, Math.round(S / 190));

    /* sky + sun */
    let b = newBuf();
    const hz = H * 0.7, { x: sx, y: sy, r: sr } = geo.sun;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let f = Math.min(1, y / hz) * (SKY.length - 1);
      const d = Math.hypot(x - sx, (y - sy) * 1.1);
      const glow = Math.max(0, 1 - d / (sr * 4.5));
      f = Math.min(SKY.length - 1, f + glow * glow * 4);
      const i = Math.min(SKY.length - 1, Math.floor(f) + ((f % 1) > bayer(x, y) ? 1 : 0));
      put(b, x, y, SKY[i]);
    }
    disc(b, sx, sy, sr, hex("#fff3cc"));
    disc(b, sx, sy, sr - 1, hex("#fff8e0"));
    layers.sky = toCanvas(b);

    /* mountains: far (0-2) and mid (3-5) */
    const sunWarm = hex("#ffc39a");
    const paintLayers = (from, to) => {
      const buf = newBuf();
      for (let li = from; li <= to; li++) {
        const L = LAYERS[li], ys = [];
        for (let x = 0; x < W; x++) ys[x] = Math.round(H * L.b - H * L.a * (0.25 + 1.1 * fbm((x / S) * L.f + li * 3.3, li * 11)));
        for (let x = 0; x < W; x++) {
          const depth = H * L.a * 1.4;
          for (let y = ys[x]; y < H; y++) {
            const t = Math.min(1, (y - ys[x]) / depth);
            put(buf, x, y, t > bayer(x, y) * 0.9 + 0.1 ? L.c2 : L.c1);
          }
          // sun-facing slope rim light (sun is to the right)
          if (x < W - 1 && ys[x + 1] > ys[x]) { put(buf, x, ys[x], mix(L.c1, sunWarm, 0.45 - li * 0.05)); }
        }
        // autumn canopy
        if (L.forest > 0) {
          const step = li >= 4 ? 1 : 2;
          for (let x = 0; x < W; x += step) {
            // the nearest hill is forested all the way down to the river
            const reach = li === 5 ? Math.max(4, H * 0.81 - ys[x]) : H * L.a * (li === 3 ? 0.5 : 1.2);
            const n = li === 5 ? Math.ceil(reach / 2) : (li >= 4 ? 3 : 2);
            for (let k = 0; k < n; k++) {
              const yy = ys[x] + (li === 5 ? Math.floor((k / n) * reach + rnd() * 2) : Math.floor(Math.pow(rnd(), 1.6) * reach)) - (k === 0 ? 1 : 0);
              const r = li >= 5 ? 1 + (rnd() < 0.5 ? 1 : 0) : (li >= 4 ? 1 : (rnd() < 0.5 ? 1 : 0));
              const base = AUTUMN[Math.floor(rnd() * AUTUMN.length)];
              const col = mix(base, L.c1, 1 - L.forest * 0.85);
              disc(buf, x, yy, r, col, r > 0 ? [mix(col, hex("#ffe0a0"), 0.35), mix(col, hex("#1a1020"), 0.35)] : null);
            }
          }
        }
        geo["ridge" + li] = ys;
      }
      return buf;
    };
    layers.far = toCanvas(paintLayers(0, 2));
    const midBuf = paintLayers(3, 5);

    /* cliff + waterfall backing (part of mid) */
    const { x0, x1, top, bot } = geo.cliff;
    const topAt = (x) => top + Math.round(noise(x / 3, 45) * 5 + Math.abs(x - geo.fall.x) * 0.12);
    for (let y = top; y < bot + 2; y++) {
      const t = (y - top) / (bot - top);
      const xl = x0 + Math.round(3 * noise(y / 5, 41)) - Math.round(t * 2);
      const xr = x1 + Math.round(5 * noise(y / 6, 43)) + Math.round(t * W * 0.03);
      for (let x = xl; x < xr; x++) {
        if (y < topAt(x)) continue;
        const strata = Math.floor(y / 3 + noise(x / 7, 47) * 2) % 4 === 0;
        let ci = Math.floor(hash2(x >> 1, y, 3) * 3 + noise(x / 5 + y / 9, 49) * 2);
        if (strata) ci = Math.max(0, ci - 2);
        let col = ROCK[Math.min(ROCK.length - 1, ci)];
        if (hash2(x, y, 9) > 0.86 && noise(x / 6, y) > 0.4) col = MOSS[hash2(x, y, 4) > 0.5 ? 1 : 0];
        if (x > xr - 3) col = mix(col, sunWarm, 0.25); // lit edge
        put(midBuf, x, y, col);
      }
    }
    // fall foliage hugging the cliff: along the rim, down both sides and at its foot
    const leaf = (x, y, r, k) => { const c = AUTUMN[Math.floor(hash(k, 8) * AUTUMN.length)]; disc(midBuf, x, y, r, c, [mix(c, hex("#ffe0a0"), 0.35), mix(c, hex("#1a1020"), 0.35)]); };
    for (let x = x0 - 3; x < x1 + 8; x += 2) if (Math.abs(x - geo.fall.x) > geo.fall.w + 1) leaf(x, topAt(x) - 1, 1 + (hash(x, 5) > 0.4 ? 1 : 0), x);
    for (let y = top; y < bot; y += 2) {
      const t = (y - top) / (bot - top);
      leaf(x0 - 1 + Math.round(noise(y / 4, 52) * 3), y, 1 + (hash(y, 6) > 0.5 ? 1 : 0), y + 100);
      leaf(x1 + Math.round(t * W * 0.03) + 2 + Math.round(noise(y / 4, 53) * 3), y, 1 + (hash(y, 7) > 0.4 ? 1 : 0), y + 200);
      if (hash(y, 9) > 0.6) leaf(x0 + Math.round(hash(y, 10) * (x1 - x0)), y, 1, y + 300);
    }
    for (let x = x0 - 4; x < x1 + 10; x += 2) if (Math.abs(x - geo.fall.x) > geo.fall.w + 2) leaf(x, bot - 1 - Math.round(hash(x, 11) * 3), 1 + (hash(x, 12) > 0.5 ? 1 : 0), x + 400);
    // wet dark rock behind the fall
    const { x: fx, w: fw } = geo.fall;
    for (let y = top + 3; y < bot; y++) for (let x = fx - fw; x <= fx + fw; x++) put(midBuf, x, y, hex("#2f2a36"));
    layers.mid = toCanvas(midBuf);

    /* river base */
    b = newBuf();
    const WATER = ["#27305c", "#334079", "#425093", "#5664a6", "#6d76b4"].map(hex);
    for (let x = 0; x < W; x++) {
      const t0 = geo.riverTop(x), t1 = geo.riverBot(x);
      for (let y = t0; y <= t1; y++) {
        const f = ((y - t0) / Math.max(1, t1 - t0)) * 3 + 1 - Math.max(0, 1 - Math.abs(x - sx) / (sr * 3)) * 1.2;
        const i = Math.max(0, Math.min(WATER.length - 1, Math.floor(f) + ((f % 1) > bayer(x, y) ? 1 : 0)));
        put(b, x, y, WATER[WATER.length - 1 - i]);
      }
      put(b, x, t0, hex("#1d1a28")); // wet bank line
    }
    layers.river = toCanvas(b);

    /* foreground: meadow, rocks, elk, chips, pines */
    b = newBuf();
    const GRASS = ["#2c361e", "#3d4825", "#55582a", "#6f6a30", "#8c7a36", "#a88f45"].map(hex);
    for (let x = 0; x < W; x++) {
      const y0 = geo.riverBot(x) + 1;
      for (let y = y0; y < H; y++) {
        const t = (y - y0) / Math.max(1, H - y0);
        let f = 4.2 - t * 3.6 + (noise(x / 8, 61) - 0.5) * 1.8;
        const i = Math.max(0, Math.min(GRASS.length - 1, Math.floor(f) + ((f % 1) > bayer(x, y) ? 1 : 0)));
        put(b, x, y, GRASS[i]);
      }
      put(b, x, y0, hex("#6b5a3c"));
      // grass blades
      if (hash(x, 71) > 0.55) { const yb = y0 + 2 + Math.floor(hash(x, 72) * (H - y0 - 3)); put(b, x, yb, GRASS[5]); put(b, x, yb - 1, GRASS[4]); }
      // wildflowers
      if (hash(x, 73) > 0.93) put(b, x, y0 + 2 + Math.floor(hash(x, 74) * (H - y0 - 4)), hash(x, 75) > 0.5 ? hex("#e7d4ff") : hex("#ffd27a"));
    }
    // river rocks
    const rocks = [[0.36, 0.84], [0.52, 0.83], [0.83, 0.85]];
    rocks.forEach(([fx2, fy], k) => {
      const rx = Math.round(W * fx2), ry = Math.round(H * fy), rr = Math.max(2, Math.round(S * 0.016));
      for (let dy = -rr; dy <= 0; dy++) for (let dx = -rr * 2; dx <= rr * 2; dx++)
        if ((dx * dx) / 4 + dy * dy <= rr * rr) put(b, rx + dx, ry + dy, dy < -rr * 0.5 && dx > 0 ? ROCK[4] : ROCK[2 - (k % 2)]);
    });
    // poker chip stack on the bank (a little nod to Cherokee's casino)
    const cx = Math.round(W * 0.47), cy = geo.riverBot(Math.round(W * 0.47)) + Math.max(4, Math.round(S * 0.03));
    geo.chips = { x: cx, y: cy };
    const flatRock = Math.max(5, Math.round(S * 0.035));
    for (let dx = -flatRock; dx <= flatRock; dx++) { put(b, cx + dx, cy + 1, ROCK[3]); put(b, cx + dx, cy + 2, ROCK[1]); }
    const chipCols = ["#d62839", "#1d4ed8", "#0f8a4b", "#d62839", "#111111"].map(hex);
    const cw = Math.max(3, Math.round(S * 0.02));
    chipCols.forEach((c, k) => {
      const yy = cy - k * 2, xo = (k % 2) ? 1 : 0;
      for (let dx = -cw; dx <= cw; dx++) {
        put(b, cx + dx + xo, yy, (dx + cw) % 3 === 0 ? hex("#ffffff") : c);
        put(b, cx + dx + xo, yy - 1, mix(c, hex("#ffffff"), 0.25));
      }
    });
    // elk grazing in the meadow
    const s = geo.s;
    sprite(b, BULL, ELK_PAL, Math.round(W * 0.6), Math.round(H * 0.955) - BULL.length * s, s);
    sprite(b, COW, ELK_PAL, Math.round(W * 0.74), Math.round(H * 0.975) - COW.length * s, s);
    // framing pines
    const pine = (px, baseY, h, w) => {
      const tiers = 5;
      for (let k = 0; k < h; k++) {
        const tier = Math.floor((k / h) * tiers), inTier = ((k / h) * tiers) % 1;
        const rw = Math.round(w * (0.25 + 0.75 * (tier + 1) / tiers) * (0.45 + 0.55 * inTier));
        for (let dx = -rw; dx <= rw; dx++) put(b, px + dx, baseY - h + k, dx > rw * 0.4 ? hex("#203a2b") : hex("#132419"));
      }
      for (let k = 0; k < Math.max(2, h * 0.08); k++) put(b, px, baseY + k - 1, hex("#2a1a10"));
    };
    pine(Math.round(W * 0.015), H, Math.round(H * 0.5), Math.max(5, Math.round(S * 0.07)));
    pine(Math.round(W * 0.065), H, Math.round(H * 0.32), Math.max(4, Math.round(S * 0.05)));
    pine(Math.round(W * 0.985), H, Math.round(H * 0.55), Math.max(5, Math.round(S * 0.075)));
    pine(Math.round(W * 0.93), H, Math.round(H * 0.3), Math.max(4, Math.round(S * 0.05)));
    layers.fore = toCanvas(b);

    /* moving things */
    seed = 99;
    geo.stars = Array.from({ length: 60 }, () => ({ x: rnd() * W | 0, y: rnd() * H * 0.28 | 0, p: rnd() * 6, s: 0.5 + rnd() * 2 }));
    geo.clouds = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * W, y: H * (0.06 + rnd() * 0.24), w: S * (0.12 + rnd() * 0.22), v: 0.4 + rnd() * 0.8 }));
    geo.birds = Array.from({ length: 3 }, (_, i) => ({ x: rnd() * W, y: H * (0.18 + rnd() * 0.12), v: 3 + rnd() * 2, p: rnd() * 6 }));
    geo.leaves = Array.from({ length: 34 }, () => ({ x: rnd() * W, y: rnd() * H, v: 0.6 + rnd(), p: rnd() * 6, c: AUTUMN[Math.floor(rnd() * 7)] }));
    geo.flies = Array.from({ length: 26 }, () => ({ x: rnd() * W, y: H * (0.84 + rnd() * 0.15), vx: rnd() - 0.5, vy: rnd() - 0.5, p: rnd() * 6 }));
  }

  /* ---------- animated drawing */
  function mist(t, y0, bh, speed, alpha, s) {
    for (let x = 0; x < W; x++) {
      const n = noise((x + t * speed) / 26, s) * 0.7 + noise((x - t * speed * 0.6) / 9, s + 3) * 0.3;
      const h = Math.round(bh * (0.2 + n));
      g.fillStyle = css(MIST, alpha);
      g.fillRect(x, y0 - (h >> 1), 1, h);
      g.fillStyle = css(MIST, alpha * 0.8);
      g.fillRect(x, y0 - (h >> 2), 1, h >> 1);
    }
  }

  function draw(t) {
    g.clearRect(0, 0, W, H);
    g.drawImage(layers.sky, 0, 0);
    // stars
    for (const s of geo.stars) {
      const a = (Math.sin(t / 500 * s.s + s.p) + 1) / 2;
      if (a > 0.35) { g.fillStyle = `rgba(255,246,220,${a * 0.9})`; g.fillRect(s.x, s.y, 1, 1); }
    }
    // clouds lit by the sunset
    for (const c of geo.clouds) {
      const x = ((c.x + t / 1000 * c.v * 2) % (W + c.w * 2)) - c.w;
      const y = Math.round(c.y), w = Math.round(c.w);
      g.fillStyle = "#c06f8f"; g.fillRect(x | 0, y, w, 2);
      g.fillStyle = "#f2a59c"; g.fillRect((x + w * 0.12) | 0, y - 1, (w * 0.7) | 0, 1);
      g.fillStyle = "#ffd2ae"; g.fillRect((x + w * 0.3) | 0, y - 2, (w * 0.32) | 0, 1);
      g.fillStyle = "#8f557d"; g.fillRect((x + w * 0.1) | 0, y + 2, (w * 0.8) | 0, 1);
    }
    // birds
    g.fillStyle = "#2a1d35";
    for (const bd of geo.birds) {
      const x = Math.round((bd.x + t / 1000 * bd.v) % (W + 10)) - 5, y = Math.round(bd.y + Math.sin(t / 900 + bd.p) * 2);
      const up = Math.sin(t / 120 + bd.p) > 0;
      g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y - (up ? 1 : 0), 1, 1); g.fillRect(x + 1, y - (up ? 1 : 0), 1, 1);
    }
    g.drawImage(layers.far, 0, 0);
    mist(t / 40, Math.round(H * 0.5), Math.max(4, H * 0.06), 1, 0.22, 11);
    g.drawImage(layers.mid, 0, 0);
    mist(t / 30, Math.round(H * 0.74), Math.max(3, H * 0.045), 1.4, 0.2, 17);

    // waterfall (Mingo Falls style cascade)
    const { x: fx, w: fw } = geo.fall, { top, bot } = geo.cliff;
    const FALL = ["#ffffff", "#e6f6ff", "#c9e7f7", "#a8d3ec", "#e6f6ff", "#8dbfe0"];
    for (let y = top + 2; y < bot; y++) {
      const wobble = Math.round(Math.sin(y / 4) * 0.6);
      const fan = Math.round(Math.max(0, (y - top) / (bot - top) - 0.55) * fw * 2.2);
      for (let x = fx - fw + 1 - fan; x <= fx + fw - 1 + fan; x++) {
        const k = Math.floor((y - t / 28 + hash(x, 2) * 9)) % FALL.length;
        g.fillStyle = FALL[(k + FALL.length) % FALL.length];
        g.fillRect(x + wobble, y, 1, 1);
      }
      // ledge splashes
      if (y === Math.round(top + (bot - top) * 0.38) || y === Math.round(top + (bot - top) * 0.7)) {
        for (let x = fx - fw - 2; x <= fx + fw + 2; x++) if (hash2(x, Math.floor(t / 90)) > 0.35) { g.fillStyle = "#ffffff"; g.fillRect(x, y + (hash2(x, t / 70 | 0) > 0.6 ? -1 : 0), 1, 1); }
      }
    }
    g.drawImage(layers.river, 0, 0);
    // plunge pool foam + spray
    for (let k = 0; k < 40; k++) {
      const a = hash(k, Math.floor(t / 80)), r = hash(k + 50, Math.floor(t / 80));
      const x = fx + Math.round((a - 0.5) * fw * 5), y = bot + Math.round((r - 0.6) * 4);
      g.fillStyle = k % 3 ? "rgba(255,255,255,.9)" : "rgba(220,240,255,.7)"; g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "rgba(240,248,255,.18)"; g.fillRect(fx - fw * 3, bot - 5, fw * 6, 6);
    // river ripples flowing right + sun glints
    for (let k = 0; k < W / 2.5; k++) {
      const x = Math.floor((k * 53.3 + t / 45 * (1 + (k % 3) * 0.5)) % W);
      const t0 = geo.riverTop(x), t1 = geo.riverBot(x);
      const y = t0 + 1 + (k * 7) % Math.max(1, t1 - t0 - 1);
      const nearSun = Math.abs(x - geo.sun.x) < geo.sun.r * 2.5;
      g.fillStyle = nearSun ? (k % 2 ? "#ffd38a" : "#fff0c0") : (k % 4 ? "rgba(190,200,240,.55)" : "rgba(255,220,200,.7)");
      g.fillRect(x, y, 2 + (k % 3), 1);
    }
    g.drawImage(layers.fore, 0, 0);
    // chip glint
    const gl = (t / 2600) % 1;
    if (gl < 0.12) {
      const { x, y } = geo.chips, a = 1 - Math.abs(gl - 0.06) / 0.06;
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillRect(x + 1, y - 10, 1, 5); g.fillRect(x - 1, y - 8, 5, 1);
    }
    // falling leaves
    for (const l of geo.leaves) {
      l.y += l.v * 0.35; l.x += 0.25 + Math.sin(t / 600 + l.p) * 0.35;
      if (l.y > H) { l.y = -2; l.x = Math.random() * W; }
      if (l.x > W) l.x = 0;
      g.fillStyle = css(l.c); g.fillRect(l.x | 0, l.y | 0, 1 + (Math.sin(t / 200 + l.p) > 0 ? 1 : 0), 1);
    }
    // fireflies over the meadow
    for (const f of geo.flies) {
      f.x += f.vx * 0.12; f.y += f.vy * 0.08;
      if (Math.random() < 0.02) { f.vx = Math.random() - 0.5; f.vy = Math.random() - 0.5; }
      if (f.x < 0) f.x = W; if (f.x > W) f.x = 0;
      if (f.y < H * 0.82 || f.y > H) f.vy *= -1;
      const a = Math.max(0, Math.sin(t / 300 + f.p));
      if (a > 0.1) { g.fillStyle = `rgba(235,255,140,${a})`; g.fillRect(f.x | 0, f.y | 0, 1, 1); }
    }
  }

  function resize() {
    const P = Math.max(2, Math.round(Math.max(innerWidth, innerHeight) / 420));
    W = Math.ceil(innerWidth / P); H = Math.ceil(innerHeight / P);
    cv.width = W; cv.height = H;
    build();
    draw(performance.now());
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return;
    last = t; draw(t);
  }
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();
  return { start() { if (!raf) raf = requestAnimationFrame(loop); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
})();
Pixel.start();
