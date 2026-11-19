# Existing FRC Scouting Apps — How They're Built, Limitations

Researched: 2026-11-19. Sources linked inline.

## Why this matters

The Charge team wants "simple data collection" (balls scored, breakdown, climb, …) with QR
transfer to Excel. Several existing apps already solve this problem. Studying them avoids
reinventing wheels and reveals what "simple" actually requires at a noisy, offline venue.

---

## 1. Lovat (FRC 8033 Highlander Robotics) — the app you cited

- **Site:** https://lovat.app · **Docs:** https://learn.lovat.app
- **Scale:** 850+ registered teams, 17,000+ users, 230,000+ scout reports (claimed Nov 2026).
- **What it is:** A full scouting/strategy SaaS: scouter app ("Lovat Collection", native app
  listings on both Google Play and App Store) + "Lovat Dashboard" for scouting leads with
  analytics, match prediction, dynamic picklists.
- **How it handles offline** (from official docs):
  - Matches save locally on the scout device first.
  - If upload fails, a **QR code appears** that the scouting lead scans with Lovat Dashboard, or
    the data can be uploaded later from the history page.
  - Timer syncs to the field timer manually (tap play when gates close).
- **Cost:** No public pricing found on lovat.app (no pricing page; "Get Started / Contact").
  Appears available to teams at no cost — **verify directly with team 8033** before budgeting.
- **Relevance:** Proves the offline + QR pattern works at scale, and shows the "too much to
   handle" concern is real — Lovat is a large system (predictions, picklists, auto path
   visualizer). Our goal is the *collection* half only.

## 2. QRScout (FRC 2713) — closest match to your idea

- **Repo:** https://github.com/FRC2713/QRScout (MIT license) · **Live:** https://frc2713.github.io/QRScout/
- **How it works:** Web app → scout fills a form during the match → app outputs a **QR code**
  containing the data (tab-separated) → lead scans it into **Excel / Google Sheets**.
- **Built with:** Plain web app (static site, runs from GitHub Pages — effectively free hosting).
- **Strengths:** Exactly the "simple collection + QR → spreadsheet" flow; zero backend; works
  offline once loaded (static assets cacheable); MIT-licensed so we can fork/learn from it.
- **Limitations (noted by the project itself):**
  - External images must be hosted somewhere reachable at the venue — recommend embedding them.
  - One QR code carries a limited payload (~a few KB), so it's **one match (or one robot) per
    QR scan** — fine for match scouting, not for bulk history export.
  - Consolidation into Excel is a **manual scan-per-match step**.

## 3. MergeData (FRC 2706) — open-source PWA

- **Repo:** https://github.com/FRC2706/MergeData
- **How it works:** PWA; data saved locally; transfer by **QR code scan between devices** or
  upload to a **Google Sheets** spreadsheet.
- **Relevance:** Another free, offline-first reference implementation of the same pattern.

## 4. Penn Robotics 2026 Open Alliance scouting app — explicitly offline-first PWA

- **Write-up:** https://oa.pennrobotics.org/penn-robotics-2026-open-alliance-web-based-scouting-app-prototype
- **How it works:** PWA that "only requires an internet connection the first time you use it";
  objective + subjective forms → QR codes containing **JSON** → scanned by lead; data also
  downloadable as a file on-device.
- **Relevance:** Good template for a free (GitHub Pages hosting) approach and for the JSON-inside-
  QR encoding scheme.

## 5. FRC Krawler (FRC 2052 KnightKrawler) — the native-app data point

- **Site:** https://www.team2052.com/frckrawler · distributed via **Google Play Store** (Android).
- **How it works:** Native Android app; configurable metrics defined once on a "main server
  device"; multiple scout devices **sync over Bluetooth** — no internet at all.
- **Relevance:** Proves a *native* offline app works, and that **Bluetooth sync** is an accepted
  venue-safe transfer method (no WiFi involved). Android-only, though.

## 6. Others surveyed (Chief Delphi / GitHub topics, Nov 2026)

| App | Built with | Transfer | Notes |
|-----|-----------|----------|-------|
| **Scoutradioz** (Gearheads) | TypeScript, runs on **AWS** | cloud | Multi-team; needs internet — venue risk. |
| **KSS** (per Reddit) | — | QR, **audio cables**, JSON files | Creative offline transfer options. |
| **Open Scouting** | Web | offline data mgmt + read API | Rebuilt for 2026; mentions others use local APs. |
| **Obsidianscout** | Python | — | Small project. |
| **blackhawks-scouting** (2834) | Vue | — | Web-based. |
| **That ONE Team app** (4967) | iOS app | — | Free on App Store, team-specific. |

### Common pattern noticed on Chief Delphi
> "Most other scouting systems use QR codes because managing scouting while offline at comps.
> Some use a microcontroller or raspberry pi to create a local offline network for scouting access."

---

## Takeaways for our prototype

1. **QR codes are the industry-standard offline transfer** for FRC scouting — our Excel idea is
   exactly what the ecosystem does (QRScout already does "QR → Excel" literally).
2. **Offline-first is non-negotiable**: every serious app stores data locally and treats network
   upload as best-effort.
3. **Web app (PWA) is the dominant architecture** — it runs on both Android and iOS with one
   codebase, installs to the home screen, and can be hosted for free. Native (Krawler) is the
   exception.
4. **Data volume per match is small** (one robot, ~10–30 fields) → fits easily in one QR code;
   no need for any server during matches.
5. **A server/cloud is only needed for convenience** (live dashboards), not for collection or
   consolidation. We can start with zero backend.

## Limitations to keep in mind (any architecture)

- QR payload size limits → one record per scan; scan errors need validation/undo.
- Manual consolidation step (scan → sheet) is inherently manual; mitigate with a "scan all
  pending" batch screen for the lead.
- Browser storage can be cleared → provide export/backup (download JSON/CSV) after each day.
- Venue lighting/angle can make QR scanning flaky → large codes, high contrast, retry UI.
