/* =========================================================================
   The Paytyn Show — a tiny birthday "movie" for Paytyn's 20th
   Edit the CONFIG block to change songs, start times or captions.
   ========================================================================= */
const CONFIG = {
  // "Epic Happy Birthday Song — Peyton" (the video you picked)
  bdayVideo: "huvuvjL1fYs",
  bdayStart: 0,
  // Zac Brown Band — "Chicken Fried" (official video, 4:33). The singing starts at 1:23
  // ("You know I like my chicken fried..."); everything before that is a spoken intro.
  zbbVideo: "e4ujS1er1r0",
  zbbStart: 82,
  actOne: { num: "ACT I", title: "The Wild Side" },
  actTwo: { num: "ACT II", title: "The Squad" },
  actThree: { num: "ACT III", title: "Zac Brown Band" },
  photosActOne: [
    { src: "img/outward-bound.jpg", cap: "summit snack, 7:59am 🏔️", sticker: "⛑️", tall: true },
    { src: "img/trail-nap.jpg",     cap: "pro-level trail napper",   sticker: "😴", tall: true },
    { src: "img/canyon.jpg",        cap: "canyon girl summer",       sticker: "🏜️" },
    { src: "img/raft-crew.jpg",     cap: "river crew, no notes",     sticker: "🛶" },
    { src: "img/raft-paddles.jpg",  cap: "paddles UP",               sticker: "⚔️" },
  ],
  photosActTwo: [
    { src: "img/lego-batman.jpg",   cap: "certified Lego engineer",  sticker: "🦇" },
    { src: "img/brick-wall.jpg",    cap: "main character energy",    sticker: "✨" },
    { src: "img/diner-crew.jpg",    cap: "late-night diner council", sticker: "🍳" },
    { src: "img/stameys.jpg",       cap: "BBQ & besties",            sticker: "🍔" },
  ],
  concertCaption: "Zac Brown Band night 🤠🇺🇸",
  // Photos shown on the Zac Brown Band ticket (they cross-fade if there's more than one)
  concertPhotos: ["img/zbb-concert.jpg"],
  signoff: "— from Yusuf 💛",
  creditsLine: "This is where all my AI credits go to",
  tickerText: "★ HAPPY 20TH BIRTHDAY PAYTYN ★ CHEROKEE'S FINEST ♠ ALL IN ON PAYTYN ♥ EST. NOV 3 2006 ♣ LEVEL 20 UNLOCKED ♦ ",
};

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ PIXEL CHEROKEE */
const Pixel = (() => {
  const cv = $("#pix"), g = cv.getContext("2d");
  let W, H, ridges = [], stars = [], flies = [], trees = [], clouds = [], raf = 0, last = 0, rTop, rBot;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const SKY = ["#120b2e", "#1b1140", "#271651", "#3a1c5e", "#552466", "#76306b", "#9b3d6b", "#c24f63", "#e2705a", "#f59a5c"];
  const LAYERS = [
    { b: 0.50, a: 0.12, c: "#8a7fc4", haze: "rgba(230,190,230,.22)" },
    { b: 0.58, a: 0.11, c: "#615aa0", haze: "rgba(200,170,230,.18)" },
    { b: 0.66, a: 0.09, c: "#403c7a", haze: "rgba(170,150,220,.14)" },
    { b: 0.74, a: 0.07, c: "#272552", haze: null },
  ];
  const ELK = [
    "#..#.....",
    ".#.#.....",
    "..##.....",
    "..###....",
    "...######",
    "...######",
    "...#.#..#",
    "...#.#..#",
  ];

  function resize() {
    const P = Math.max(3, Math.round(Math.min(innerWidth, innerHeight) / 95));
    W = Math.ceil(innerWidth / P); H = Math.ceil(innerHeight / P);
    cv.width = W; cv.height = H;
    seed = 11;
    rTop = Math.round(H * 0.82); rBot = Math.round(H * 0.88);
    ridges = LAYERS.map((L) => {
      const p1 = rnd() * 6, p2 = rnd() * 6, p3 = rnd() * 6, ys = [];
      for (let x = 0; x < W; x++) {
        const u = (x / W) * 120;
        const n = 0.55 * Math.sin(u * 0.055 + p1) + 0.3 * Math.sin(u * 0.14 + p2) + 0.15 * Math.sin(u * 0.41 + p3);
        ys.push(Math.round(H * L.b - H * L.a * (0.55 + 0.5 * n)));
      }
      return ys;
    });
    stars = Array.from({ length: Math.round(W * H / 90) }, () => ({ x: rnd() * W | 0, y: rnd() * H * 0.5 | 0, p: rnd() * 6, s: 0.5 + rnd() * 2 }));
    flies = Array.from({ length: 22 }, () => ({ x: rnd() * W, y: H * (0.7 + rnd() * 0.28), vx: rnd() - 0.5, vy: rnd() - 0.5, p: rnd() * 6 }));
    trees = [];
    for (let x = 1; x < W; x += 2 + (rnd() * 4 | 0)) {
      if (x > W * 0.58 && x < W * 0.94) continue; // leave room for the casino
      trees.push({ x, h: 4 + (rnd() * 6 | 0) });
    }
    clouds = Array.from({ length: 4 }, () => ({ x: rnd() * W, y: H * (0.12 + rnd() * 0.25), w: 10 + rnd() * 16, v: 0.6 + rnd() }));
  }

  function circle(cx, cy, r, color) {
    g.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
      if (dx * dx + dy * dy <= r * r + r * 0.6) g.fillRect(cx + dx, cy + dy, 1, 1);
  }
  function chip(cx, cy, r, color) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + 0.3) continue;
      const a = Math.atan2(dy, dx) + Math.PI;
      let c = color;
      if (d > r - 1.5 && Math.floor(a / (Math.PI / 4)) % 2 === 0) c = "#fff";
      else if (r >= 4 && d > r * 0.48 && d < r * 0.68) c = "#fff";
      g.fillStyle = c; g.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }

  function draw(t) {
    // sky in stepped (dithered) bands
    const horizon = H * 0.75, bh = horizon / SKY.length;
    for (let i = 0; i < SKY.length; i++) {
      g.fillStyle = SKY[i];
      g.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1);
      if (i < SKY.length - 1) { // checker dither on the seam
        g.fillStyle = SKY[i + 1];
        const y = Math.floor((i + 1) * bh) - 1;
        for (let x = (i % 2); x < W; x += 2) g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = SKY[SKY.length - 1]; g.fillRect(0, horizon, W, H - horizon);

    // stars
    for (const s of stars) {
      const a = (Math.sin(t / 400 * s.s + s.p) + 1) / 2;
      if (a < 0.25) continue;
      g.fillStyle = `rgba(255,248,220,${a})`; g.fillRect(s.x, s.y, 1, 1);
    }
    // moon
    const mr = Math.max(3, Math.round(W / 26));
    circle(Math.round(W * 0.2), Math.round(H * 0.12), mr, "#fff3c9");
    g.fillStyle = "#e8d79c"; g.fillRect(Math.round(W * 0.2) - 1, Math.round(H * 0.12), 2, 1); g.fillRect(Math.round(W * 0.2) + 1, Math.round(H * 0.12) - 2, 1, 1);

    // clouds
    for (const c of clouds) {
      const x = ((c.x + t / 1000 * c.v) % (W + 40)) - 20;
      g.fillStyle = "rgba(255,170,190,.45)";
      g.fillRect(x | 0, c.y | 0, c.w | 0, 2);
      g.fillRect((x + 3) | 0, (c.y - 1) | 0, (c.w - 6) | 0, 1);
      g.fillRect((x + c.w * 0.3) | 0, (c.y - 2) | 0, (c.w * 0.3) | 0, 1);
    }

    // Smoky Mountain ridges with haze between them
    ridges.forEach((ys, i) => {
      g.fillStyle = LAYERS[i].c;
      for (let x = 0; x < W; x++) g.fillRect(x, ys[x], 1, rTop - ys[x] + 1);
      if (LAYERS[i].haze) { g.fillStyle = LAYERS[i].haze; g.fillRect(0, Math.round(H * (LAYERS[i].b - 0.02)), W, Math.round(H * 0.05)); }
    });
    // pines on the near ridge
    g.fillStyle = "#161a38";
    const near = ridges[3];
    for (const tr of trees) {
      const base = near[tr.x] + 3;
      for (let k = 0; k < tr.h; k++) {
        const w = Math.floor((k / tr.h) * 3);
        g.fillRect(tr.x - w, base - tr.h + k, w * 2 + 1, 1);
      }
    }

    // casino on the far bank
    const cx0 = Math.round(W * 0.62), cx1 = Math.round(W * 0.92), cw = cx1 - cx0, ch = Math.round(H * 0.15), cy0 = rTop - ch;
    g.fillStyle = "#2a1840"; g.fillRect(cx0, cy0, cw, ch);
    g.fillStyle = "#3d2459"; g.fillRect(cx0, cy0, cw, 1);
    g.fillStyle = "#22133a"; g.fillRect(cx0 + Math.round(cw * 0.15), cy0 - Math.round(ch * 0.35), Math.round(cw * 0.7), Math.round(ch * 0.35));
    const flick = Math.floor(t / 450);
    for (let y = cy0 + 2; y < rTop - 2; y += 3) for (let x = cx0 + 2; x < cx1 - 2; x += 3) {
      const h = Math.sin(x * 12.9898 + y * 78.233 + flick * 3.1) * 43758.5453;
      g.fillStyle = (h - Math.floor(h)) > 0.3 ? "#ffd36b" : "#4b2e6b";
      g.fillRect(x, y, 1, 1);
    }
    // marquee sign with chasing bulbs
    const sx0 = cx0 - 2, sx1 = cx1 + 2, sy0 = cy0 - Math.round(ch * 0.35) - 9, sy1 = sy0 + 8;
    g.fillStyle = "#12061e"; g.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    let i = 0;
    const tick = Math.floor(t / 180);
    const bulb = (x, y) => { g.fillStyle = (i++ + tick) % 3 === 0 ? "#ff4d6d" : "#ffd36b"; g.fillRect(x, y, 1, 1); };
    for (let x = sx0; x < sx1; x += 2) { bulb(x, sy0); bulb(x, sy1 - 1); }
    for (let y = sy0 + 2; y < sy1 - 1; y += 2) { bulb(sx0, y); bulb(sx1 - 1, y); }
    const midX = Math.round((sx0 + sx1) / 2);
    chip(midX - 7, sy0 + 4, 2, "#d62839"); chip(midX, sy0 + 4, 2, "#1d4ed8"); chip(midX + 7, sy0 + 4, 2, "#0f8a4b");

    // river (Oconaluftee) with shimmer
    g.fillStyle = "#2b3f7a"; g.fillRect(0, rTop, W, rBot - rTop);
    g.fillStyle = "#3d5aa5"; g.fillRect(0, rTop, W, 1);
    for (let k = 0; k < W / 3; k++) {
      const x = Math.floor((k * 37 + t / 60 * (1 + (k % 3))) % W), y = rTop + 1 + (k * 7) % Math.max(1, rBot - rTop - 1);
      g.fillStyle = k % 4 ? "rgba(255,200,170,.55)" : "rgba(255,240,200,.9)";
      g.fillRect(x, y, 2 + (k % 3), 1);
    }
    // casino reflection
    g.fillStyle = "rgba(255,211,107,.25)";
    for (let y = rTop + 1; y < rBot; y += 2) g.fillRect(cx0 + ((Math.sin(t / 300 + y) * 2) | 0), y, cw, 1);

    // near bank
    g.fillStyle = "#14261f"; g.fillRect(0, rBot, W, H - rBot);
    g.fillStyle = "#1f3a2c";
    for (let x = 0; x < W; x += 3) g.fillRect(x, rBot - ((x * 7) % 3 === 0 ? 1 : 0), 1, 1);

    // elk silhouette (they roam the Oconaluftee valley)
    const ex = Math.round(W * 0.42), ey = rBot + 1;
    g.fillStyle = "#0b1410";
    ELK.forEach((row, ry) => [...row].forEach((ch2, rx) => { if (ch2 === "#") g.fillRect(ex + rx, ey + ry, 1, 1); }));

    // bouncing poker chips
    const r = Math.max(3, Math.round(W / 34));
    [["#d62839", 0.12], ["#1d4ed8", 0.22], ["#0f8a4b", 0.32]].forEach(([col, fx], k) => {
      const hop = Math.abs(Math.sin(t / 380 + k * 1.1)) * H * 0.045;
      const x = Math.round(W * fx), y = Math.round(H * 0.95 - r - hop);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x - r + 1, Math.round(H * 0.95), r * 2 - 1, 1);
      chip(x, y, r, col);
    });

    // fireflies
    for (const f of flies) {
      f.x += f.vx * 0.15; f.y += f.vy * 0.1;
      if (Math.random() < 0.02) { f.vx = rnd() - 0.5; f.vy = rnd() - 0.5; }
      if (f.x < 0) f.x = W; if (f.x > W) f.x = 0;
      if (f.y < H * 0.65 || f.y > H) f.vy *= -1;
      const a = (Math.sin(t / 250 + f.p) + 1) / 2;
      g.fillStyle = `rgba(230,255,120,${a})`; g.fillRect(f.x | 0, f.y | 0, 1, 1);
    }
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return; // ~30fps keeps the retro feel
    last = t; draw(t);
  }
  resize();
  addEventListener("resize", resize);
  return { start() { if (!raf) raf = requestAnimationFrame(loop); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
})();
Pixel.start();

/* ------------------------------------------------------------------ THEATRE DRESSING */
(() => {
  const stars = [];
  for (let i = 0; i < 90; i++) stars.push(`${rand(0, 100).toFixed(1)}vw ${rand(0, 45).toFixed(1)}vh 0 ${Math.random() < 0.2 ? 1 : 0}px rgba(255,248,220,${rand(0.3, 0.9).toFixed(2)})`);
  $(".stars").style.boxShadow = stars.join(",");
  $(".ticker-track").textContent = CONFIG.tickerText.repeat(6);
})();

/* ------------------------------------------------------------------ MUSIC (YouTube) */
const Music = {
  player: null, ready: false, wantPlay: false, onZbb: false, fadeTimer: 0,
  init() {
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player("yt", {
        videoId: CONFIG.bdayVideo,
        playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, start: CONFIG.bdayStart, origin: location.origin },
        events: {
          onReady: () => { this.ready = true; if (this.wantPlay) this.play(); },
          onStateChange: (e) => { if (e.data === 1) $("#soundPill").style.display = "none"; },
        },
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  },
  play() {
    this.wantPlay = true;
    if (!this.ready) return;
    try { this.player.unMute(); this.player.setVolume(100); this.player.playVideo(); } catch (e) {}
  },
  // If the browser blocked sound, show a pill the viewer can tap.
  check() {
    setTimeout(() => {
      let ok = false;
      try { ok = this.ready && this.player.getPlayerState() === 1 && !this.player.isMuted(); } catch (e) {}
      if (!ok) $("#soundPill").style.display = "block";
    }, 3000);
  },
  fade(from, to, ms, done) {
    clearInterval(this.fadeTimer);
    const t0 = performance.now();
    this.fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      try { this.player && this.player.setVolume(Math.round(from + (to - from) * k)); } catch (e) {}
      if (k >= 1) { clearInterval(this.fadeTimer); done && done(); }
    }, 50);
  },
  toZbb() {
    if (this.onZbb) return;
    this.onZbb = true;
    if (!this.ready) return;
    this.fade(100, 0, 900, () => {
      try {
        this.player.loadVideoById({ videoId: CONFIG.zbbVideo, startSeconds: CONFIG.zbbStart });
        this.player.unMute();
        this.fade(0, 100, 1800);
      } catch (e) {}
    });
  },
  restart() {
    this.onZbb = false;
    if (!this.ready) return;
    try { this.player.loadVideoById({ videoId: CONFIG.bdayVideo, startSeconds: CONFIG.bdayStart }); this.player.unMute(); this.player.setVolume(100); } catch (e) {}
  },
  duck(on) { try { this.player && this.player.setVolume(on ? 30 : 100); } catch (e) {} },
};
Music.init();

/* ------------------------------------------------------------------ VOICE-OVERS
   Drop ElevenLabs mp3s into /audio with these names and they play automatically.
   If a file is missing we skip it (or use the phone's built-in voice for the last line). */
const VO = {
  files: { intro: "audio/vo-intro.mp3", zbb: "audio/vo-zbb.mp3", credits: "audio/vo-credits.mp3" },
  have: {},
  el: new Audio(),
  init() {
    for (const [k, f] of Object.entries(this.files))
      fetch(f, { method: "HEAD" }).then((r) => { this.have[k] = r.ok; }).catch(() => {});
  },
  unlock() { // called inside the first tap so iOS lets us play later
    try { this.el.muted = true; this.el.src = this.files.intro; const p = this.el.play(); p && p.then(() => { this.el.pause(); this.el.muted = false; }).catch(() => { this.el.muted = false; }); } catch (e) {}
  },
  play(k, fallbackText) {
    if (this.have[k]) {
      try {
        this.el.muted = false; this.el.src = this.files[k]; this.el.currentTime = 0;
        Music.duck(true); this.el.onended = () => Music.duck(false);
        this.el.play().catch(() => Music.duck(false));
        return;
      } catch (e) {}
    }
    if (fallbackText) speak(fallbackText);
  },
};
VO.init();

/* ------------------------------------------------------------------ CONFETTI HELPERS */
const pop = (opts) => { try { confetti(Object.assign({ disableForReducedMotion: true, zIndex: 90 }, opts)); } catch (e) {} };
const flagColors = ["#b22234", "#ffffff", "#3c3b6e"];
const partyColors = ["#ffd36b", "#ff7eb6", "#7fd3ff", "#b9ffcf", "#d62839"];
function bigBurst(colors = partyColors) {
  pop({ particleCount: 120, spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.6 }, colors });
  setTimeout(() => { pop({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors }); pop({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors }); }, 250);
}
function rainChips(n = 26) {
  const colors = ["#d62839", "#1d4ed8", "#0f8a4b", "#111", "#7c3aed"];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "chip rain-chip";
    el.style.setProperty("--c", colors[i % colors.length]);
    el.style.left = rand(0, 92) + "vw";
    el.innerHTML = '<span class="chip-face">AI</span>';
    document.body.appendChild(el);
    gsap.to(el, { y: innerHeight + 120, rotation: rand(-540, 540), duration: rand(2.4, 4.2), delay: rand(0, 1.8), ease: "power1.in", onComplete: () => el.remove() });
  }
}

/* ------------------------------------------------------------------ BUILD PHOTOS */
const allPhotos = [...CONFIG.photosActOne, ...CONFIG.photosActTwo, ...CONFIG.concertPhotos.map((src) => ({ src, cap: CONFIG.concertCaption, sticker: "🤠" }))];
$(".t-photo").innerHTML = CONFIG.concertPhotos.map((src) => `<img src="${src}" alt="">`).join("");
const concertImgs = [...document.querySelectorAll(".t-photo img")];
$("#signoff").textContent = CONFIG.signoff;
function makePolaroid(p) {
  const el = document.createElement("figure");
  el.className = "polaroid" + (p.tall ? " tall" : "");
  el.innerHTML = `<div class="tape"></div><div class="frame"><img src="${p.src}" alt=""></div><figcaption class="cap">${p.cap}</figcaption><span class="sticker">${p.sticker}</span>`;
  $("#photos").appendChild(el);
  return el;
}
const actOneEls = CONFIG.photosActOne.map(makePolaroid);
const actTwoEls = CONFIG.photosActTwo.map(makePolaroid);
gsap.set(".polaroid", { xPercent: -50, yPercent: -50 });

/* ------------------------------------------------------------------ THE SHOW TIMELINE */
const STEP = 2.9; // seconds each photo gets the spotlight
let tl;
function setAct(a) { $("#actnum").textContent = a.num; $("#acttitle").textContent = a.title; }

function photoRun(tl, els, t0) {
  els.forEach((el, i) => {
    const t = t0 + i * STEP, side = i % 2 ? 1 : -1;
    tl.fromTo(el, { opacity: 0, y: innerHeight * 0.6, x: rand(-60, 60), rotation: rand(-25, 25), scale: 0.6 },
      { opacity: 1, y: 0, x: 0, rotation: rand(-5, 5), scale: 1, duration: 0.85, ease: "back.out(1.5)" }, t);
    tl.fromTo(el.querySelector("img"), { scale: 1 }, { scale: 1.07, duration: STEP + 0.6, ease: "none" }, t);
    tl.call(() => pop({ particleCount: 18, spread: 50, startVelocity: 25, origin: { x: 0.5, y: 0.62 }, colors: partyColors, scalar: 0.8 }), null, t + 0.5);
    // previous photo slides off to the pile
    if (i > 0) {
      const prev = els[i - 1];
      tl.to(prev, { x: side * innerWidth * 0.3, y: -innerHeight * 0.22 + rand(-20, 20), scale: 0.42, rotation: side * rand(8, 16), opacity: 0.6, duration: 0.8, ease: "power2.inOut" }, t);
    }
    if (i > 2) tl.to(els[i - 3], { opacity: 0, duration: 0.5 }, t);
  });
  const end = t0 + els.length * STEP;
  tl.to(els, { opacity: 0, scale: 0.3, y: -innerHeight * 0.5, stagger: 0.05, duration: 0.6, ease: "power2.in" }, end - 0.3);
  return end + 0.4;
}

function actCard(tl, a, t) {
  tl.call(() => setAct(a), null, t);
  tl.fromTo("#actcard", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, t);
  tl.to("#actcard", { opacity: 0, scale: 1.3, duration: 0.4, ease: "power2.in" }, t + 1.6);
  return t + 2;
}

function buildShow() {
  tl = gsap.timeline({ paused: true });

  // --- INTRO: the chip gets dealt, the pixel world zooms into the theatre
  tl.to("#startBtn", { scale: 1.35, rotation: 720, duration: 0.9, ease: "power2.out" }, 0);
  tl.to("#startBtn", { y: -innerHeight, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.9);
  tl.call(() => { $("#pixSub").textContent = "♠ CHEROKEE'S FINEST ♥"; $("#tapText").textContent = "DEALING YOU IN..."; }, null, 0.05);
  tl.call(() => pop({ particleCount: 90, spread: 90, origin: { x: 0.5, y: 0.65 }, colors: ["#d62839", "#ffffff", "#ffd36b", "#1d4ed8"] }), null, 0.4);
  tl.to(".road-sign", { y: -20, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1);
  tl.to(".intro-ui", { opacity: 0, y: -40, duration: 0.7 }, 3.4);
  tl.to("#pix", { scale: 3, transformOrigin: "77% 72%", duration: 2, ease: "power2.in" }, 3.3);
  tl.to("#intro", { autoAlpha: 0, duration: 0.8 }, 4.7);
  tl.call(() => Pixel.stop(), null, 5.6);
  tl.call(() => Pixel.start(), null, 0); // so replays bring the pixel world back

  // --- CURTAINS UP
  let t = 5.6;
  tl.to("#skip", { opacity: 1, pointerEvents: "auto", duration: 0.4 }, t);
  tl.to(".curtain.left", { xPercent: -86, duration: 1.8, ease: "power3.inOut" }, t);
  tl.to(".curtain.right", { xPercent: 86, duration: 1.8, ease: "power3.inOut" }, t);
  tl.call(() => pop({ particleCount: 60, spread: 120, origin: { x: 0.5, y: 0.3 }, colors: partyColors }), null, t + 1.2);
  tl.fromTo("#nowshowing", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, t + 1.2);
  tl.call(() => VO.play("intro"), null, t + 0.4);

  // the birthday video plays full on the screen, then dims to the background
  t += 5.2;
  tl.to("#nowshowing", { opacity: 0, duration: 0.5 }, t);
  tl.to("#screen", { opacity: 0.2, duration: 1.6 }, t);
  tl.to(".marquee", { scale: 0.8, transformOrigin: "50% 0", duration: 0.6 }, t);

  // --- ACT I
  t = actCard(tl, CONFIG.actOne, t + 0.4);
  t = photoRun(tl, actOneEls, t);
  // --- ACT II
  t = actCard(tl, CONFIG.actTwo, t);
  t = photoRun(tl, actTwoEls, t);

  // --- ACT III: Zac Brown Band
  tl.addLabel("zbb", t);
  tl.call(() => Music.toZbb(), null, t);
  tl.call(() => VO.play("zbb"), null, t + 1.2);
  t = actCard(tl, CONFIG.actThree, t);
  tl.to(".beam", { opacity: 1, duration: 0.8 }, t - 0.6);
  tl.to(".beam.b1", { rotation: 10, duration: 2.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, t - 0.6);
  tl.to(".beam.b2", { rotation: -10, duration: 2.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, t - 0.6);
  tl.to("#screen", { opacity: 0.35, duration: 1 }, t);
  tl.fromTo("#concert", { opacity: 0, scale: 0.5, rotation: -8 }, { opacity: 1, scale: 1, rotation: -2, duration: 1, ease: "back.out(1.6)" }, t);
  tl.call(() => bigBurst(flagColors), null, t + 0.6);
  const zbbLen = Math.max(8, 1.6 + concertImgs.length * 2.8);
  tl.to("#concert", { rotation: 2, duration: 1.5, yoyo: true, repeat: Math.round(zbbLen / 1.5) - 2, ease: "sine.inOut" }, t + 1);
  concertImgs.forEach((img, i) => {
    if (i === 0) return;
    tl.fromTo(img, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.7 }, t + 0.6 + i * 2.8);
    tl.call(() => pop({ particleCount: 30, spread: 70, origin: { x: 0.5, y: 0.45 }, colors: flagColors }), null, t + 0.8 + i * 2.8);
  });
  t += zbbLen;
  tl.to("#concert", { opacity: 0, scale: 0.6, y: -60, duration: 0.6, ease: "power2.in" }, t - 0.6);
  tl.to(".beam", { opacity: 0.35, duration: 1 }, t);

  // --- FINALE / ENCORE
  tl.addLabel("finale", t);
  tl.to("#screen", { opacity: 0.12, duration: 1 }, t);
  tl.to(".marquee", { autoAlpha: 0, duration: 0.5 }, t);
  tl.to("#skip", { opacity: 0, pointerEvents: "none", duration: 0.3 }, t);
  tl.to("#finale", { autoAlpha: 1, duration: 0.6 }, t);
  tl.from(".hb-1", { y: -80, opacity: 0, duration: 0.7, ease: "bounce.out" }, t + 0.1);
  tl.from(".hb-2", { y: -80, opacity: 0, duration: 0.7, ease: "bounce.out" }, t + 0.4);
  tl.from(".hb-name .l", { scale: 0, rotation: () => rand(-90, 90), opacity: 0, stagger: 0.09, duration: 0.6, ease: "back.out(3)" }, t + 0.8);
  tl.call(() => bigBurst(), null, t + 1.2);
  tl.from("#cake", { y: 120, opacity: 0, duration: 0.8, ease: "back.out(1.4)" }, t + 1.6);
  tl.from(".wish", { opacity: 0, duration: 0.5 }, t + 2.3);
  tl.call(() => showCredits(), null, t + 8);
  return tl;
}

// split "Paytyn" into letters for the pop-in
$(".hb-name").innerHTML = [..."Paytyn"].map((c) => `<span class="l">${c}</span>`).join("");

let creditsShown = false;
function showCredits() {
  if (creditsShown) return;
  creditsShown = true;
  $("#credits").firstChild.textContent = CONFIG.creditsLine + " ";
  gsap.fromTo("#credits", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 });
  gsap.to("#credits span", { rotation: 360, repeat: -1, duration: 1.6, ease: "none", delay: 0.6 });
  gsap.to("#signoff", { opacity: 1, duration: 0.8, delay: 1.4 });
  gsap.to(".end-btns", { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 2.2 });
  rainChips();
  VO.play("credits", "Happy twentieth birthday, Paytyn! From Yusuf. And yes... " + CONFIG.creditsLine.replace("AI", "A.I."));
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1.05;
    Music.duck(true);
    u.onend = () => Music.duck(false);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    setTimeout(() => Music.duck(false), 6000);
  } catch (e) {}
}

/* ------------------------------------------------------------------ INTERACTIONS */
let started = false;
$("#startBtn").addEventListener("click", () => {
  if (started) return;
  started = true;
  hideRotate();
  goBigScreen();
  Music.play();
  Music.check();
  VO.unlock();
  // unlock speech on iOS while we still have the tap
  try { speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch (e) {}
  $("#startBtn").style.animation = "none";
  buildShow().play(0);
});

$("#soundPill").addEventListener("click", () => {
  if (Music.onZbb && Music.ready) { try { Music.player.loadVideoById({ videoId: CONFIG.zbbVideo, startSeconds: CONFIG.zbbStart }); } catch (e) {} }
  Music.play();
  $("#soundPill").style.display = "none";
});

$("#skip").addEventListener("click", () => {
  Music.toZbb();
  tl.seek("finale");
});

$("#cake").addEventListener("click", () => {
  const cake = $("#cake");
  if (cake.classList.contains("out")) { cake.classList.remove("out"); $("#wish").textContent = "relit! blow again 🕯️"; return; }
  cake.classList.add("out");
  $("#wish").textContent = "wish granted ✨ happy 20th!";
  bigBurst();
  setTimeout(showCredits, 900);
});

$("#replay").addEventListener("click", () => {
  creditsShown = false;
  gsap.killTweensOf("#credits span");
  gsap.set(["#credits", "#signoff"], { opacity: 0 });
  gsap.set(".end-btns", { opacity: 0, pointerEvents: "none" });
  $("#cake").classList.remove("out");
  $("#wish").textContent = "tap the candles & make a wish ✨";
  $(".intro-ui").style.opacity = 1;
  $("#pixSub").textContent = "EST. NOV 3, 2006";
  Music.restart();
  tl.restart();
});

// tap anywhere on the stage for a little celebration
$("#theatre").addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  pop({ particleCount: 24, spread: 70, startVelocity: 28, scalar: 0.9, origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight }, colors: partyColors });
});

/* ------------------------------------------------------------------ PHOTO WALL */
(() => {
  const grid = $("#wallGrid");
  allPhotos.forEach((p) => {
    const b = document.createElement("button");
    b.style.setProperty("--r", rand(-4, 4).toFixed(1) + "deg");
    b.innerHTML = `<img src="${p.src}" alt="" loading="lazy"><span>${p.cap}</span>`;
    b.onclick = () => { const lb = $("#lightbox"); lb.querySelector("img").src = p.src; lb.querySelector("p").textContent = p.cap; lb.hidden = false; };
    grid.appendChild(b);
  });
  $("#wallBtn").onclick = () => { $("#wall").hidden = false; };
  $("#wallClose").onclick = () => { $("#wall").hidden = true; };
  $("#lightbox").onclick = () => { $("#lightbox").hidden = true; };
})();

/* ------------------------------------------------------------------ "TURN YOUR PHONE" PROMPT */
const portraitMQ = matchMedia("(orientation: portrait)");
const isPhone = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 600;
let rotateDismissed = false;
function hideRotate() { gsap.to("#rotate", { autoAlpha: 0, duration: 0.4 }); }
function updateRotate() {
  if (started || rotateDismissed || !isPhone) return hideRotate();
  if (portraitMQ.matches) gsap.to("#rotate", { autoAlpha: 1, duration: 0.3 });
  else hideRotate();
}
portraitMQ.addEventListener ? portraitMQ.addEventListener("change", updateRotate) : portraitMQ.addListener(updateRotate);
$("#rotateSkip").addEventListener("click", () => { rotateDismissed = true; hideRotate(); });
gsap.set("#rotate", { autoAlpha: 0 });
updateRotate();

// Android: go fullscreen and hold landscape once she taps (iPhones ignore this, that's fine)
function goBigScreen() {
  try {
    const el = document.documentElement;
    if (!isPhone || portraitMQ.matches || !el.requestFullscreen) return;
    el.requestFullscreen({ navigationUI: "hide" }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {})).catch(() => {});
  } catch (e) {}
}
