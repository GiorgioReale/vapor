# Vapor

Simple, accurate, open-source vaping calculators.

## Introduction

Vapor is a free static website with lightweight tools for common vaping
calculations. It requires no account, no backend, and no build step to run.
Every calculation happens locally in your browser.

## Features

- E-liquid mixing calculator
- Ohm's law calculator
- Progressive Web App (installable, offline-capable)
- Light and dark themes
- Local preference persistence
- Accessible, responsive UI
- Zero runtime dependencies
- MIT licensed

## E-Liquid Calculator

Determine nicotine base, flavor concentrate, and additional PG/VG volumes for a
target batch.

Inputs include final volume, target nicotine strength, nicotine base strength,
PG/VG ratios, flavor percentage, and flavor carrier.

## Ohm's Law Calculator

Calculate voltage, current, resistance, and power from any valid pair of known
values. The model assumes an ideal purely resistive DC circuit.

## Tech Stack

- Semantic HTML5
- Modern CSS3 (custom properties, Grid, Flexbox)
- Vanilla JavaScript ES modules
- Web App Manifest + service worker (PWA)
- Vitest for development-only unit tests

No React, Vue, Svelte, TypeScript, Tailwind, bundlers, or runtime libraries.

## Progressive Web App

Vapor can be installed on supported browsers and used offline.

- Manifest: `manifest.webmanifest`
- Service worker: `sw.js`
- Registration: `assets/js/pwa.js`

After serving over HTTPS (or `localhost`), use the browser install prompt or
“Add to Home Screen”. Offline mode serves the precached pages and assets.

When you change cached files, bump `CACHE_VERSION` in `sw.js` so clients refresh
the cache.

## Getting Started

Serve the project root with any static HTTP server.

Using Python:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Using Node.js:

```bash
npx --yes serve .
```

You do **not** need `pnpm install` or `node_modules` to use the site.

## Local Development

1. Clone the repository.
2. Start a static server from the project root.
3. Edit HTML, CSS, and JavaScript directly.
4. Refresh the browser to see changes.

### Configure your domain before deploy

Before publishing, replace placeholder URLs where needed:

1. Update absolute canonical and Open Graph URLs in each HTML page if you want
   fully qualified metadata.
2. Update `robots.txt` with your absolute sitemap URL.
3. Update `sitemap.xml` `<loc>` entries to absolute URLs for your domain.

Relative paths are used by default so the site can also be hosted under a
subpath such as GitHub Pages project sites.

## Running Tests

Tests cover pure calculator math only. Vitest is a development dependency.

```bash
pnpm install
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

## Project Structure

```text
vapor/
├── index.html
├── about.html
├── disclaimer.html
├── 404.html
├── manifest.webmanifest
├── sw.js
├── tools/
│   ├── e-liquid.html
│   └── ohms-law.html
├── assets/
│   ├── css/
│   ├── js/
│   │   └── calculators/
│   └── icons/
├── tests/
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── package.json
```

## Privacy

- No analytics
- No tracking pixels
- No external calculation APIs
- Optional preferences and last calculator inputs are stored in `localStorage`
  under the `vapor.*` namespace

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Disclaimer

Vapor is informational only. Nicotine is toxic. Ohm's law results assume an
ideal circuit and do not replace battery safety checks. Read
[disclaimer.html](./disclaimer.html) before use.

## License

[MIT](./LICENSE)
