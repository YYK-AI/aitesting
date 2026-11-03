# 🎂 The Paytyn Show

A ~1 minute animated birthday site for Paytyn's 20th (Nov 3, 2006). Scan `qr-code.png` to open it.

**The show:** pixel-art Cherokee, NC (Smoky Mountains, river, elk, casino with poker chips) → tap the chip →
theatre curtains open and the "Happy Birthday Peyton" song plays on the stage screen, then dims →
Act I (outdoor pics) → Act II (squad pics) → Act III: Zac Brown Band (music switches to *Chicken Fried*) →
finale with a cake to blow out, confetti, falling "AI" chips and the AI-credits line. Replay + photo wall at the end.

## Put it online (GitHub Pages)
1. Repo **Settings → General → Danger Zone → Change visibility → Public** (Pages on private repos needs a paid plan).
2. **Settings → Pages → Build and deployment → Deploy from a branch** → pick this branch, folder `/ (root)` → Save.
3. After a minute or two it's live at **https://yyk-ai.github.io/aitesting/**, the URL inside `qr-code.png`.

## Tweaks
- Songs, start times, captions, ticker text: the `CONFIG` block at the top of `app.js`.
- Voice-overs: drop ElevenLabs mp3s into `audio/` (see `audio/README.md`).
