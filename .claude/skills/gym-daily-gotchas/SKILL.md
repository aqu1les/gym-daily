---
name: gym-daily-gotchas
description: Use when debugging unexpected behavior, "it works locally but not X", or wiring up build/PWA/routing in the gym-daily project — a running log of non-obvious, version-independent gotchas discovered while working here (PWA service worker setup, SPA history-mode 404s, etc.). Check here before assuming a recent change caused a bug.
---

# gym-daily gotchas

A running log of non-obvious traps in this project. These are **not tied to any dependency version** — they're inherent to how this app is wired (Vue SPA inside a static Astro shell, deployed to Cloudflare Pages). When something behaves unexpectedly, check here first: the cause is often one of these, not your recent change.

Add a new entry whenever you burn time on a non-obvious cause.

## PWA assets generate but nothing registers

**Symptom:** `dist/` has `manifest.webmanifest` / `sw.js` / `registerSW.js`, but the built HTML has no `<link rel="manifest">` and no service worker ever registers — app isn't installable.

**Cause:** `@vite-pwa/astro` does **not** auto-inject in Astro (unlike its React/Vue framework presets). You must import the virtual modules yourself.

**Fix** — in the shell ([src/layouts/Layout.astro](../../../src/layouts/Layout.astro)):
```astro
---
import { pwaInfo } from 'virtual:pwa-info';
---
<head>
  {pwaInfo && <Fragment set:html={pwaInfo.webManifest.linkTag} />}
</head>
<body>
  <script>
    import { registerSW } from 'virtual:pwa-register';
    registerSW({ immediate: true });  // immediate pairs with registerType: 'autoUpdate'
  </script>
</body>
```
Virtual-module types live in [src/env.d.ts](../../../src/env.d.ts) (`vite-plugin-pwa/info` + `/client`) — without them `astro check` errors.

**Verify by building, not by dev** — the SW does not register in `astro dev` by default:
```
bun run build && grep 'rel="manifest"' dist/index.html
```

## Deep links (e.g. /settings) 404 in dev

**Symptom:** Loading or refreshing `http://localhost:4321/settings` (or any non-`/` route) returns 404. Clicking to it from inside the app works fine.

**Cause:** vue-router uses `createWebHistory()` ([src/app/router.ts](../../../src/app/router.ts)). Deep links hit the server, which has no such route. Production is fine — Cloudflare honors [public/_redirects](../../../public/_redirects) (`/* /index.html 200`) — but **`astro dev` does not process `_redirects`**. This is NOT a regression; it has always been true and is independent of the Astro version. A `curl` reproduces it (proves it's server-side, not the service worker).

**Fix:** [src/pages/404.astro](../../../src/pages/404.astro) renders the same SPA shell, so unmatched routes boot the app and vue-router takes over. Works in `astro dev` and on any host that serves `404.html`. (HTTP status stays 404 in dev — cosmetic for a SPA; Cloudflare gives a clean 200 via `_redirects`.)

**Before blaming a recent change:** `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/<route>` — if the server 404s, it's this, not your code.
