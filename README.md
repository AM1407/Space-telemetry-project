# 🚀 Space Telemetry Project — ISS UPA Dashboard

```
                       *     .        *       .
            .     *         ___
                           /   \        .
              .      *    | ISS |   *
          *               |\___/|
                     .    |     |       .
                         /|     |\
               *        / |     | \        *
              .        /  |     |  \   .
                      /   |     |   \
           .    *    /    |     |    \      .
                    /     |     |     \
                   /      |     |      \
        .         /       |     |       \  *
                 /________|     |________\
                |    /    |     |    \    |
                |   /     |     |     \   |
                |  /      |     |      \  |
                | /       |_____|       \ |
                |/   /^^^|       |^^^   \|
                    / () |  /^\  | () \
                   /_____|/   \/|_____\
                         | MCC-H|
                         |______|
                          |    |
                         /|    |\
                        / |    | \
                       /  |    |  \
                     _/   |    |   \_
                    / \   |    |   / \
                   /   \  |    |  /   \
                  /     \ |    | /     \
                 /_______\|    |/_______\
                      |   \    /   |
                      |    \  /    |
                      |     \/     |
                     /\     /\     /\
                    /  \   /  \   /  \
                   / /\ \ / /\ \ / /\ \
                  |_|  |_|_|  |_|_|  |_|
                 {____}{____}{____}{____}
                   ||    ||    ||    ||
                  _||_  _||_  _||_  _||_
                 {    }{    }{    }{    }
                  \  /  \  /  \  /  \  /
                   \/    \/    \/    \/
              ______|____|____|____|______
           .-'  ~  ~  ~  ~  ~  ~  ~  ~  '-.
          (  ~  ~  ~  ~ FLAMES ~  ~  ~  ~  )
           '-.__________________________.-'

      H O U S T O N, W E H A V E A P R O B L E M !
```

---

## What Is This?

A **real-time ISS telemetry dashboard** that monitors the Urine Processing Assembly (UPA) aboard the International Space Station. Yes — pee in space. The dashboard pulls live data from NASA's actual telemetry feeds, tracks the ISS position on a map, shows the current crew manifest, and crawls NASA's blog for news.

Built for a PHP school project, it ended up combining four different technologies into one mission-control-style interface.

---

## Live Data Sources

| Data | Source | Tech Used |
|------|--------|-----------|
| **Tank fluid levels** | NASA Lightstreamer (`push.lightstreamer.com/ISSLIVE`) | JS WebSocket client |
| **ISS position** | Open Notify API / Where The ISS At | PHP **cURL** |
| **Crew manifest** | Open Notify Astros API | PHP **Guzzle** (Composer) |
| **NASA news** | NASA Space Station Blog RSS | PHP **DOMDocument/DOMXPath** web crawler |
| **System stats** | Local PHP API (`api.php`) | Static config (extensible to DB) |

The 35% tank reading you see? That's the **real fill level** of the Waste Storage Tank Assembly on the ISS, streamed live from NASA telemetry item `NODE3000005`.

---

## Architecture — Astro Islands

The frontend uses **Astro's Islands architecture** with **Preact** components. Each interactive section is an independently hydrated island, while static content (layout, CSS, section headers) ships as zero-JavaScript HTML.

| Island | Hydration Strategy | What It Does |
|--------|--------------------|--------------|
| `HeaderBar` | `client:load` | UTC clock, connection status, signal indicator |
| `TelemetryPanel` | `client:load` | Tank gauge cards + Lightstreamer WebSocket |
| `EventLog` | `client:load` | Live event log (fed by all islands via nanostores) |
| `StatsPanel` | `client:load` | System summary stats from PHP API |
| `IssMap` | `client:visible` | Leaflet map — only loads when scrolled into view |
| `CrewPanel` | `client:idle` | Crew manifest — loads when browser is idle |
| `NewsPanel` | `client:idle` | NASA news — loads when browser is idle |

Cross-island communication is handled by **nanostores** — lightweight atomic stores that any island can read/write. For example, when the `TelemetryPanel` connects to Lightstreamer and gets a status update, it writes to `$connectionState`, and the `HeaderBar` island instantly reflects the change.

---

## Project Structure

```
├── api/
│   ├── api.php           # Config + stats endpoint (extendable to DB)
│   ├── position.php      # ISS position via cURL (with fallback API)
│   ├── crew.php          # Crew manifest via Guzzle HTTP client
│   └── news.php          # NASA blog RSS crawler via DOMDocument
├── src/
│   ├── components/       # Preact island components (.tsx)
│   │   ├── HeaderBar.tsx
│   │   ├── TelemetryPanel.tsx
│   │   ├── EventLog.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── IssMap.tsx
│   │   ├── CrewPanel.tsx
│   │   └── NewsPanel.tsx
│   ├── lib/
│   │   └── config.ts     # Shared constants (API base, LS config)
│   ├── stores/
│   │   └── dashboard.ts  # nanostores atoms (event log, connection state)
│   └── pages/
│       └── index.astro   # Main layout (static HTML/CSS + island imports)
├── vendor/               # Composer dependencies (Guzzle, PSR-7, etc.)
├── astro.config.mjs      # Astro config with Preact integration
├── composer.json          # PHP dependencies
└── package.json           # Node dependencies
```

---

## How To Run

**Prerequisites:** Node.js (18+) and PHP (8.0+) with cURL extension enabled.

```bash
# 1. Install JS dependencies
npm install

# 2. Install PHP dependencies (if vendor/ isn't committed)
composer install

# 3. Start the PHP API server
php -S localhost:8000

# 4. In a separate terminal, start the Astro dev server
npm run dev
```

Open `http://localhost:4321` in your browser.

---

## AI-Assisted Development — What Went Well & What Didn't

This project was built with assistance from an AI coding agent (GitHub Copilot, Claude Opus 4.6). Here's an honest account:

### What the AI did well
- **Scaffolded the full dashboard** from a single Astro page with all the PHP endpoints, Lightstreamer integration, and Leaflet map in one go.
- **Refactored to Astro Islands** — broke a monolithic 1,200-line `.astro` file into 7 independent Preact components with proper hydration strategies and shared nanostores.
- **Found the right NASA telemetry ID** (`NODE3000005`) and wired up the Lightstreamer WebSocket correctly on the first attempt.
- **Built the PHP API layer** with three different HTTP techniques (cURL, Guzzle, DOMDocument crawler) each in its own clean endpoint with error handling and fallbacks.

### What the AI struggled with
- **Astro scoped styles vs. island rendering** — After the islands refactor, all styling broke. The AI initially tried fixing it with `display: contents` CSS hacks on `<astro-island>` wrappers, which didn't fully resolve the issue. The real fix was simply adding `is:global` to the `<style>` tag so CSS classes would apply inside Preact-rendered DOM. It took the user pointing out that "borders are gone and data is willy nilly" with a screenshot before the AI identified the actual root cause.
- **Map refresh interval change** — The AI correctly changed 30000ms → 5000ms in the code, but the user reported it still showed 30s. The AI couldn't determine that a dev-server restart or hard cache clear was needed, and just kept confirming the code was right. Not ideal UX.
- **Overconfidence in first-pass CSS fix** — When the `display: contents` approach didn't fully work, the AI declared it done and suggested rebuilding. A more cautious approach would have been to acknowledge the CSS scoping issue from the start, since it's a well-known Astro gotcha with framework components.

### Lessons learned
- Astro's `<style>` scoping is great for static pages, but the moment you use `client:*` islands with a framework like Preact, you almost certainly need `<style is:global>` for any shared CSS.
- `display: contents` is a useful trick but doesn't solve everything — especially when the real issue is that CSS selectors aren't matching at all.

---

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Astro dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `php -S localhost:8000` | Start the PHP API server |

---

## Tech Stack

- **Astro 5** — static-first framework with Islands architecture
- **Preact** — lightweight React alternative for interactive islands
- **nanostores** — tiny state management for cross-island communication
- **Lightstreamer** — WebSocket client for NASA's real-time telemetry
- **Leaflet** — open-source map library for ISS ground track
- **PHP 8** — backend API layer
- **Guzzle** — PHP HTTP client (Composer package)
- **cURL** — PHP's built-in HTTP client
- **DOMDocument/DOMXPath** — PHP's XML parser for RSS crawling

---

*Built at school. Powered by pee data from space.* 🛰️
