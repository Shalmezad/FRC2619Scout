# AGENTS.md

## Project

Charge robotics team scouting app for the 2027 FRC season. Goal: **simple** offline-first
collection of match data (balls scored, robot broke down, climbed, notes) on Android + iOS,
with **QR-code transfer** from scout phones to a scouting lead's phone and **CSV/Excel export**
for consolidation. No network at venues is the normal case.

## Status

- Research phase done → see `docs/README.md` for index + executive summary.
- Prototype phase: offline-first PWA in `app/` (static files, no build step).

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
- Regenerate PWA icons: see the PIL snippet in git history (or `docs/04-prototype.md`).

## Data format (v1)

Record stored in `localStorage['charge-scout-records-v1']`:
`{ id, match, team, pos (R1–B3), balls, broke (bool), climb (bool), notes, ts }`.
QR payload = compact JSON `{v:1, i, m, t, p, b, d, c, n, s}` (short keys; `i` = short id).
CSV columns: `match, team, position, balls_scored, broke_down, climbed, notes, timestamp, id`.
