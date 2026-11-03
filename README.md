# 🎂 The Paytyn Show

A ~1 minute animated birthday site for Paytyn's 20th (Nov 3, 2006). Scan `qr-code.png` to open it.

**The show (made for a phone held upright):** see the CONFIG block in app.js for songs, captions and photos.
Mingo Falls, the Oconaluftee River, elk in the meadow, rhododendron — with a "volume up" prompt and a poker chip to tap →
the camera pulls back and Cherokee becomes the backdrop of the Mountainside Theatre stage; the "Happy Birthday Peyton" song plays
on a screen that drops in, then dims → Act I (outdoor pics) → Act II (squad pics) → Act III: Zac Brown Band (*Chicken Fried* from the chorus) →
dusk falls for the finale: cake to blow out, fireflies, a faint bat-signal, falling "AI" chips, the AI-credits line, "may the odds be ever
in your favor", a mockingjay pin and "— from Yusuf". Replay + photo wall at the end. Colors: Carolina blue + navy.

## Put it online (GitHub Pages)
1. Repo **Settings → General → Danger Zone → Change visibility → Public** (Pages on private repos needs a paid plan).
2. **Settings → Pages → Build and deployment → Deploy from a branch** → pick this branch, folder `/ (root)` → Save.
3. After a minute or two it's live at **https://yyk-ai.github.io/aitesting/**, the URL inside `qr-code.png`.

## Tweaks
- Songs, volumes, photos, chapter titles, the final message and ticker text: the `CONFIG` block at the top of `app.js`.
- Media: `media/birthday.mp4` (the birthday song video, plays in the background from the start) and `media/chicken-fried.mp3`
  (layered in from the Zac Brown Band chapter).
