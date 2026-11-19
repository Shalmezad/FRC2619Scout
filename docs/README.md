# FRC 2619 Scouting App — Research & Design Docs

Research started: 2026-11-19
Goal: a **simple** scouting data collection app for the 2027 FRC season (match notes like balls
scored, breakdowns, climbs), usable on Android **and** iOS, working **offline at venues**, with a
way to consolidate data (e.g. QR → Excel).

## Documents

| Doc | Contents |
|-----|----------|
| [01-existing-apps.md](01-existing-apps.md) | Landscape of existing FRC scouting apps (Lovat, QRScout, MergeData, Krawler, …): how they're built, strengths, limitations. |
| [02-base44-analysis.md](02-base44-analysis.md) | What Base44 actually is, current pricing (Nov 2026), what "web → standalone app" really means, offline behavior, lock-in/cost risks. |
| [03-publishing-and-offline.md](03-publishing-and-offline.md) | App Store / Play Store developer accounts & fees, alternatives to publishing, and FRC venue network realities (why offline-first is mandatory). |
| [04-prototype.md](04-prototype.md) | The working PWA prototype in `app/`: features, architecture decisions, test results, next steps. |

## Executive summary (TL;DR)

1. **Existing apps validate the concept.** QR-based, offline-first scouting is the established
   pattern (Lovat, QRScout, MergeData, Penn Robotics all do it). QRScout (MIT-licensed) is close
   to the proposed feature set and is a useful reference/starting point.
2. **Base44 builds web apps, not native apps.** "Download / export iOS+Android" wraps the web app
   in a WebView shell. That can work, but (a) Apple sometimes rejects pure web-wraps (guideline
   4.2), (b) Base44's data/auth live on Base44's servers, so **an unmodified Base44 app does not
   work without internet**, and (c) an ongoing subscription is required to keep it alive.
   Details & current pricing: [02-base44-analysis.md](02-base44-analysis.md).
3. **Venue network reality:** FRC event rules restrict personal wireless hotspots/networks
   (E302), venue WiFi is heavily congested, and the team field network (10.x) is robot-only.
   **Assume zero internet during matches.** Design: all data entry + storage local, transfer via
   QR codes (the safe, rules-compliant, widely used path). See
   [03-publishing-and-offline.md](03-publishing-and-offline.md).
4. **Store publishing costs (2026):** Google Play = **$25 one-time** (+ new-account 14-day closed
   test); Apple = **$99/year** (waivable for accredited educational institutions). A free app pays
   no store commission. You can also **skip the stores**: Android sideloads APKs freely; iOS
   without a paid account only allows 7-day device-signed installs; a PWA added to the home screen
   needs no store or fee at all.
5. **Cost comparison (indicative):**
   - Base44: $0 (preview only) → **$16–40/mo** realistic for a working team app, forever, plus
     store fees if publishing, plus a wrapper tool/service.
   - Open-source/self-built (e.g. PWA based on QRScout): ~$0–25 + $99/yr if iOS store wanted.

## Open questions

- [ ] Prototype scope: pure offline PWA first, or target store-installable from day one?
- [ ] Data model: which fields? (balls scored, climb, breakdown, notes, …) One scout per robot?
- [ ] Consolidation target: Excel (.xlsx download), Google Sheets, or a small local database?
- [ ] Who maintains it after the season (students? mentors?) — affects framework choice.
