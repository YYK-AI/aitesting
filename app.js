/* =========================================================================
   The Paytyn Show — a tiny birthday "movie" for Paytyn's 21st
   Edit the CONFIG block to change songs, start times or captions.
   ========================================================================= */
const CONFIG = {
  // the birthday song video (plays muted in the background as soon as the page opens; sound comes on at the tap)
  bdayVideo: "media/birthday.mp4",
  // Zac Brown Band — Chicken Fried, layered under the birthday song from Chapter III on
  zbbSong: "media/chicken-fried.mp3",
  zbbStart: 50.8, // seconds into chicken-fried.mp3: "...grown in Southern ground, and a little bit of chicken fried"
  mix: { bday: 0.8, bdayWithZbb: 0.1, zbb: 0.95, fade: 3.5 }, // volumes (0–1) and crossfade length (s)
  // the pics, in order — her solo ones are sprinkled between the ones together
  photos: [
    { src: "img/canyon.jpg",        sticker: "🏜️" },
    { src: "img/outward-bound.jpg", sticker: "⛑️", tall: true },
    { src: "img/lego-batman.jpg",   sticker: "🦇" },
    { src: "img/brick-wall.jpg",    sticker: "✨" },
    { src: "img/trail-nap.jpg",     sticker: "😴", tall: true },
    { src: "img/raft-paddles.jpg",  sticker: "⚔️" },
    { src: "img/diner-crew.jpg",    sticker: "🍳" },
  ],
  // Photos shown on the Zac Brown Band ticket (they cross-fade): pre-show Stamey's, then the show
  concertPhotos: ["img/stameys.jpg", "img/zbb-concert.jpg"],
  // Real Cherokee nature photos for the backdrop (optional; empty = the illustrated scene)
  naturePhotos: [],
  message: "Hope you have an AWESOME year ahead!",
  creditsLine: "And yes, this is where all my AI credits go 😂",
  signoff: "Yusuf",
  // bottom strip, in the Eastern Band (Kituwah / North Carolina) form, as taught by Eastern Band elder
  // Robert Bushyhead in the WCU Cherokee lesson "Happy Birthday" (Lesson 6B):
  // ᎤᎵᎮᎵᏍᏗ ᏣᏕᏘᏯ ᎩᎾᎵ = Ulihelisdi tsadetiya ginali = "Happy birthday to you, my friend"
  cherokee: "ᎤᎵᎮᎵᏍᏗ ᏣᏕᏘᏯ ᎩᎾᎵ",
  cherokeeLatin: "happy birthday, my friend",
  ticker: ["HAPPY 21ST BIRTHDAY PAYTYN", "MAY THE ODDS BE EVER IN YOUR FAVOR"],
};

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);


/* ------------------------------------------------------------------ THEATRE DRESSING */
(() => {
  const suits = ["♠", "♥", "♣", "♦"];
  let html = "";
  for (let r = 0; r < 4; r++) {
    html += `<span class="tk-chr">${CONFIG.cherokee}<small>${CONFIG.cherokeeLatin}</small></span>`;
    CONFIG.ticker.forEach((t, i) => { html += `<span class="tk-suit">${suits[(r + i) % 4]}</span><span class="tk-txt">${t}</span>`; });
    html += `<span class="tk-suit">${suits[r % 4]}</span>`;
  }
  $(".ticker-track").innerHTML = html + html;
})();

/* ------------------------------------------------------------------ MUSIC: birthday video + Chicken Fried, mixed with Web Audio
   (iPhones ignore element.volume, so volumes go through gain nodes) */
const Mix = {
  vid: document.getElementById("bgvid"),
  song: new Audio(CONFIG.zbbSong),
  ctx: null, gB: null, gZ: null, onZbb: false,
  init() {
    this.vid.src = CONFIG.bdayVideo;
    this.song.preload = "auto";
    const tryPlay = () => this.vid.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", () => { if (!document.hidden && this.vid.paused) tryPlay(); });
  },
  // called inside the first tap: sound on, birthday song from the top, Chicken Fried unlocked but silent
  start() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      try { this.ctx = new AC({ latencyHint: "playback" }); } catch (e) { this.ctx = new AC(); }
      const sB = this.ctx.createMediaElementSource(this.vid), sZ = this.ctx.createMediaElementSource(this.song);
      this.gB = this.ctx.createGain(); this.gZ = this.ctx.createGain();
      this.gB.gain.value = CONFIG.mix.bday; this.gZ.gain.value = 0;
      sB.connect(this.gB).connect(this.ctx.destination);
      sZ.connect(this.gZ).connect(this.ctx.destination);
      this.ctx.resume();
    } catch (e) { this.ctx = null; this.vid.volume = CONFIG.mix.bday; }
    this.vid.muted = false; this.vid.loop = true;
    this.vid.currentTime = 0;
    this.vid.play().catch(() => {});
    this.song.play().then(() => { if (!this.onZbb) { this.song.pause(); this.song.currentTime = 0; } }).catch(() => {});
    setTimeout(() => {
      const bad = this.vid.paused || (this.ctx && this.ctx.state !== "running");
      if (bad) $("#soundPill").style.display = "block";
    }, 2500);
  },
  fade(which, to, secs) {
    if (this.ctx) {
      const g = which === "bday" ? this.gB : this.gZ, now = this.ctx.currentTime;
      g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(to, now + secs);
    } else {
      gsap.to(which === "bday" ? this.vid : this.song, { volume: to, duration: secs });
    }
  },
  toZbb() {
    if (this.onZbb) return;
    this.onZbb = true;
    if (!this.ctx) this.song.volume = 0;
    this.song.currentTime = CONFIG.zbbStart;
    this.song.play().catch(() => {});
    this.fade("zbb", CONFIG.mix.zbb, CONFIG.mix.fade);
    this.fade("bday", CONFIG.mix.bdayWithZbb, CONFIG.mix.fade);
  },
  restart() {
    this.onZbb = false;
    this.song.pause(); this.song.currentTime = 0;
    this.fade("zbb", 0, 0.3); this.fade("bday", CONFIG.mix.bday, 0.3);
    this.vid.currentTime = 0; this.vid.play().catch(() => {});
  },
  resume() {
    try { this.ctx && this.ctx.resume(); } catch (e) {}
    this.vid.muted = false; this.vid.play().catch(() => {});
    if (this.onZbb) this.song.play().catch(() => {});
  },
};
Mix.init();

/* ------------------------------------------------------------------ CONFETTI HELPERS */
const pop = (opts) => { try { confetti(Object.assign({ disableForReducedMotion: true, zIndex: 90 }, opts)); } catch (e) {} };
const flagColors = ["#b22234", "#ffffff", "#3c3b6e"];
const partyColors = ["#7bafd4", "#ffffff", "#13294b", "#a7cbe6", "#f3d27a"];
function bigBurst(colors = partyColors) {
  pop({ particleCount: 120, spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.6 }, colors });
  setTimeout(() => { pop({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors }); pop({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors }); }, 250);
}
function rainChips(n = 26) {
  const colors = ["#13294b", "#7bafd4", "#1d3d6b", "#a7cbe6", "#0b1a33"];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "chip rain-chip";
    el.style.setProperty("--c", colors[i % colors.length]);
    el.style.left = rand(0, 92) + "vw";
    el.innerHTML = '<span class="chip-face">21</span>';
    document.body.appendChild(el);
    gsap.to(el, { y: innerHeight + 120, rotation: rand(-540, 540), duration: rand(2.4, 4.2), delay: rand(0, 1.8), ease: "power1.in", onComplete: () => el.remove() });
  }
}

/* ------------------------------------------------------------------ BUILD PHOTOS */
const allPhotos = [...CONFIG.photos, ...CONFIG.concertPhotos.map((src) => ({ src }))];

/* ------------------------------------------------------------------ NATURE PHOTO BACKDROP */
(() => {
  const list = CONFIG.naturePhotos || [];
  if (!list.length) return;
  const box = document.getElementById("photobg");
  const imgs = list.map((p, i) => {
    const im = new Image();
    im.alt = ""; im.decoding = "async"; im.src = p.src;
    im.style.objectPosition = p.focus || "50% 50%";
    box.appendChild(im);
    return im;
  });
  imgs[0].addEventListener("load", () => {
    document.getElementById("world").classList.add("photo-mode");
    Scene.state.photo = true;
    document.body.classList.add("photo-mode");
    let i = 0;
    const show = (k) => {
      const im = imgs[k];
      gsap.fromTo(im, { opacity: 0, scale: 1.12 }, { opacity: 1, duration: 2.2, ease: "power1.inOut" });
      gsap.to(im, { scale: 1, duration: 12, ease: "none" });
      imgs.forEach((o, j) => { if (j !== k) gsap.to(o, { opacity: 0, duration: 2.2, delay: 0.2 }); });
    };
    show(0);
    if (imgs.length > 1) setInterval(() => { i = (i + 1) % imgs.length; if (imgs[i].complete && imgs[i].naturalWidth) show(i); }, 9000);
  }, { once: true });
})();
$("#message").textContent = CONFIG.message;
$("#credits").textContent = CONFIG.creditsLine;
$(".t-photo").innerHTML = CONFIG.concertPhotos.map((src) => `<img src="${src}" alt="">`).join("");
const concertImgs = [...document.querySelectorAll(".t-photo img")];
$("#signoff span").textContent = CONFIG.signoff;
function makePolaroid(p) {
  const el = document.createElement("figure");
  el.className = "polaroid" + (p.tall ? " tall" : "");
  el.innerHTML = `<div class="tape"></div><div class="frame"><img src="${p.src}" alt=""></div><span class="sticker">${p.sticker}</span>`;
  $("#photos").appendChild(el);
  return el;
}
const photoEls = CONFIG.photos.map(makePolaroid);
gsap.set(".polaroid", { xPercent: -50, yPercent: -50 });

/* ------------------------------------------------------------------ THE SHOW TIMELINE */
const STEP = 3.1; // seconds each photo gets the spotlight
let tl;
gsap.set(["#ticker", ".balloons"], { opacity: 0 });
gsap.set("#dim", { opacity: 0.35 });
gsap.set("#hbiChip", { opacity: 0 });
// "Happy Birthday Paytyn" greets her as soon as the page opens
gsap.from(".hbi-word", { opacity: 0, y: 40, rotationX: -80, stagger: 0.18, duration: 0.9, ease: "back.out(1.8)", delay: 0.3 });
gsap.from(".hbi-name .l", { opacity: 0, scale: 0, rotation: () => rand(-60, 60), stagger: 0.08, duration: 0.6, ease: "back.out(3)", delay: 0.9 });
// the birthday video starts out filling the background, faintly, behind the intro
gsap.set("#screen", { ...screenBoxes().cover, opacity: 0.22 });

/* ---------- poker chips: tossed like a dealer's flourish */
const CHIP_COLORS = [["#13294b", "#7bafd4"], ["#7bafd4", "#13294b"], ["#c8102e", "#ffffff"], ["#ffffff", "#7bafd4"], ["#0b1a33", "#f3d27a"]];
function makeChip(size, k, label = "") {
  const [c, c2] = CHIP_COLORS[k % CHIP_COLORS.length];
  const el = document.createElement("div");
  el.className = "chip toss-chip";
  el.style.setProperty("--s", size + "px"); el.style.setProperty("--c", c); el.style.setProperty("--c2", c2);
  el.innerHTML = `<span class="chip-face">${label}</span>`;
  document.body.appendChild(el);
  return el;
}
// burst of chips from a point (fractions of the screen)
function chipBurst(fx, fy, n = 14, size = 46) {
  for (let i = 0; i < n; i++) {
    const el = makeChip(size * rand(0.7, 1.1), i);
    const x0 = innerWidth * fx - size / 2, y0 = innerHeight * fy - size / 2;
    const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05), sp = rand(innerHeight * 0.25, innerHeight * 0.55);
    gsap.set(el, { x: x0, y: y0, rotation: rand(0, 360) });
    gsap.to(el, { x: x0 + Math.cos(ang) * sp * 0.8, duration: 1.6, ease: "power1.out" });
    gsap.to(el, { y: y0 + Math.sin(ang) * sp, duration: 0.6, ease: "power2.out", onComplete: () =>
      gsap.to(el, { y: innerHeight + 80, duration: 1.1, ease: "power2.in", onComplete: () => el.remove() }) });
    gsap.to(el, { rotation: "+=" + rand(360, 900), rotationX: rand(0, 720), duration: 1.7, ease: "none" });
  }
}
// a couple of chips slide across with each photo, like bets on the table
function chipSlide(fromLeft) {
  for (let i = 0; i < 3; i++) {
    const el = makeChip(34, Math.floor(rand(0, 5)));
    const y = innerHeight * rand(0.78, 0.9);
    gsap.fromTo(el, { x: fromLeft ? -60 : innerWidth + 20, y, rotation: 0 },
      { x: fromLeft ? innerWidth + 20 : -60, rotation: fromLeft ? 720 : -720, duration: 1.6, delay: i * 0.12, ease: "power2.inOut", onComplete: () => el.remove() });
  }
}

/* ---------- photos are dealt onto the table like cards */
function photoRun(tl, els, t0) {
  els.forEach((el, i) => {
    const t = t0 + i * STEP, side = i % 2 ? 1 : -1;
    tl.fromTo(el, { opacity: 0, x: innerWidth * 0.75 * -side, y: -innerHeight * 0.55, rotation: side * 35, scale: 0.55 },
      { opacity: 1, x: 0, y: 0, rotation: rand(-4, 4), scale: 1, duration: 0.85, ease: "back.out(1.3)" }, t);
    tl.fromTo(el.querySelector("img"), { scale: 1 }, { scale: 1.07, duration: STEP + 0.6, ease: "none" }, t);
    tl.call(() => chipSlide(side > 0), null, t + 0.3);
    if (i > 0) {
      const prev = els[i - 1];
      tl.to(prev, { x: side * innerWidth * 0.32, y: -innerHeight * 0.3 + rand(-16, 16), scale: 0.36, rotation: side * rand(8, 16), opacity: 0.55, duration: 0.8, ease: "power2.inOut" }, t);
    }
    if (i > 2) tl.to(els[i - 3], { opacity: 0, duration: 0.5 }, t);
  });
  const end = t0 + els.length * STEP;
  tl.to(els, { opacity: 0, scale: 0.3, y: -innerHeight * 0.5, stagger: 0.05, duration: 0.6, ease: "power2.in" }, end - 0.3);
  return end + 0.4;
}

function screenBoxes() {
  // the video card sits just under the "Happy Birthday" title block
  const hb = $("#hbIntro").getBoundingClientRect();
  const room = innerHeight * 0.95 - (hb.bottom + 16);
  let cw = Math.min(innerWidth * 0.88, 560), ch = cw * 9 / 16;
  if (ch > room) { ch = Math.max(room, innerHeight * 0.18); cw = ch * 16 / 9; }
  const vw = Math.max(innerWidth, innerHeight * 16 / 9), vh = vw * 9 / 16;
  return {
    card: { left: (innerWidth - cw) / 2, top: Math.min(hb.bottom + 16, innerHeight * 0.95 - ch), width: cw, height: ch, borderRadius: 16 },
    cover: { left: (innerWidth - vw) / 2, top: (innerHeight - vh) / 2, width: vw, height: vh, borderRadius: 0 },
  };
}

function buildShow() {
  tl = gsap.timeline({ paused: true });

  // --- the chip is dealt: it spins, chips burst everywhere, the bottom card clears
  tl.to("#startBtn", { scale: 1.3, rotation: 720, duration: 0.8, ease: "power2.out" }, 0);
  tl.to("#startBtn", { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.8);
  tl.call(() => { $("#tapText").textContent = "here we go…"; }, null, 0.05);
  tl.call(() => chipBurst(0.5, 0.78, 18, 50), null, 0.85);
  tl.to([".intro-bottom", ".volume"], { opacity: 0, y: 30, duration: 0.5 }, 1.0);
  tl.set("#intro", { autoAlpha: 0 }, 1.6);

  // --- the title celebrates: the 21 chip drops in under her name
  tl.fromTo("#hbiChip", { y: -innerHeight * 0.6, rotation: -540, opacity: 1 }, { y: 0, rotation: 0, duration: 1.1, ease: "bounce.out" }, 0.9);
  tl.to(".hbi-name .l", { y: -14, stagger: 0.06, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }, 1.4);
  tl.call(() => bigBurst(), null, 1.3);
  tl.fromTo(".balloons", { opacity: 0 }, { opacity: 1, duration: 1.5 }, 1.2);
  tl.to("#skip", { opacity: 1, pointerEvents: "auto", duration: 0.6 }, 1.8);
  tl.fromTo("#ticker", { opacity: 0, yPercent: 100 }, { opacity: 1, yPercent: 0, duration: 0.7, ease: "back.out(1.6)" }, 1.6);

  // --- the pics (the birthday video keeps playing faintly in the background)
  let t = 6.2;
  tl.to("#hbIntro", { autoAlpha: 0, y: -40, duration: 0.6 }, t);
  tl.to("#screen", { opacity: 0.16, duration: 1 }, t);
  t = photoRun(tl, photoEls, t + 0.5);

  // --- CHAPTER III: Zac Brown Band
  tl.addLabel("zbb", t);
  tl.call(() => Mix.toZbb(), null, t - 2.5);
  tl.to(".beam", { opacity: 1, duration: 0.8 }, t - 0.6);
  tl.to(".beam.b1", { rotation: 10, duration: 2.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, t - 0.6);
  tl.to(".beam.b2", { rotation: -10, duration: 2.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, t - 0.6);
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
  tl.to(".beam", { opacity: 0.3, duration: 1 }, t);

  // --- FINALE: dusk falls over Cherokee
  tl.addLabel("finale", t);
  tl.to("#screen", { opacity: 0.1, duration: 1 }, t);
  tl.to("#dim", { opacity: 0, duration: 1 }, t);
  tl.to("#skip", { opacity: 0, pointerEvents: "none", duration: 0.3 }, t);
  tl.to("#finale", { autoAlpha: 1, duration: 0.6 }, t);
  tl.to(Scene.state, { night: 1, duration: 3, ease: "power1.inOut" }, t);
  tl.to("#night", { opacity: 1, duration: 3, ease: "power1.inOut" }, t);
  tl.to(".batsignal", { opacity: 0.6, duration: 2.5 }, t + 2.2);
  tl.from(".hb-1", { y: -80, opacity: 0, duration: 0.7, ease: "bounce.out" }, t + 0.1);
  tl.from(".hb-name .l", { scale: 0, rotation: () => rand(-90, 90), opacity: 0, stagger: 0.09, duration: 0.6, ease: "back.out(3)" }, t + 0.6);
  tl.call(() => bigBurst(), null, t + 1.2);
  tl.from("#cake", { y: 120, opacity: 0, duration: 0.8, ease: "back.out(1.4)" }, t + 1.4);
  tl.call(() => blowCandles(), null, t + 2.6);
  tl.call(() => showCredits(), null, t + 3.3);
  return tl;
}

// split "Paytyn" into letters for the pop-in
$(".hb-name").innerHTML = [..."Paytyn"].map((c) => `<span class="l">${c}</span>`).join("");
$(".hbi-name").innerHTML = [..."Paytyn"].map((c) => `<span class="l">${c}</span>`).join("");

// candles go out one by one with a little smoke
let blown = false;
function blowCandles() {
  if (blown) return;
  blown = true;
  document.querySelectorAll("#cake .candle").forEach((c, i) => setTimeout(() => {
    c.classList.add("out");
    const smoke = document.createElement("i"); smoke.className = "smoke"; c.appendChild(smoke);
    gsap.fromTo(smoke, { opacity: 0.7, y: 0, scale: 0.6 }, { opacity: 0, y: -40, scale: 1.8, duration: 1.6, ease: "power1.out", onComplete: () => smoke.remove() });
  }, i * 110));
  setTimeout(() => bigBurst(), 500);
}

let creditsShown = false;
function showCredits() {
  if (creditsShown) return;
  creditsShown = true;
  gsap.fromTo("#message", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9 });
  gsap.fromTo("#credits", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.3 });
  gsap.to("#signoff", { opacity: 1, duration: 0.8, delay: 2.1 });
  gsap.to(".end-btns", { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 2.8 });
  setTimeout(() => { rainChips(); chipBurst(0.5, 0.95, 16, 48); }, 1400);
}

/* ------------------------------------------------------------------ INTERACTIONS */
let started = false;
$("#startBtn").addEventListener("click", () => {
  if (started) return;
  started = true;
  Mix.start();
  $("#startBtn").style.animation = "none";
  buildShow().play(0);
});

$("#soundPill").addEventListener("click", () => { Mix.resume(); $("#soundPill").style.display = "none"; });

$("#skip").addEventListener("click", () => { Mix.toZbb(); tl.seek("finale"); });

$("#cake").addEventListener("click", blowCandles);

$("#replay").addEventListener("click", () => {
  creditsShown = false; blown = false;
  gsap.set(["#message", "#credits", "#signoff"], { opacity: 0 });
  gsap.set(".end-btns", { opacity: 0, pointerEvents: "none" });
  document.querySelectorAll("#cake .candle").forEach((c) => c.classList.remove("out"));
  $("#tapText").textContent = "tap the chip to start";
  Mix.restart();
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
    b.innerHTML = `<img src="${p.src}" alt="" loading="lazy">`;
    b.onclick = () => { const lb = $("#lightbox"); lb.querySelector("img").src = p.src; lb.hidden = false; };
    grid.appendChild(b);
  });
  $("#wallBtn").onclick = () => { $("#wall").hidden = false; };
  $("#wallClose").onclick = () => { $("#wall").hidden = true; };
  $("#lightbox").onclick = () => { $("#lightbox").hidden = true; };
})();
