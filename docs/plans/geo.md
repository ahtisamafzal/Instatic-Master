# GEO (Generative Engine Optimization) — Implementation Plan

Site-wide generative-engine signals: the brand entity `sameAs` identity graph emitted as `Organization` JSON-LD, plus the opt-in `/llms.txt` endpoint with a real, configurable content model. Mirrors SEO's site settings + the `robots.txt` endpoint pattern.

Note: Google Search ignores `llms.txt`; GEO targets the AI-search ecosystem (ChatGPT/Claude/Perplexity) and the entity-authority signals generative engines use to cite brands.

Status: engine scaffold exists; this plan covers wiring it into the CMS. **Amended after design review** to resolve the Organization-merge decision (G3), the `llms.txt` content model (G6), `/llms-full.txt` (G7), and the dev-proxy scope.

## Key decisions (resolved)
- **D1 — One Organization entity, built in one place (was G3).** SEO already emits `Organization` from `site.settings.seo.organization` (`publicRenderer.ts:115,159`). GEO does **not** emit a competing standalone entity. GEO contributes `sameAs` into the SEO Organization at the publisher composition point. The scaffold's `buildGeoJsonLdEntity` becomes a **sameAs contributor**, not a second emitter — so we never produce two competing Organization entities.
- **D2 — Organization name precedence (one source).** `site.settings.seo.organization.name` → `site.name`. The scaffold's `entityName` is **dropped** (it would duplicate SEO's org name).
- **D3 — `sameAs` is an extensible list (was configurability).** Replace the scaffold's six fixed fields (`linkedinUrl`, …) with an ordered array `{ label, url }[]` in `src/core/geo/schema.ts`. Adding Instagram/X/TikTok later = one new entry, not a schema + builder + UI change. (Scaffold revised at implementation time.)
- **D4 — `/llms-full.txt` deferred (was G7).** Cut from scope. It currently duplicates `llms.txt` (`src/core/geo/endpoints.ts:34`). Re-add only when a real full-content model exists (it's a content-licensing decision anyway).
- **D5 — canonical-host = 404 (deliberate divergence from robots' 200-Disallow).** `/llms.txt` returns 404 on non-canonical hosts: never advertise AI licensing on staging.

## TL;DR
- Engine `src/core/geo/` scaffolded (compiles; needs the D3 array revision + D2 `entityName` drop).
- Remaining: site-settings `geo` field, `/llms.txt` endpoint with a real content model + router + **Vite exemption covering `/llms.txt` AND `/robots.txt` AND `/sitemap.xml`** (the latter two are also currently broken in dev), sameAs contribution to the Organization entity, site-scoped server API, admin workspace, capabilities, gate, tests.
- Order: `/llms.txt` endpoint first (mechanics fully specified; demonstrable via `curl`), then sameAs emission, then API + workspace.

## What's already done
- `src/core/geo/schema.ts` — `GeoEntitySameAsSchema` (fixed fields → revise to array per D3), `LlmsTxtSettingsSchema`, `SiteGeoSettingsSchema` + `parseSiteGeoSettings`.
- `src/core/geo/jsonLd.ts` — `buildOrganizationEntity` (→ refactor to a sameAs contributor per D1).
- `src/core/geo/endpoints.ts` — `generateLlmsTxt` (→ real content model per G6); `generateLlmsFullTxt` (→ drop per D4).
- `src/core/geo/index.ts`.

## Remaining work (staged)

### Stage 0 — honest scaffold
- Add `@core/geo` to `BARRELLED_MODULES` (`src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`).
- Revise `schema.ts`: `GeoEntitySameAs` → `{ label, url }[]` (D3); drop `entityName` (D2); drop `LlmsTxtSettings.fullEnabled` (D4).

### Stage 1 — `/llms.txt` endpoint (parallel to robots.txt)
1. **Site settings.** Add `geo: Type.Optional(SiteGeoSettingsSchema)` to `SiteSettingsSchema` + parse in `parseSiteSettings` (`src/core/page-tree/siteSettings.ts:45,90`).
2. **Real `llms.txt` content model (was G6).** `generateLlmsTxt` emits the convention shape: `# Site Name` (H1) + `> origin` blockquote summary + the site description (sourced from `SiteSeoSettings.description` — the only existing description field) + `##` H2 sections of curated links (homepage + included pages). Configurable: `geo.llmsTxt.includedTargets` / `excludedTargets` (mirror sitemap's `excludedTargets`), plus optional custom intro/sections in settings. Stop ignoring the settings parameter.
3. **Endpoint.** `server/publish/geoEndpoints.ts` `serveLlmsTxt(db, url, req)` mirroring `serveRobotsTxt` (`server/publish/seoEndpoints.ts:77`): publishVersion + origin keyed cache, canonical-host 404 (D5), opt-in (`geo.llmsTxt.enabled === true` else 404), **HEAD allowed** (mirror robots). Body from step 2.
4. **Router dispatch.** `if (pathname === '/llms.txt') return serveLlmsTxt(...)` before static assets (`server/router.ts`, mirror 475-476).
5. **Vite dev-proxy exemption — fix all three.** Add `/llms.txt`, `/robots.txt`, `/sitemap.xml` to the explicitly-proxied extension-bearing paths (`vite.config.ts:38-39`, next to `/_instatic/assets|css/`). robots/sitemap are **also** currently broken in dev for the same reason (`.txt`/`.xml` fall through to the SPA shell) — fixing all three together is correct.
   - Verify: `curl -i http://127.0.0.1:5173/llms.txt` → `200 text/plain` (enabled) / `404` (off); robots/sitemap also resolve in dev now.

### Stage 2 — sameAs emission
6. **Publisher.** Contribute `sameAs` into the SEO Organization entity at the composition point (`src/core/publisher/seoHead.ts`); do not emit a second Organization (D1).
   - Verify: view-source shows one `Organization` with merged `sameAs` when profiles are configured.

### Stage 3 — make it editable (API + UI)
7. **Server handler — site-scoped (was G8).** `server/handlers/cms/geo.ts` exposes exactly **two** routes — `GET /admin/api/cms/geo/site` and `PUT /admin/api/cms/geo/site` (NOT SEO's per-target family; GEO has no per-target data).
8. **Admin workspace.** `src/admin/pages/geo/` — extensible `sameAs` list editor (add/remove `{ label, url }` rows) + `llms.txt` toggle + live preview; route `/admin/tools/geo` + Tools nav.

### Stage 4 — harden
9. **Capabilities** — `geo.read`/`geo.manage` (`src/core/capabilities.ts`, `capabilityMeta.ts`, `SYSTEM_ROLES`).
10. **Tests** — mirror `src/core/seo/__tests__/robots.test.ts` for `serveLlmsTxt`.
11. **Docs** — graduate to `docs/features/geo.md`; update `docs/README.md`, `docs/reference/capabilities.md`.

## Integration points (mirror SEO)
| Concern | SEO reference | GEO target |
|---|---|---|
| Engine module | `src/core/seo/` | `src/core/geo/` (scaffold; revise per D3/D2) |
| Barrel gate | `no-core-barrel-deep-imports.test.ts` | add `@core/geo` (Stage 0) |
| Site settings | `siteSettings.ts:45` (`seo`) | add `geo` |
| Crawl endpoint | `seoEndpoints.ts` (robots/sitemap) | `geoEndpoints.ts` (llms.txt) |
| Router dispatch | `router.ts:475-476` | add `/llms.txt` |
| Vite dev proxy | `vite.config.ts:38-39` | add `/llms.txt` + `/robots.txt` + `/sitemap.xml` |
| Entity JSON-LD | `seoHead.ts` (Organization) | contribute `sameAs` into it (D1) |
| Server API | `seo.ts` (per-target family) | `geo.ts` — **site-scoped** GET/PUT `/geo/site` |
| Admin workspace | `src/admin/pages/seo/` | `src/admin/pages/geo/` |
| Route | `/admin/tools/seo` | `/admin/tools/geo` |
| Capabilities | `seo.read`/`seo.manage` | `geo.read`/`geo.manage` |

## Verification
- `curl -i /llms.txt` → `200 text/plain; charset=utf-8` (enabled) / `404` (off or non-canonical host); HEAD works.
- **Settings-change-requires-publish:** toggling `llmsTxt.enabled` takes effect only after the next publish (snapshot discipline). Surface this in the UI so a user who toggles + curls immediately doesn't think it's broken.
- `/robots.txt` and `/sitemap.xml` now resolve in dev (Stage 1.5).
- view-source shows one `Organization` with merged `sameAs` (no duplicate entity).
- `bun test`, `bun run build`, `bun run lint` clean.

## Risks
- Cache must invalidate on publish + origin change (mirror SEO's cache discipline).
- Settings-change-requires-publish confusion — mitigate via UI messaging.
- `llms.txt` content model must be real (curated H2 link sections), not just name + origin, or the file is hollow.
- Origin unset → omit the origin line; degrade gracefully.

## Related
- Audit + sources: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO template: `src/core/seo/`, `docs/features/seo.md`
- AEO plan: `docs/plans/aeo.md`
