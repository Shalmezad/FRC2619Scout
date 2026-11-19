# AGENTS.md

## Project

Charge robotics team scouting app for the 2027 FRC season. Goal: **simple** offline-first
collection of match data (balls scored, robot broke down, climbed, notes) on Android + iOS,
with **QR-code transfer** from scout phones to a scouting lead's phone and **CSV/Excel export**
for consolidation. No network at venues is the normal case.

## Status

- Research phase done → see `docs/README.md` for index + executive summary.
- **Prototype v1 works and is tested** (offline acceptance test passed; see `docs/04-prototype.md`
  for the test matrix and next steps). Not yet tried on real phones.
- **Deployed**: https://shalmezad.com/FRC2619Scout/index.html (live E2E + offline reload verified
  against this URL on 2026-11-19).
- Next: real-device testing (iOS Safari + Android Chrome), then 2027 game-specific fields.

## Repository layout

- `docs/` — research & design documents. Index: `docs/README.md`.
- `app/` — the PWA prototype.
  - `index.html`, `styles.css`, `app.js` — plain HTML/CSS/JS, **no build step**.
  - `vendor/` — vendored libraries (`qrcode-generator`, `jsQR`). Never link a CDN;
    everything must work with zero network.
  - `sw.js` — service worker (offline app-shell cache), `manifest.webmanifest` — install metadata.
  - `icon-*.png` — generated PWA icons.

## Rules for agents working in this repo

1. **Update this AGENTS.md as you work.** When a decision changes (architecture, data format,
   conventions, useful commands), record it here in the same change.
2. **Commit as you go.** Make small, focused commits after each meaningful step; write clear
   commit messages. Do not leave long stretches of work uncommitted.
3. **Offline is the acceptance test.** The app must work in airplane mode after first load:
   no CDN assets, no required network calls, data in `localStorage`, transfer via QR only.
4. Keep the prototype simple: plain HTML/CSS/JS, no framework, no bundler, no npm.
5. Mobile-first UI with large touch targets — it's used live in noisy stands.

## Useful commands

- Serve locally (HTTPS or localhost required for camera): `python3 -m http.server 8080 -d app`
- **Deploy**: `SCOUT_BUCKET=s3://… ./deploy.sh` → uploads `app/` to
  `$SCOUT_BUCKET/FRC2619Scout/` with explicit content types and invalidates CloudFront.
  (The bucket name and distribution ID are not stored in this repo — it's public.
  `deploy.sh` takes the bucket from `$SCOUT_BUCKET` and discovers the distribution
  by its domain alias.) Live URL:
  **https://shalmezad.com/FRC2619Scout/index.html**
- Regenerate PWA icons: see the PIL snippet in git history (or `docs/04-prototype.md`).

## Deployment notes

- The S3 bucket behind the site is **private** (CloudFront OAI only) — never make it public.
  Bucket name and CloudFront distribution ID are intentionally absent from this repo:
  set `$SCOUT_BUCKET` when deploying; the distribution is auto-discovered by its
  `shalmezad.com` alias.
- **The canonical URL is `/FRC2619Scout/index.html`.** The bare directory URL
  `/FRC2619Scout/` serves the *root site's* SPA 404 page (CloudFront error handling) — not our
  app. The manifest `start_url` already points at `./index.html`.
- Content types are set explicitly on upload (S3's auto-detection mislabels
  `.webmanifest`, which can break PWA install).
- Shell files (`index.html`, `styles.css`, `app.js`, `manifest`, `sw.js`) are `no-cache` and the
  service worker uses stale-while-revalidate for them → app updates go live without users being
  stuck on an old build. **Vendor libs and icons are cache-first: if you change them, bump
  `CACHE` in `app/sw.js`.**
- Test after deploying: load the URL, save a record, then DevTools → Network → Offline → reload
  (must still work — that's the venue acceptance test).
- **After a deploy, existing devices show the old build on their first load** (the service
  worker serves cache-first and revalidates in the background) — the new build appears on the
  second load. Don't panic if a fix seems missing; reload.

## Data format (v1)

Record stored in `localStorage['charge-scout-records-v1']`:
`{ id, match, team, pos (R1–B3), balls, broke (bool), climb (bool), notes, ts }`.
QR payload = compact JSON `{v:1, i, m, t, p, b, d, c, n, s}` (short keys; `i` = short id).
CSV columns: `match, team, position, balls_scored, broke_down, climbed, notes, timestamp, id`.
