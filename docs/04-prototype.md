# Prototype — Charge Scout PWA (v1)

Status: **working prototype, tested 2026-11-19** (see test results below).
Location: `app/` — plain HTML/CSS/JS, no build step, fully offline.

![Scout view](screenshots/scout-view.png)
![Lead view](screenshots/lead-view.png)

## What it does

**Scout tab (data entry, during the match):**
1. Enter match #, team #, position (R1–B3), balls scored (big −/+ steppers),
   broke down? / climbed? toggles, optional notes.
2. **Save & show QR** → record is stored on the device and a QR code appears.
3. Match # auto-advances, team/notes clear for the next entry.
4. History list shows everything saved on the device; each row can re-show its QR or delete.
   Export CSV / Backup JSON for end-of-day safety.

**Lead tab (consolidation):**
1. **Start scanning** → rear camera scans scouts' QR codes continuously (duplicates ignored
   within 3 s; records deduped by id forever).
2. Fallback: paste the QR text manually (works when camera is unavailable).
3. **Export CSV (Excel)** → one file, all records, sorted by match then team, UTF-8 BOM so
   Excel opens it correctly, proper quoting for notes containing commas/quotes.
4. Export JSON / Clear all (with confirmation).

Both tabs live on the same device — the lead's phone is also a fine place to enter data
(single-scout workflow), and the two lists are the same underlying storage.

## Architecture decisions

| Decision | Choice | Why |
|---|---|---|
| App type | PWA (installable, service-worker cached) | One codebase for Android + iOS; $0; no store accounts; can be wrapped for stores later |
| Storage | `localStorage['charge-scout-records-v1']` | A day of matches is a few KB; no backend needed |
| QR transfer | compact JSON `{v:1,i,m,t,p,b,d,c,n,s}` | ~120–250 bytes/record → one scan per robot, robust at distance |
| QR libs | `qrcode-generator` + `jsQR`, **vendored** in `app/vendor/` | Zero network at venue; jsQR also powers the lead's camera scanner |
| CSV | RFC-4180-ish + UTF-8 BOM, `\r\n` | Opens cleanly in Excel/Sheets |
| Backend | none | Collection must never depend on a server (venue rules + congestion, see docs/03) |

## How to run

```bash
# from repo root — camera needs localhost or HTTPS
python3 -m http.server 8080 -d app
# open http://localhost:8080
```

To try on phones: host the `app/` folder on any HTTPS static host (GitHub Pages is free) —
that gives you a link the team can open and "Add to Home Screen" on both platforms.
Camera scanning requires HTTPS (browser rule), not the app itself.

## Test results (Playwright, 2026-11-19)

| Test | Result |
|---|---|
| Page loads, zero console errors | ✅ |
| Form save → record in localStorage (incl. notes with quotes + comma) | ✅ |
| **QR roundtrip**: canvas → jsQR decode → exact record match | ✅ |
| Match auto-advance / team clear after save | ✅ |
| Lead ingest via QR text, count updates | ✅ |
| Duplicate scan deduped (no double-add) | ✅ |
| Garbage input rejected | ✅ |
| CSV: BOM, correct escaping, sorted rows | ✅ |
| **Offline acceptance test**: context set offline → full reload → app shell from SW cache, data intact, QR renders + decodes | ✅ |
| Service worker registered | ✅ |

Not yet tested on real phones (iOS Safari / Android Chrome) — **next step**.
Camera scanning path (`getUserMedia` + jsQR loop) is implemented but can only be
fully verified on a real device.

## Known limitations / next steps

- [ ] Real-device pass: iPhone (Safari "Add to Home Screen") + Android (Chrome install),
      camera scan test in good and bad lighting.
- [ ] Game-specific fields for 2027 (this season's game manual doesn't exist yet) — decide
      whether to hard-code or make configurable (see docs/README.md open questions).
- [ ] Optional: scout name/assignment field so the lead knows who submitted what.
- [ ] Optional: batch "scan next match" flow / sound on successful scan (currently vibration).
- [ ] Optional store packaging (Capacitor) **only if** the team wants App Store icons —
      requires Apple Developer account ($99/yr; educational waiver possible) — see docs/03.
