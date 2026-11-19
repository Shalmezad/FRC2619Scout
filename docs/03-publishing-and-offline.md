# Publishing & Venue Constraints — Developer Accounts, Stores, and FRC Network Rules

Researched: 2026-11-19. Sources inline.

---

## 1. Developer accounts & fees (as of late 2026)

| | **Google Play (Android)** | **Apple App Store (iOS)** |
|---|---|---|
| Account fee | **$25 one-time** | **$99 / year** (Apple Developer Program) |
| Identity check | Identity verification required (photo ID possible) | Apple ID + 2FA; org enrollment needs **D-U-N-S number**; **educational institutions can get a fee waiver** |
| New-account release rule | New **personal** accounts: **closed test with 12 testers for 14 days** before production | No required pre-release test |
| Commission on a **free app** | **None** (fees only on paid apps / in-app purchases) | **None** |
| Recurring cost | None after $25 | $99 every year |

Sources: Apple official enrollment/help pages; Google Play Console fee docs; aggregator
(snappai.co "Cost to publish an app 2026", draftbit.com FAQ) — numbers agreed across sources.

### Alternatives to "publishing" (important for a team-internal app)

- **Android sideload:** distribute an APK file directly (USB, link, QR). No store, no $25, no
  review. (Users must enable "install unknown apps".)
- **iOS without $99/yr:** free Apple ID allows **device-signed installs that expire after 7 days**
  (re-sign weekly with a Mac + Xcode). TestFlight also requires the paid account. → **Practical
  reality: meaningful iOS distribution costs $99/yr** unless it's a PWA.
- **PWA (home-screen install):** no store, no account, no fee, works on **both** platforms.
  Limitation: iOS home-screen PWAs are less "native" (no App Store discovery, some API limits),
  and Apple requires a store listing for full push notifications — irrelevant for us.

**Cost scenarios for our app (free, team-internal):**

| Route | Cost |
|---|---|
| PWA only (install to home screen) | **$0** |
| Android APK sideload | **$0** |
| Android on Play Store | **$25** once (+14-day test for new personal accounts) |
| iOS on App Store | **$99/yr** (+ Mac to build; or a wrapping service's subscription) |
| Base44 + stores (for comparison) | **$16–40/mo + $99/yr + $25 + wrapper costs** |

## 2. Venue network reality at FRC events

### Rules (2026 Game Manual, Section 14 Event Rules)

- **E301 "No wireless communication" / E302 "Don't interfere with wireless networks":**
  participants may not interfere with, or attempt to connect to, any other team's or FIRST's
  wireless communication — except to control **their own robot** on the field.
- Community interpretation (Chief Delphi, r/FRC): the manual targets **hotspots**; hosting your
  own AP is a gray area but discouraged historically because *"WiFi bandwidth is a limited shared
  resource"* and thousands of people share the venue airwaves.
- The FRC **field/pit network is 10.x.x.x and robot-oriented** (WPILib docs) — it is not a
  general-internet network for scouting laptops.

### Practical conditions

- **Venue WiFi:** shared, heavily congested (thousands of spectators + teams), often captive-
  portal'd or unavailable in stands.
- **Cellular:** all spectators' phones + streaming ⇒ congested during matches exactly when we
  need it.
- **Consensus from scouting teams (Chief Delphi 2026):** *"Most other scouting systems use QR
  codes because managing scouting while offline at comps."* Others run a **local Raspberry Pi/
  microcontroller network** (gray area) or use **Bluetooth sync** (FRC Krawler — no internet
  involved).

### Design conclusion

> **Assume: zero reliable network during matches.**
> 1. All data entry + storage **on-device** (works in airplane mode — this is the acceptance test).
> 2. Transfer between devices via **QR code scan** (rules-safe, proven by Lovat/QRScout/MergeData)
>    — fits the existing "QR → Excel" idea perfectly.
> 3. Optional later: Bluetooth/local-AP sync as an enhancement, after checking event rules for
>    the specific 2027 season.
> 4. Cloud upload (if ever wanted) is a **when-online bonus**, never a requirement.

## 3. Publishing workflow notes (if we later want store listings)

- **Android/Play:** Google Play Console ($25) → create app → upload AAB → (new personal
  accounts) closed test 14 days / 12 testers → production listing. Free app, no payments setup.
- **iOS/App Store:** Apple Developer Program ($99/yr, D-U-N-S for org, educational waiver
  available) → Mac + Xcode (or a CI/wrapper service) → App Store Connect → review (Apple's
  guideline **4.2** can reject pure WebView shells — a PWA-based app should present real value;
  a scouting tool with offline storage/QR camera use generally qualifies, but expect scrutiny).
- **Team account governance:** the developer accounts should be registered to the **team's**
  organization (not a student's personal account) so membership survives graduation — set this up
  before enrolling.
