/* =========================================================================
   Cherokee, NC — a smooth illustrated scene of the Great Smoky Mountains:
   misty blue ridges, green forest, Mingo Falls, the Oconaluftee River,
   elk in the meadow, rhododendron. Static layers are painted once per
   resize; water, birds, fog, leaves and fireflies animate.
   Scene.night (0..1) fades it to dusk for the finale.
   ========================================================================= */
const Scene = (() => {
  const $c = (id) => document.getElementById(id);
  const cvs = { sky: $c("sky"), far: $c("far"), mid: $c("mid"), fx: $c("fx"), fore: $c("fore"), fx2: $c("fx2") };
  const ctx = {};
  for (const k in cvs) ctx[k] = cvs[k].getContext("2d");
  let W, H, S, DPR, raf = 0, last = 0;
  const geo = {};
  const state = { night: 0, photo: false };

  /* ---------- helpers */
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u; };
  const fbm = (x, s) => noise(x, s) * 0.55 + noise(x * 2.1, s + 7) * 0.27 + noise(x * 4.4, s + 13) * 0.13 + noise(x * 9, s + 21) * 0.05;
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lerp = (a, b, t) => a + (b - a) * t;

  function smoothPath(c, pts, closeToBottom = true) {
    c.beginPath();
    c.moveTo(-10, H + 10);
    c.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const lp = pts[pts.length - 1];
    c.lineTo(lp[0], lp[1]);
    if (closeToBottom) c.lineTo(W + 10, H + 10);
    c.closePath();
  }
  function ridgePoints(base, amp, freq, s) {
    const pts = [], step = Math.max(8, W / 48);
    for (let x = -step; x <= W + step; x += step) pts.push([x, H * base - amp * (0.2 + 1.1 * fbm((x / S) * freq + s * 3.1, s))]);
    return pts;
  }
  const ridgeY = (pts, x) => {
    for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i][0] && x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
    return pts[pts.length - 1][1];
  };

  function tree(c, x, y, h, dark, light, conifer) {
    if (conifer) {
      const w = h * 0.42;
      c.fillStyle = dark;
      c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x - w, y); c.lineTo(x, y); c.closePath(); c.fill();
      c.fillStyle = light;
      c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x + w * 0.4, y - h * 0.4, x + w, y); c.lineTo(x, y); c.closePath(); c.fill();
    } else {
      const r = h * 0.38;
      c.fillStyle = dark; c.beginPath(); c.arc(x, y - r, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = light; c.beginPath(); c.arc(x + r * 0.25, y - r * 1.15, r * 0.7, 0, Math.PI * 2); c.fill();
    }
  }

  // elk silhouette (facing left), drawn in a 100 x 80 box
  const ELK_BODY = new Path2D("M8 23 C6 19 10 15 16 14 L22 11 L27 14 C31 20 34 25 38 29 C50 26 70 27 82 31 C88 33 91 40 88 47 L86 56 L84 78 L80.5 78 L80 59 L76 58 L75.5 78 L72 78 L71 56 C60 58 50 58 44 56 L43 78 L39.5 78 L39 59 L36 58 L35.5 78 L32 78 L32 54 C30 46 28 40 24 33 C20 29 14 27 10 27 Z");
  const ELK_MANE = new Path2D("M22 12 L27 14 C31 20 34 25 38 29 C40 36 38 44 34 52 C30 46 28 40 24 33 C21 29 18 26 16 24 Z");
  const ELK_RUMP = new Path2D("M80 33 C87 34 90 40 88 47 C84 46 80 41 80 33 Z");
  const ANTLER = new Path2D("M21 12 C24 1 31 -7 42 -11 M25 4 C21 -1 19 -5 19 -9 M29 -1 C27 -6 27 -11 28 -15 M34 -6 C34 -11 36 -15 38 -18 M19 12 C17 2 20 -6 29 -13 M20 2 C16 -2 14 -6 14 -10");
  const COW_BODY = new Path2D("M28 30 C42 26 66 27 80 31 C87 33 90 40 87 47 L85 56 L83 78 L79.5 78 L79 59 L75 58 L74.5 78 L71 78 L70 56 C60 58 50 58 44 56 L43 78 L39.5 78 L39 59 L36 58 L35.5 78 L32 78 L32 54 C28 52 24 56 20 64 C18 68 14 72 10 74 C7 72 8 68 12 64 C16 58 20 50 22 42 C23 36 25 32 28 30 Z");
  function elk(c, x, y, s, bull) {
    c.save(); c.translate(x, y - 78 * s); c.scale(s, s);
    c.fillStyle = "rgba(20,35,25,.25)"; c.beginPath(); c.ellipse(60, 79, 34, 3, 0, 0, Math.PI * 2); c.fill();
    const body = c.createLinearGradient(0, 10, 0, 78);
    body.addColorStop(0, "#8a6440"); body.addColorStop(1, "#5c3f24");
    c.fillStyle = body; c.fill(bull ? ELK_BODY : COW_BODY);
    c.fillStyle = "#e3cfa6"; c.fill(ELK_RUMP);
    if (bull) {
      c.fillStyle = "#3f2a18"; c.fill(ELK_MANE);
      c.strokeStyle = "#efe3c6"; c.lineWidth = 2.4; c.lineCap = "round"; c.stroke(ANTLER);
    }
    c.restore();
  }
  function chipStack(c, x, y, s) {
    const cols = ["#13294b", "#7bafd4", "#ffffff", "#7bafd4"];
    cols.forEach((col, k) => {
      const yy = y - k * 3.2 * s, xo = (k % 2 ? 1.2 : -0.6) * s;
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(x + xo, yy + 1.5 * s, 9 * s, 3.2 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; c.beginPath(); c.ellipse(x + xo, yy, 9 * s, 3.2 * s, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col === "#ffffff" ? "#7bafd4" : "rgba(255,255,255,.85)"; c.lineWidth = 1.1 * s;
      c.setLineDash([2.2 * s, 2.6 * s]); c.beginPath(); c.ellipse(x + xo, yy, 6 * s, 2 * s, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    });
  }
  function rock(c, x, y, w, h) {
    const g = c.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, "#a9b4bd"); g.addColorStop(1, "#5e6a74");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, w, h, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(x + w * 0.2, y - h * 0.7, w * 0.4, h * 0.2, 0, 0, Math.PI * 2); c.fill();
  }

  /* ---------- static paint */
  function paint() {
    seed = 11;
    const u = S / 400;
    geo.u = u;

    /* sky */
    let c = ctx.sky;
    let g = c.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, "#5f98c6"); g.addColorStop(0.45, "#86b6da"); g.addColorStop(1, "#d9ebf6");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sx = W * 0.78, sy = H * 0.14;
    g = c.createRadialGradient(sx, sy, 0, sx, sy, S * 0.55);
    g.addColorStop(0, "rgba(255,250,232,.95)"); g.addColorStop(0.08, "rgba(255,247,224,.8)"); g.addColorStop(0.3, "rgba(255,245,225,.22)"); g.addColorStop(1, "rgba(255,245,225,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    /* far ridges — blue haze of the Smokies */
    c = ctx.far;
    const far = [
      { b: 0.37, a: 0.13, f: 1.5, top: "#a9c4dc", bot: "#cfe1ee" },
      { b: 0.42, a: 0.13, f: 1.9, top: "#8eb0cd", bot: "#bcd4e6" },
      { b: 0.47, a: 0.12, f: 2.4, top: "#7499ba", bot: "#a9c5dc" },
    ];
    far.forEach((L, i) => {
      const pts = ridgePoints(L.b, S * L.a, L.f, i + 1);
      g = c.createLinearGradient(0, H * (L.b - L.a * 1.2), 0, H * (L.b + 0.08));
      g.addColorStop(0, L.top); g.addColorStop(1, L.bot);
      c.fillStyle = g; smoothPath(c, pts); c.fill();
      // soft sunlit rim
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1.2; c.beginPath();
      pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    });

    /* mid ridges — blue-green to deep forest green, covered in trees */
    c = ctx.mid;
    const mid = [
      { b: 0.53, a: 0.11, f: 2.8, top: "#5d8c8f", bot: "#86aeb0", dark: "#4f7f7c", light: "#6a9a92", trees: 0.6 },
      { b: 0.6, a: 0.1, f: 3.4, top: "#3f7559", bot: "#5f8f70", dark: "#31654b", light: "#4c8461", trees: 1 },
    ];
    mid.forEach((L, i) => {
      const pts = ridgePoints(L.b, S * L.a, L.f, i + 7);
      g = c.createLinearGradient(0, H * (L.b - L.a), 0, H * (L.b + 0.1));
      g.addColorStop(0, L.top); g.addColorStop(1, L.bot);
      c.fillStyle = g; smoothPath(c, pts); c.fill();
      const rows = i === 1 ? 4 : 2;
      for (let r = 0; r < rows; r++) {
        for (let x = -6; x < W + 6; x += (5 + rnd() * 6) * u) {
          const y = ridgeY(pts, x) + r * 7 * u + rnd() * 5 * u + 3;
          const h = (i === 1 ? 14 : 9) * u * (0.7 + rnd() * 0.6) * (1 - r * 0.08);
          const tint = rnd();
          const dark = tint > 0.85 ? "#5a7d3c" : L.dark, light = tint > 0.85 ? "#86a94e" : L.light;
          tree(c, x, y, h, dark, light, rnd() < 0.55);
        }
      }
      geo["mid" + i] = pts;
    });

    /* Mingo Falls: rock face framed by forest */
    const cw = Math.min(W * 0.36, S * 0.34), x0 = W * 0.06, top = H * 0.5, bot = H * 0.7;
    geo.cliff = { x0, x1: x0 + cw, top, bot };
    geo.fall = { x: x0 + cw * 0.52, w: Math.max(5, S * 0.03) };
    c.save();
    c.beginPath();
    c.moveTo(x0, bot); c.bezierCurveTo(x0 - 6 * u, top + (bot - top) * 0.5, x0 + cw * 0.08, top + 10 * u, x0 + cw * 0.25, top + 4 * u);
    c.quadraticCurveTo(x0 + cw * 0.5, top - 6 * u, x0 + cw * 0.78, top + 5 * u);
    c.bezierCurveTo(x0 + cw * 0.95, top + 14 * u, x0 + cw * 1.05, top + (bot - top) * 0.6, x0 + cw * 1.1, bot);
    c.closePath();
    g = c.createLinearGradient(x0, 0, x0 + cw, 0);
    g.addColorStop(0, "#56626e"); g.addColorStop(0.45, "#7d8a95"); g.addColorStop(1, "#4a5560");
    c.fillStyle = g; c.fill();
    c.clip();
    // rock strata + moss
    for (let k = 0; k < 26; k++) {
      const yy = top + rnd() * (bot - top), xx = x0 + rnd() * cw;
      c.fillStyle = rnd() > 0.5 ? "rgba(30,40,50,.25)" : "rgba(255,255,255,.12)";
      c.beginPath(); c.ellipse(xx, yy, (10 + rnd() * 26) * u, (1.5 + rnd() * 2) * u, 0, 0, Math.PI * 2); c.fill();
    }
    for (let k = 0; k < 30; k++) {
      c.fillStyle = rnd() > 0.5 ? "rgba(82,130,70,.55)" : "rgba(110,155,80,.45)";
      c.beginPath(); c.ellipse(x0 + rnd() * cw, top + rnd() * (bot - top), (3 + rnd() * 7) * u, (2 + rnd() * 3) * u, 0, 0, Math.PI * 2); c.fill();
    }
    // dark wet channel behind the falling water
    g = c.createLinearGradient(geo.fall.x - geo.fall.w * 2, 0, geo.fall.x + geo.fall.w * 2, 0);
    g.addColorStop(0, "rgba(30,38,48,0)"); g.addColorStop(0.5, "rgba(30,38,48,.7)"); g.addColorStop(1, "rgba(30,38,48,0)");
    c.fillStyle = g; c.fillRect(geo.fall.x - geo.fall.w * 2, top, geo.fall.w * 4, bot - top);
    c.restore();
    // lush trees hugging the gorge
    for (let k = 0; k < 60; k++) {
      const side = k % 3;
      let x, y;
      if (side === 0) { x = x0 + rnd() * cw; y = top + rnd() * 10 * u; if (Math.abs(x - geo.fall.x) < geo.fall.w * 1.6) continue; }
      else if (side === 1) { x = x0 - 6 * u + rnd() * 14 * u; y = top + rnd() * (bot - top); }
      else { x = x0 + cw * (0.98 + rnd() * 0.14); y = top + rnd() * (bot - top); }
      tree(c, x, y, (10 + rnd() * 10) * u, rnd() > 0.8 ? "#5b7f3c" : "#2f6347", rnd() > 0.8 ? "#87ad55" : "#4a8a5f", rnd() < 0.5);
    }

    /* foreground: meadow, river, rocks, elk, rhododendron */
    c = ctx.fore;
    const landTop = H * 0.665;
    c.beginPath(); c.moveTo(-10, H + 10); c.lineTo(-10, landTop + 6 * u);
    for (let x = 0; x <= W + 10; x += 12) c.lineTo(x, landTop + Math.sin(x / (40 * u)) * 3 * u + noise(x / 50, 3) * 6 * u);
    c.lineTo(W + 10, H + 10); c.closePath();
    g = c.createLinearGradient(0, landTop, 0, H);
    g.addColorStop(0, "#7aa860"); g.addColorStop(0.4, "#5b8f4a"); g.addColorStop(1, "#33622f");
    c.fillStyle = g; c.fill();

    // the Oconaluftee: winds from the falls' pool toward the viewer
    const fx = geo.fall.x;
    const ctr = [[fx, bot + 2 * u], [fx + W * 0.16, H * 0.73], [W * 0.62, H * 0.77], [W * 0.5, H * 0.86], [W * 0.66, H * 1.05]];
    const widths = [S * 0.07, S * 0.1, S * 0.15, S * 0.26, S * 0.5];
    const cat = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    const L = [], R = [], center = [];
    for (let i = 0; i < ctr.length - 1; i++) {
      for (let t = 0; t < 1; t += 0.05) {
        const p0 = ctr[Math.max(0, i - 1)], p1 = ctr[i], p2 = ctr[i + 1], p3 = ctr[Math.min(ctr.length - 1, i + 2)];
        const x = cat(p0[0], p1[0], p2[0], p3[0], t), y = cat(p0[1], p1[1], p2[1], p3[1], t);
        const w = lerp(widths[i], widths[i + 1], t) / 2;
        center.push([x, y, w]);
      }
    }
    center.forEach((p, i) => {
      const q = center[Math.min(center.length - 1, i + 1)], o = center[Math.max(0, i - 1)];
      let dx = q[0] - o[0], dy = q[1] - o[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      L.push([p[0] - dy * -p[2] * -1 - dy * 0, p[1]]); // placeholder, replaced below
      L[i] = [p[0] + dy * p[2], p[1] - dx * p[2]];
      R.push([p[0] - dy * p[2], p[1] + dx * p[2]]);
    });
    geo.river = { center, L, R };
    // grassy bank shadow
    c.fillStyle = "rgba(40,70,40,.45)";
    c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0] - 3 * u, p[1] + 2 * u) : c.moveTo(p[0] - 3 * u, p[1] + 2 * u)));
    R.slice().reverse().forEach((p) => c.lineTo(p[0] + 3 * u, p[1] + 2 * u)); c.closePath(); c.fill();
    // water
    c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    R.slice().reverse().forEach((p) => c.lineTo(p[0], p[1])); c.closePath();
    g = c.createLinearGradient(0, bot, 0, H);
    g.addColorStop(0, "#b8d9ee"); g.addColorStop(0.35, "#7fb3d8"); g.addColorStop(1, "#4b86b4");
    c.fillStyle = g; c.fill();
    // plunge pool foam
    g = c.createRadialGradient(fx, bot + 3 * u, 0, fx, bot + 3 * u, S * 0.08);
    g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.beginPath(); c.ellipse(fx, bot + 3 * u, S * 0.08, S * 0.03, 0, 0, Math.PI * 2); c.fill();
    // river stones along the banks
    for (let i = 4; i < center.length; i += 3) {
      const p = rnd() > 0.5 ? L[i] : R[i], k = i / center.length;
      rock(c, p[0] + (rnd() - 0.5) * 6 * u, p[1] + 2 * u, (4 + k * 10) * u * (0.6 + rnd() * 0.6), (2.5 + k * 6) * u);
    }
    // grass strokes & wildflowers on the meadow (skipping the river)
    const inRiver = (x, y) => {
      for (let i = 0; i < center.length; i++) { const p = center[i]; if (Math.abs(p[1] - y) < 6 * u && Math.abs(p[0] - x) < p[2] + 4 * u) return true; }
      return false;
    };
    for (let k = 0; k < 900; k++) {
      const x = rnd() * W, y = landTop + 8 * u + Math.pow(rnd(), 0.8) * (H - landTop);
      if (inRiver(x, y)) continue;
      const dep = (y - landTop) / (H - landTop), h = (2 + dep * 7) * u;
      c.strokeStyle = rnd() > 0.5 ? "rgba(140,185,100,.55)" : "rgba(40,80,40,.4)";
      c.lineWidth = 0.8 + dep; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 1.5 * u, y - h * 0.6, x + (rnd() - 0.3) * 3 * u, y - h); c.stroke();
    }
    for (let k = 0; k < 140; k++) {
      const x = rnd() * W, y = landTop + 14 * u + rnd() * (H - landTop);
      if (inRiver(x, y)) continue;
      const dep = (y - landTop) / (H - landTop);
      c.fillStyle = ["#ffffff", "#f7e27a", "#e9b7d8", "#c9b3f0"][Math.floor(rnd() * 4)];
      c.beginPath(); c.arc(x, y, (0.8 + dep * 2.2) * u, 0, Math.PI * 2); c.fill();
    }
    // elk by the river (Cherokee's Oconaluftee herd)
    elk(c, W * 0.19, H * 0.83, 0.8 * u, true);
    elk(c, W * 0.74, H * 0.745, 0.42 * u, false);
    // poker chips on a flat river rock — a little nod to Cherokee
    const ci = Math.floor(center.length * 0.86), cp = L[ci];
    rock(c, cp[0] - 16 * u, cp[1] + 6 * u, 16 * u, 6 * u);
    chipStack(c, cp[0] - 16 * u, cp[1] + 1 * u, 0.9 * u);
    geo.chips = { x: cp[0] - 16 * u, y: cp[1] - 12 * u };
    // framing: tall hemlock left, rhododendron right, ferns
    const hem = (x, baseY, h) => {
      for (let k = 0; k < 7; k++) {
        const t = k / 7, w = h * (0.1 + t * 0.26), y = baseY - h + t * h * 0.95;
        c.fillStyle = k % 2 ? "#1d4a35" : "#245a40";
        c.beginPath(); c.moveTo(x, y - h * 0.16); c.quadraticCurveTo(x - w * 0.6, y, x - w, y + h * 0.1); c.lineTo(x + w, y + h * 0.1); c.quadraticCurveTo(x + w * 0.6, y, x, y - h * 0.16); c.fill();
      }
      c.fillStyle = "#3b2a1e"; c.fillRect(x - 3 * u, baseY - h * 0.05, 6 * u, h * 0.1);
    };
    hem(W * 0.02, H * 1.02, H * 0.55);
    hem(W * 0.98, H * 1.02, H * 0.42);
    const rhodo = (x, y, r) => {
      for (let k = 0; k < 9; k++) {
        const a = rnd() * Math.PI, rr = r * (0.4 + rnd() * 0.5);
        const bx = x + Math.cos(a) * r * 0.8, by = y - Math.sin(a) * r * 0.6;
        c.fillStyle = rnd() > 0.5 ? "#2c5e3a" : "#3a7347";
        c.beginPath(); c.ellipse(bx, by, rr, rr * 0.7, 0, 0, Math.PI * 2); c.fill();
      }
      for (let k = 0; k < 14; k++) {
        const bx = x + (rnd() - 0.5) * r * 1.8, by = y - rnd() * r * 1.1;
        c.fillStyle = rnd() > 0.4 ? "#f4c6dd" : "#ffffff";
        c.beginPath(); c.arc(bx, by, 2.4 * u, 0, Math.PI * 2); c.fill();
      }
    };
    rhodo(W * 0.9, H * 0.97, S * 0.16);
    rhodo(W * 0.24, H * 1.0, S * 0.1);

    /* moving things */
    seed = 77;
    geo.birds = Array.from({ length: 4 }, () => ({ x: rnd() * W, y: H * (0.12 + rnd() * 0.18), v: 12 + rnd() * 10, p: rnd() * 6, s: 0.7 + rnd() * 0.5 }));
    geo.leaves = Array.from({ length: 16 }, () => ({ x: rnd() * W, y: rnd() * H, v: 8 + rnd() * 10, p: rnd() * 6, c: ["#8fbf5a", "#c9d66a", "#6fa04a", "#e9c46a"][Math.floor(rnd() * 4)] }));
    geo.flies = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: H * (0.62 + rnd() * 0.36), p: rnd() * 6, r: 1 + rnd() * 1.5 }));
    geo.butterflies = Array.from({ length: 3 }, () => ({ x: rnd() * W, y: H * (0.72 + rnd() * 0.2), p: rnd() * 6 }));
  }

  /* ---------- animation */
  function frame(t) {
    const s = t / 1000, u = geo.u;
    // waterfall + birds
    let c = ctx.fx;
    c.clearRect(0, 0, W, H);
    const { x: fx, w: fw } = geo.fall, { top, bot } = geo.cliff;
    let g = c.createLinearGradient(fx - fw, 0, fx + fw, 0);
    g.addColorStop(0, "rgba(220,238,250,.75)"); g.addColorStop(0.5, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(200,226,244,.75)");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(fx - fw * 0.6, top); c.lineTo(fx + fw * 0.6, top); c.lineTo(fx + fw * 1.25, bot); c.lineTo(fx - fw * 1.25, bot); c.closePath(); c.fill();
    c.save(); c.clip();
    for (let k = 0; k < 14; k++) {
      const x = fx - fw * 1.2 + (k / 13) * fw * 2.4;
      const off = ((s * (90 + (k % 4) * 25) * u + hash(k, 3) * 200) % 60) * u;
      c.strokeStyle = k % 2 ? "rgba(150,195,225,.55)" : "rgba(255,255,255,.9)";
      c.lineWidth = 1.2; c.setLineDash([10 * u, 14 * u]); c.lineDashOffset = -off;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x + (x - fx) * 0.3, bot); c.stroke();
    }
    c.setLineDash([]); c.restore();
    // birds gliding over the ridges
    c.strokeStyle = "rgba(30,50,70,.65)"; c.lineCap = "round";
    for (const b of geo.birds) {
      const x = ((b.x + s * b.v * u) % (W + 40)) - 20, y = b.y + Math.sin(s * 0.6 + b.p) * 6 * u;
      const flap = Math.sin(s * 6 + b.p) * 3 * u * b.s, w = 6 * u * b.s;
      c.lineWidth = 1.3 * b.s;
      c.beginPath(); c.moveTo(x - w, y - flap); c.quadraticCurveTo(x - w * 0.4, y - flap * 0.2 - 2 * u, x, y); c.quadraticCurveTo(x + w * 0.4, y - flap * 0.2 - 2 * u, x + w, y - flap); c.stroke();
    }

    // river shimmer, spray, leaves, butterflies, fireflies (in front of everything)
    c = ctx.fx2;
    c.clearRect(0, 0, W, H);
    const { center } = geo.river, n = state.night;
    c.lineCap = "round";
    if (!state.photo) for (let k = 0; k < 46; k++) {
      const pos = (hash(k, 9) + s * 0.05 * (0.6 + hash(k, 4))) % 1;
      const i = Math.floor(pos * (center.length - 1)), p = center[i], q = center[Math.min(center.length - 1, i + 1)];
      const lat = (hash(k, 5) - 0.5) * 1.6 * p[2];
      const len = (4 + pos * 16) * u, ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const a = (0.25 + 0.5 * Math.abs(Math.sin(s * 1.5 + k))) * (1 - n * 0.6);
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = (0.8 + pos * 1.6);
      const x = p[0] - Math.sin(ang) * lat, y = p[1] + Math.cos(ang) * lat * 0.4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len * 0.3); c.stroke();
    }
    // spray at the base of the falls
    if (!state.photo) for (let k = 0; k < 8; k++) {
      const ph = (s * 0.5 + hash(k, 2)) % 1, r = (6 + ph * 20) * u;
      g = c.createRadialGradient(fx + (hash(k, 6) - 0.5) * 20 * u, bot - ph * 14 * u, 0, fx, bot - ph * 14 * u, r);
      g.addColorStop(0, `rgba(255,255,255,${0.35 * (1 - ph)})`); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(fx + (hash(k, 6) - 0.5) * 20 * u, bot - ph * 14 * u, r, 0, Math.PI * 2); c.fill();
    }
    // drifting leaves
    for (const l of geo.leaves) {
      const y = (l.y + s * l.v * u) % (H + 20) - 10, x = (l.x + s * 6 * u + Math.sin(s + l.p) * 14 * u) % W;
      c.save(); c.translate(x, y); c.rotate(Math.sin(s * 2 + l.p) * 0.8);
      c.fillStyle = l.c; c.beginPath(); c.ellipse(0, 0, 3 * u, 1.4 * u, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    // butterflies over the meadow (daytime)
    if (n < 0.8 && !state.photo) for (const b of geo.butterflies) {
      const x = (b.x + Math.sin(s * 0.4 + b.p) * 40 * u + W) % W, y = b.y + Math.sin(s * 0.9 + b.p * 2) * 12 * u;
      const f = Math.abs(Math.sin(s * 12 + b.p)) * 3 * u;
      c.fillStyle = `rgba(255,236,150,${1 - n})`;
      c.beginPath(); c.ellipse(x - f / 2, y, f, 2.4 * u, 0, 0, Math.PI * 2); c.ellipse(x + f / 2, y, f, 2.4 * u, 0, 0, Math.PI * 2); c.fill();
    }
    // fireflies at dusk
    if (n > 0.05) for (const f of geo.flies) {
      const a = Math.max(0, Math.sin(s * 1.7 + f.p)) * n;
      if (a < 0.05) continue;
      const x = f.x + Math.sin(s * 0.3 + f.p) * 12 * u, y = f.y + Math.cos(s * 0.4 + f.p) * 8 * u;
      g = c.createRadialGradient(x, y, 0, x, y, f.r * 5 * u);
      g.addColorStop(0, `rgba(240,255,170,${a})`); g.addColorStop(1, "rgba(240,255,170,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, f.r * 5 * u, 0, Math.PI * 2); c.fill();
    }
    // chip glint
    const gl = (s / 3.2) % 1;
    if (gl < 0.1 && n < 0.9 && !state.photo) {
      const a = 1 - Math.abs(gl - 0.05) / 0.05, { x, y } = geo.chips;
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x - 5 * u, y); c.lineTo(x + 5 * u, y); c.moveTo(x, y - 5 * u); c.lineTo(x, y + 5 * u); c.stroke();
    }
  }

  function resize() {
    DPR = Math.min(1.5, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; S = Math.min(W, H * 0.62);
    for (const k in cvs) {
      cvs[k].width = Math.round(W * DPR); cvs[k].height = Math.round(H * DPR);
      ctx[k].setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    paint();
    frame(performance.now());
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 40) return;
    last = t; frame(t);
  }
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();
  return {
    state,
    start() { if (!raf) raf = requestAnimationFrame(loop); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
})();
Scene.start();
