# Base44 Analysis — What It Is, What It Costs, What "Standalone App" Means

Researched: 2026-11-19. Sources: base44.com/pricing, docs.base44.com, third-party tutorials
(mark as such), all linked inline.

---

## 1. What Base44 is

- An **AI "vibe coding" / no-code platform** (acquired by **Wix**, April 2025). You describe the
  app in plain language; it generates a **web app** (HTML/CSS/JS) with an **integrated backend:
  database, auth, storage, analytics** — all hosted on Base44's servers.
- Official FAQ (base44.com/pricing): *"The apps run on real production infrastructure… publish to
  the web."*
- In other words: Base44 = **web app builder + hosted backend as a service**. It does **not**
  generate native Android/iOS code (Kotlin/Swift). Their own docs confirm the output is a web app
  with PWA features.

## 2. Current pricing (base44.com/pricing, fetched 2026-11-19)

Annual billing (monthly billing ≈ 20% higher):

| Plan | Price (annual) | Message credits/mo | Notes |
|------|---------------:|--------------------:|-------|
| Free | $0 | 25 | Preview only — no publishing/custom domain; up to 5 apps. |
| Starter | $16/mo | 100 | Personal/early-stage; no GitHub integration. |
| **Builder** | **$40/mo** | 250 | "Popular"; **GitHub sync + code download** appear here. |
| Pro | $80/mo | 500 | Complex apps, domains, premium support. |
| Elite | $160/mo | 1,200 | Heavy use. |

- **Ongoing cost reality:** a working, published team app needs a paid plan **every month,
  indefinitely** — the app's backend/auth/db *is* Base44's cloud. Cancel subscription ⇒ app stops
  working for the team.
- Third-party cost guides (youware.com blog) estimate serious team use at **$150–250/mo** once
  you need multiple apps/heavier usage — treat as anecdotal, but expect usage-based pressure.
- Store fees are **separate** (Apple/Google), plus any wrapping service.

## 3. The big question: "web-based → standalone, no-network Android/iOS app"

### What Base44's "Download" actually gives you

- Base44 docs (docs.base44.com → Mobile experience): on Builder plan+ you can **sync code to
  GitHub / download a ZIP**, then use **third-party wrappers** (Capacitor, PWABuilder, TWA) to
  package it for the stores. *"These wrappers are managed outside of Base44, and any native-only
  features… must be set up separately. Your exported code still uses Base44 for your data,
  logins, and integrations."*
- Paid plans can generate **IPA/AAB** files — but these are the web app inside a **WebView
  shell**, not a native app.
- Third-party tutorial (newly.app, paraphrasing a common concern): Apple may **reject** pure
  WebView wraps under **App Store guideline 4.2** ("minimum functionality"), and users notice the
  non-native feel. Tutorials therefore route through services like AppMySite / Despia /
  AppBuild.diy (all paid, affiliate-marketed — biased sources, but the underlying technical point
  is standard industry knowledge).

### The offline problem — the critical issue for FRC

- Base44's data layer, login, and integrations are **cloud services**. The export contains the
  *screens*, not the backend.
- Offline-analysis sites (e.g. escapebase44.com/base44-offline, a Base44-alternative vendor —
  biased but technically consistent with Base44's own docs) state: with the export, *"every
  sign-in, record and save still goes to Base44's servers, so with no internet nothing works."*
- It **is possible to build** offline behavior (service worker caches the app shell; data queued
  in IndexedDB/localStorage and synced later) — but:
  - You must **explicitly ask for and verify** it; AI-generated "offline mode" often only works
    in preview (with a connection).
  - Browser storage is limited and can be cleared by the OS/browser — risky for a day of match
    data without an export/backup path.
  - QR generation itself is client-side and works offline **if** the page is cached.
- **Bottom line for us:** an offline-first scouting flow is *buildable* on Base44, but it runs
  against the platform's grain (cloud-first), and the offline behavior must be treated as
  unproven until tested in airplane mode on real devices.

### Summary table: Base44 vs. our requirements

| Requirement | Base44 out-of-the-box | Notes |
|---|---|---|
| Works on Android + iOS | ✅ as a web app/PWA (installable to home screen) | One codebase, both stores' browsers. |
| Standalone store app | ⚠️ WebView wrapper only | Extra wrapper step/service; Apple 4.2 rejection risk. |
| **Works with zero network at venue** | ❌ not by default (cloud auth/db) | Must be deliberately built + rigorously tested; fragile. |
| QR → Excel flow | ✅ buildable (client-side JS) | Fine either way. |
| No ongoing cost | ❌ subscription required | $16–40/mo minimum, indefinitely, + store fees. |
| Own the code / leave platform | ⚠️ partial | Export gives screens; backend calls remain Base44's. |
| Team hand-off / student maintenance | ⚠️ | Locked into Base44's editor + billing account. |

## 4. Honest verdict for the Charge team

**Base44 is a fast way to prototype** the *screens* (form, buttons, QR display) and could be a
valid choice **if**:
- you accept an **ongoing subscription** (~$16–40/mo) as a permanent line item,
- you treat **airplane-mode testing as the acceptance test**, and
- you keep a **data export path** (download JSON/CSV daily) so no data lives only in Base44.

**It is a poor fit if** the priority is "no network, no recurring cost, own it outright, hand it
to students to maintain" — which is what this project stated. A plain **offline-first PWA**
(same technology class as QRScout/MergeData/Penn — free to host, works on both platforms, no
subscription) delivers the same user-visible product without the lock-in, and can be wrapped
with Capacitor later **only if** a store listing is actually needed.

## 5. Glossary (terms from the videos that matter)

| Term | Plain meaning |
|---|---|
| **PWA** (Progressive Web App) | A website that can be "installed" to the home screen and cached to work offline. Not an App Store app. |
| **Web app** | Runs in the browser; needs internet unless fully cached. |
| **Native app** | Built in Kotlin/Swift, installed from a store, full device access. |
| **WebView wrapper** | A native shell that just displays your web app (Capacitor, AppMySite…). Looks native-ish; still needs internet for anything server-side. |
| **Capacitor** | Open-source tool (Ionic) that wraps a web app into iOS/Android projects — free, but iOS builds need a **Mac + Apple Developer account**. |
| **AAB / IPA** | Android / iOS installable package files. Having one ≠ being in the store. |
| **Credits** | Base44's usage meter — each AI message/integration action burns credits; heavy usage ⇒ upgrade. |
| **Service worker / IndexedDB** | Browser tech that makes web apps cacheable and offline-storage capable. The mechanism behind "offline mode". |
