# GEO (Generative Engine Optimization) — Implementation Plan

Site-wide generative-engine signals: the brand entity `sameAs` identity graph (LinkedIn, YouTube, Wikidata, GitHub, …) emitted as Organization JSON-LD, plus the opt-in `/llms.txt` endpoint for the ChatGPT / Claude / Perplexity ecosystem. Mirrors SEO's site-wide settings + the `robots.txt` / `sitemap.xml` endpoint pattern.

Note: Google Search ignores `llms.txt`; GEO targets the AI-search ecosystem and the entity-authority signals generative engines use to cite brands.

Status: the engine scaffold exists; this plan covers wiring it into the CMS.

## TL;DR
- Engine module `src/core/geo/` is scaffolded (entity `sameAs` schema, Organization builder, `llms.txt` generators, barrel) and compiles.
- Remaining: site-settings field, `/llms.txt` endpoint + router + Vite dev-proxy exemption, publisher entity emission, server API, admin workspace, capabilities, gate, tests.
- Order: `/llms.txt` endpoint first (fully demonstrable, parallel to `robots.txt`), then entity JSON-LD emission, then API + workspace.

## What's already done
- `src/core/geo/schema.ts` — `GeoEntitySameAsSchema`, `LlmsTxtSettingsSchema`, `SiteGeoSettingsSchema` + `parseSiteGeoSettings`.
- `src/core/geo/jsonLd.ts` — `buildOrganizationEntity` (with `sameAs`), `buildGeoJsonLdEntity`.
- `src/core/geo/endpoints.ts` — `generateLlmsTxt`, `generateLlmsFullTxt`.
- `src/core/geo/index.ts` — barrel.

## Remaining work (staged)

### Stage 1 — `/llms.txt` endpoint (parallel to robots.txt)
1. **Site settings.** Add `geo: Type.Optional(SiteGeoSettingsSchema)` to `SiteSettingsSchema` and parse it in `parseSiteSettings` (`src/core/page-tree/siteSettings.ts`, mirror the `seo` field at lines 45 and 90).
2. **Endpoint.** `server/publish/geoEndpoints.ts` exporting `serveLlmsTxt(db, url, req)` mirroring `serveRobotsTxt` (`server/publish/seoEndpoints.ts:77`): publishVersion + origin keyed cache, canonical-host check (404 on non-canonical), opt-in (`geo.llmsTxt.enabled === true` else 404), body via `generateLlmsTxt`.
3. **Router dispatch.** `if (pathname === '/llms.txt') return serveLlmsTxt(...)` before static assets (`server/router.ts`, mirror lines 475-476).
4. **Vite dev-proxy exemption.** Add `/llms.txt` to the explicitly-proxied extension-bearing paths (`vite.config.ts:38-39`, next to `/_instatic/assets/` and `/_instatic/css/`) so dev `:5173` serves it instead of falling through to the SPA shell.
   - Verify: `curl -i http://127.0.0.1:5173/llms.txt` → `200 text/plain` when enabled; `404` when off.

### Stage 2 — entity JSON-LD emission
5. **Publisher.** Emit the GEO Organization entity (with `sameAs`) into the head JSON-LD, composed with SEO's Organization (`src/core/publisher/seoHead.ts`). Likely enrich SEO's existing Organization with `sameAs` when GEO profiles are configured (avoid emitting two competing Organization entities).
   - Verify: view-source shows `Organization` with `sameAs: [...]` when profiles are set.

### Stage 3 — make it editable (API + UI)
6. **Server handler.** `server/handlers/cms/geo.ts` (read/write site GEO settings; mirror `seo.ts`), routes `/admin/api/cms/geo/*`.
7. **Admin workspace.** `src/admin/pages/geo/` — entity-profile fields (LinkedIn/YouTube/Wikidata/GitHub/Reddit/Wikipedia) + `llms.txt` toggle + live preview (mirror `src/admin/pages/seo/`). Route `/admin/tools/geo` + Tools nav.
8. **`/llms-full.txt`.** Serve the fuller variant when `geo.llmsTxt.fullEnabled` (content-licensing decision; opt-in only).

### Stage 4 — harden
9. **Capabilities.** `geo.read`, `geo.manage` (`src/core/capabilities.ts`, `src/admin/shared/CapabilityPicker/capabilityMeta.ts`, `SYSTEM_ROLES`).
10. **Architecture gate.** Add `@core/geo` to `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`.
11. **Tests.** Mirror `src/core/seo/__tests__/robots.test.ts` style for `serveLlmsTxt`.
12. **Docs.** Graduate this plan to `docs/features/geo.md`; update `docs/README.md` and `docs/reference/capabilities.md`.

## Integration points (mirror SEO)
| Concern | SEO reference | GEO target |
|---|---|---|
| Engine module | `src/core/seo/` | `src/core/geo/` (done) |
| Site settings field | `src/core/page-tree/siteSettings.ts:45` (`seo`) | add `geo` |
| Crawl endpoint | `server/publish/seoEndpoints.ts` (robots/sitemap) | `server/publish/geoEndpoints.ts` (llms.txt) |
| Router dispatch | `server/router.ts:475-476` | add `/llms.txt` |
| Vite dev proxy | `vite.config.ts:38-39` exemptions | add `/llms.txt` |
| Entity JSON-LD | `src/core/publisher/seoHead.ts` (Organization) | enrich with `sameAs` |
| Server API | `server/handlers/cms/seo.ts` | `server/handlers/cms/geo.ts` |
| Admin workspace | `src/admin/pages/seo/` | `src/admin/pages/geo/` |
| Route | `/admin/tools/seo` | `/admin/tools/geo` |
| Capabilities | `seo.read` / `seo.manage` | `geo.read` / `geo.manage` |

## Verification
- `curl -i /llms.txt` → `200 text/plain; charset=utf-8` (enabled) / `404` (off or non-canonical host).
- Non-canonical host → `404` (never advertise AI licensing on staging).
- view-source shows `Organization.sameAs` when profiles are configured.
- `bun test`, `bun run build`, `bun run lint` clean.

## Risks
- The `llms.txt` cache must invalidate on publish and on origin change (mirror SEO's cache discipline in `seoEndpoints.ts`).
- `llms-full.txt` is a content-licensing decision → opt-in only, never default.
- Origin unset → `llms.txt` omits the origin line (degrades gracefully).

## Related
- Audit + source synthesis: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO feature (the template): `src/core/seo/`, `docs/features/seo.md`
- AEO plan: `docs/plans/aeo.md`
