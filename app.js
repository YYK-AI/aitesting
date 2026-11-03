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
  ],
  concertCaption: "Zac Brown Band night 🤠🇺🇸",
  // Photos shown on the Zac Brown Band ticket (they cross-fade if there's more than one)
  concertPhotos: ["img/stameys.jpg", "img/zbb-concert.jpg"], // pre-show Stamey's, then the show
  // Real Cherokee nature photos for the backdrop (slow zoom + cross-fade). When this list is empty
  // or the photos fail to load, the illustrated scene is shown instead.
  naturePhotos: [],
  signoff: "— from Yusuf 💙",
  creditsLine: "This is where all my AI credits go to",
  tickerText: "HAPPY 20TH BIRTHDAY PAYTYN  ★  LIVE FROM THE GREAT SMOKY MOUNTAINS  ★  MAY THE ODDS BE EVER IN YOUR FAVOR  ★  ALL IN ON PAYTYN ♠  ★  EST. NOV 3, 2006  ★  GOTHAM'S FINEST LEGO ENGINEER  ★  ",
};

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);


/* ------------------------------------------------------------------ THEATRE DRESSING */
(() => {
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
    el.innerHTML = '<span class="chip-face">AI</span>';
    document.body.appendChild(el);
    gsap.to(el, { y: innerHeight + 120, rotation: rand(-540, 540), duration: rand(2.4, 4.2), delay: rand(0, 1.8), ease: "power1.in", onComplete: () => el.remove() });
  }
}

/* ------------------------------------------------------------------ BUILD PHOTOS */
const allPhotos = [...CONFIG.photosActOne, ...CONFIG.photosActTwo, ...CONFIG.concertPhotos.map((src) => ({ src, cap: CONFIG.concertCaption, sticker: "🤠" }))];

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
const STEP = 2.9;
const ZOOM = 0.84; // how far the camera pulls back from Cherokee
gsap.set("#screen", { xPercent: -50, yPercent: -50, opacity: 0 });
gsap.set("#frame", { opacity: 0 });
gsap.set(".balloons", { opacity: 0 }); // seconds each photo gets the spotlight
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

  // --- INTRO: the chip gets dealt...
  tl.to("#startBtn", { scale: 1.35, rotation: 720, duration: 0.9, ease: "power2.out" }, 0);
  tl.to("#startBtn", { y: -innerHeight, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.9);
  tl.call(() => { $("#tapText").textContent = "here we go…"; }, null, 0.05);
  tl.call(() => pop({ particleCount: 90, spread: 90, origin: { x: 0.5, y: 0.65 }, colors: partyColors }), null, 0.4);
  tl.to(".intro-bottom", { opacity: 0, y: 30, duration: 0.6 }, 1.3);
  tl.to(".intro-top", { opacity: 0, y: -30, duration: 0.7 }, 1.9);
  tl.set("#intro", { autoAlpha: 0 }, 2.7);

  // ...then the camera pulls back and Cherokee becomes the backdrop of the theatre
  let t = 2.4;
  tl.to("#world", { scale: ZOOM, duration: 2.8, ease: "power2.inOut" }, t);
  tl.fromTo("#frame", { scale: 1 / ZOOM, opacity: 0 }, { scale: 1, duration: 2.8, ease: "power2.inOut" }, t);
  tl.to("#frame", { opacity: 1, duration: 1.2, ease: "power1.in" }, t);
  tl.fromTo(".curtain.left", { xPercent: -45 }, { xPercent: -86, duration: 2.4, ease: "power3.inOut" }, t + 0.8);
  tl.fromTo(".curtain.right", { xPercent: 45 }, { xPercent: 86, duration: 2.4, ease: "power3.inOut" }, t + 0.8);
  tl.fromTo(".balloons", { opacity: 0 }, { opacity: 1, duration: 1.5 }, t + 2);
  tl.to("#skip", { opacity: 1, pointerEvents: "auto", duration: 0.4 }, t + 2.8);
  tl.call(() => VO.play("intro"), null, t + 1.6);

  // the movie screen drops in front of the mountains and the birthday video plays
  t += 2.6;
  tl.fromTo("#screen", { y: -innerHeight, opacity: 1 }, { y: 0, duration: 1.1, ease: "bounce.out" }, t);
  tl.call(() => pop({ particleCount: 60, spread: 120, origin: { x: 0.5, y: 0.3 }, colors: partyColors }), null, t + 1);
  tl.fromTo("#nowshowing", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, t + 1.1);

  // ...then it dims so the pics take the stage (song keeps playing)
  t += 5.4;
  tl.to("#nowshowing", { opacity: 0, duration: 0.5 }, t);
  tl.to("#screen", { opacity: 0.18, duration: 1.6 }, t);
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
  tl.to(Scene.state, { night: 1, duration: 3, ease: "power1.inOut" }, t);
  tl.to("#night", { opacity: 1, duration: 3, ease: "power1.inOut" }, t);
  tl.to(".batsignal", { opacity: 0.6, duration: 2.5 }, t + 2.2);
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
  gsap.to("#odds", { opacity: 1, duration: 0.8, delay: 1.0 });
  gsap.to("#signoff", { opacity: 1, duration: 0.8, delay: 1.6 });
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
  gsap.set(["#credits", "#signoff", "#odds"], { opacity: 0 });
  gsap.set(".end-btns", { opacity: 0, pointerEvents: "none" });
  $("#cake").classList.remove("out");
  $("#wish").textContent = "tap the candles & make a wish ✨";
  $("#tapText").textContent = "tap the chip to start";
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
