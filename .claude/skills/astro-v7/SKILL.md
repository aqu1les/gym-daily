---
name: astro-v7
description: Use when running, building, or editing this gym-daily Astro project — covers Astro 7 specifics (agent-friendly background dev server, Vite 8 / Rolldown, the stricter Rust .astro compiler, compressHTML changes) and which v7 features do NOT apply to this static SPA.
---

# Astro v7 in gym-daily

## Overview

This project runs **Astro 7.0.3** (Vite 8, `@astrojs/vue` 7). It is a **static SPA**:
`astro.config.mjs` sets `output: 'static'`, and the single page
[index.astro](../../../src/pages/index.astro) just mounts `App.vue` with `client:only="vue"`.
All app logic lives in Vue under `src/app/`. Astro here is a thin static shell + PWA + Vite host.

Because there is no server runtime, **most v7 headline features do not apply** (see "Not relevant" below). The parts that DO matter are the dev workflow and the stricter compiler.

Requires **Node >= 22.12.0** (already in `package.json` `engines`).

## Agent-friendly dev server (the v7 feature that matters most here)

v7 added a managed **background dev server** designed for AI agents — start it detached, poll a health endpoint, read logs, and stop it, all without blocking your turn. Prefer this over a long-running foreground `astro dev`.

| Command | Purpose |
|---|---|
| `bun run dev -- --background` (or `bunx astro dev --background`) | Start dev server as a detached background process |
| `bunx astro dev status` | Check whether a background dev server is running |
| `bunx astro dev logs --follow` | Stream logs from the background server |
| `bunx astro dev stop` | Stop the background dev server |
| `curl -s http://localhost:4321/_astro/status` | Health check — confirms the server is up before you hit it |

A lockfile prevents duplicate servers, so `--background` is safe to call when one may already be running (check `status` first). Default port is **4321**.

## Editing `.astro` files: stricter Rust compiler

v7 replaced the Go compiler with a Rust one. It is **strict about HTML** — things the old compiler silently fixed now error:

- **Every tag must be explicitly closed.** No implicit closing.
- **Invalid nesting is not auto-corrected** (e.g. block elements inside `<p>`).
- Always run `bunx astro check` after editing [index.astro](../../../src/pages/index.astro).

`compressHTML` now defaults to `'jsx'` (was `true`): inter-element whitespace is stripped with JSX rules. Irrelevant for this SPA (the body is just a Vue mount point), but if static markup ever loses spacing between inline elements, set `compressHTML: true` in `astro.config.mjs` or add `{" "}`.

## PWA: virtual modules are REQUIRED (gotcha)

`@vite-pwa/astro` does **not** auto-inject anything in Astro (unlike its React/Vue framework variants). The build emits `manifest.webmanifest`, `sw.js`, `registerSW.js` — but they only get wired into the page if [index.astro](../../../src/pages/index.astro) imports the virtual modules explicitly:

```astro
---
import { pwaInfo } from 'virtual:pwa-info';
---
<head>
  {pwaInfo && <Fragment set:html={pwaInfo.webManifest.linkTag} />}  {/* <link rel="manifest"> */}
</head>
<body>
  <script>
    import { registerSW } from 'virtual:pwa-register';
    registerSW({ immediate: true });  // immediate pairs with registerType: 'autoUpdate'
  </script>
</body>
```

Virtual-module types live in [src/env.d.ts](../../../src/env.d.ts) (`vite-plugin-pwa/info` + `/client`) — needed for `astro check`.

**Verify a PWA change** by building and grepping the output, not by reading dev (the SW doesn't register in dev by default):
```
bun run build && grep 'rel="manifest"' dist/index.html
```
The SW registration is bundled into a `dist/_astro/index.astro_...js` module, loaded via `<script type="module">`.

## Vite 8 / Rolldown

v7 bundles with **Vite 8**, whose bundler is **Rolldown** (Rust). All Vite plugins here support it (`@tailwindcss/vite`, `vite-plugin-pwa`).

- Builds print harmless `[INVALID_ANNOTATION] /* #__PURE__ */` warnings from `@vueuse/core`. These are **upstream cosmetic warnings**, not errors — do not "fix" them in this repo.
- The Tailwind plugin is wired via `vite.plugins` in `astro.config.mjs`, unchanged from v6.

## Verify after any change

```
bunx astro check   # 0 errors expected
bun run build      # builds dist/ + PWA service worker
```

## NOT relevant to this project (don't reach for these)

These v7 features assume an SSR/server output; this project is `output: 'static'`, so ignore them:

- `src/fetch.ts` advanced-routing entrypoint / Hono middleware — **no request pipeline here**. (Also: don't create a `src/fetch.ts`, it's now a reserved routing file.)
- Stable route caching, `routeRules`, `Astro.cache`, `cache.invalidate()`, CDN cache providers — need a server/edge.
- Live content collections / server islands / actions — unused; this app's data lives in Dexie (IndexedDB) on the client.
- Markdown changes (Rust "Sätteri" processor) — no `.md`/`.mdx` content in `src/`.
- `@astrojs/db` removal — never used here.

## Common mistakes

| Mistake | Fix |
|---|---|
| Running `astro dev` in foreground and blocking the turn | Use `astro dev --background` + `astro dev status` |
| Treating `#__PURE__` build warnings as failures | They're upstream `@vueuse` warnings; ignore |
| Adding unclosed/mis-nested HTML in `index.astro` | Close all tags; run `astro check` |
| Applying SSR caching/routing v7 docs here | This is a static SPA — see "Not relevant" |
| Creating `src/fetch.ts` | Reserved in v7 for advanced routing — pick another name |
