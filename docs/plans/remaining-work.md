# Remaining Work — AEO + GEO Implementation

Single consolidated view of what's left to build, current as of GEO Stage 0+1 landing. The detailed stage-by-stage plans live in `aeo.md` and `geo.md`; this doc is the current status + backlog across both, plus housekeeping. For *how* to build the workspaces (what to extract/reuse/mirror from SEO), see `reuse-from-seo.md`.

## Status snapshot

**Done (on `feat/seo-aeo-geo`, pushed to fork):**
- SEO platform layer integrated (PR CoreBunch/Instatic#53 merged onto `main` v0.0.13, 13 conflicts resolved) — commit `6b91e619`. Build green.
- AEO + GEO engine scaffolds (`src/core/aeo/`, `src/core/geo/`) — commit `8b499159`.
- AEO + GEO implementation plans (`aeo.md`, `geo.md`) — commits `7619669a`, `38b5220b`.
- **GEO Stage 0+1** — scaffold revision (extensible `sameAs` array, `entityName`/`fullEnabled` dropped, `sameAs` contributor), `@core/geo` barrel gate, `site.settings.geo` field, `/llms.txt` endpoint (`geoEndpoints.ts`), router dispatch, Vite exemption for `/llms.txt` + `/robots.txt` + `/sitemap.xml` — commit `e3647a71`. Verified: `/llms.txt` 404 (opt-in off), `/robots.txt` + `/sitemap.xml` 200 on `:5173`; barrel-gate test green.

**Not yet verified:** the full `bun test` suite on the SEO integration (only `bun run build` + the barrel-gate test are confirmed).

---

## Remaining — GEO

### Stage 2 — `sameAs` emission into Organization (publisher)
- **File:** `src/core/publisher/seoHead.ts`, in `buildDocumentMetaTags` (before the JSON-LD emit loop at line 146).
- Import `sameAsUrls` from `@core/geo`; merge `sameAsUrls(site.settings.geo?.sameAs)` into the `Organization` entity inside `seo.jsonLd` (append to any existing `sameAs`; only when non-empty). Per GEO D1, GEO contributes `sameAs` — it never emits a standalone Organization.
- Note: `Organization` is emitted only on the homepage (`src/core/seo/jsonLd.ts:74`), so the enrichment lands there — correct for site-wide identity.
- Verify: homepage view-source shows one `Organization` with merged `sameAs` when profiles are configured.

### Stage 3 — admin workspace + site-scoped API (the panel you can drive)
- **Server handler** — `server/handlers/cms/geo.ts` (new), mirroring `seo.ts:208-222` (`handlePutSiteSeo`):
  - `GET /admin/api/cms/geo/site` → `{ siteGeo, publicOrigin }`, gated `geo.read`.
  - `PUT /admin/api/cms/geo/site` → `saveDraftSite(db, { ...site, settings: { ...site.settings, geo: parseSiteGeoSettings(body.geo) } }, user.id)`, gated `geo.manage`.
  - Body schema `Type.Object({ geo: SiteGeoSettingsSchema })`; `GEO_ROUTES` table + `handleGeoRoutes` (mirror `seo.ts:228-245`).
- **Register** — `server/handlers/cms/index.ts`: import `handleGeoRoutes`; add `?? (await handleGeoRoutes(req, db, options))` to the chain near line 109.
- **Admin page** — `src/admin/pages/geo/GeoPage.tsx` (new), thin shell mirroring `SeoPage.tsx` (97 lines):
  - `AdminPageLayout workspace="geo"`; a form with: `llms.txt` enabled toggle (`Switch`), intro (`Input`), and an extensible `sameAs` list editor (add/remove `{ label, url }` rows).
  - Load via `GET /geo/site`, save via `PUT /geo/site` using `@core/http` `apiRequest`; UI primitives from `@ui/components/`.
  - Module CSS alongside (mirror `SeoPage.module.css`); Save control in the toolbar (mirror `SeoToolbar`) or a simple Save button for v1.
- **Route** — `src/admin/router.tsx`: add `<Route path="/admin/tools/geo" element={withRouteBoundary(<AdminEntry section="geo" />)} />` next to `/admin/tools/seo`.
- **Nav** — `src/admin/shared/AdminSectionNavigation/AdminSectionNavigation.tsx`: add `showGeo={canAccess('geo')}` (mirror `showSeo` at line 203), thread it through (lines 226/231), add a GEO `ContextMenuItem` (mirror the SEO item at lines 310-318) → `/admin/tools/geo`.
- **Workspace access gate** — wherever `section="seo"` maps to a `seo.read` capability gate (`canAccessWorkspace`/`AdminEntry`), mirror for `section="geo"` → `geo.read`.
- **UX note** — surface "changes take effect after publish" in the panel (snapshot discipline; otherwise a toggle-then-curl looks broken).

### Stage 4 — harden
- **Capabilities:**
  - `src/core/capabilities.ts` `CORE_CAPABILITIES` — add `'geo.read'`, `'geo.manage'` (after `seo.*` at lines 76-77). Owner auto-inherits (line 104 `[...CORE_CAPABILITIES]`).
  - `server/auth/capabilities.ts` `adminCapabilities` (line 42) — **explicitly** add `geo.read`/`geo.manage` (Admin is a literal list by design; new caps don't propagate automatically). Mirror whatever `seo.*` does for the Client role (`clientCapabilities`).
  - `src/admin/shared/CapabilityPicker/capabilityMeta.ts` — add `geo.read`/`geo.manage` label+description entries (mirror the `seo.*` entries).
- **Tests** — mirror `src/core/seo/__tests__/robots.test.ts` for `serveLlmsTxt`; add a `geoHandler` test (GET/PUT `/geo/site`).
- **Docs** — graduate `geo.md` → `docs/features/geo.md`; update `docs/README.md` + `docs/reference/capabilities.md`.

---

## Remaining — AEO (on hold; spike first)

Plan: `aeo.md`. Hold for green-light. **Spike required before Stage 2** (design-review caveat): the D1 "content module binds to `cells_json.aeo`" mechanism is shakier than stated — bindings resolve scalar tokens and Loops iterate data-table rows; **neither iterates an array nested inside a single cell** (`aeo.faq[]`). Likely the FAQ module reads the current entry's `aeo` cell directly (closer to `readSeoCell` than to generic bindings) and renders the list itself. Pin this down before building the workspace around it. D1's single-source-of-truth decision stands; only the mechanism is open.

Then Stage 0 (barrel gate `@core/aeo`) → Stage 1 (`aeo` built-in field mirroring `seoMetadata` in all ~12 special-case files; additive `fields_json` migration; server+fallback handshake `PublishedAeo`; publisher composition) → Stage 2 (FAQ/HowTo content module + API + workspace) → Stage 3 (capabilities/tests/docs). Speakable deferred (D4).

---

## Housekeeping / loose ends
1. **`vite.config.ts` `optimizeDeps.include`** for `tool-case-solid` — a band-aid from the icon-resolution debug. Real fix was `bun install` refreshing a stale `node_modules`. Recommend **revert** (CLAUDE.md "no band-aids"); the icon resolves without it now.
2. **`geo.md` cosmetic** — "(Stage 1.5)" → "Stage 1, step 5" (2 occurrences).
3. **10 uncommitted NK tweaks** on `feat/seo-aeo-geo` (modified `video/index.ts`, `prewarmedLazy.ts`, `base-modules-shared-render.test.ts`, `prewarmedLazy.test.tsx`, `public/veldara-flower.png`; untracked `fluxora-site/`, `neuralkinetics-ai-search-standalone/` + `.zip`, `.codex/`, `docs/neuralkinetics-site/`). Decide: commit the source edits + audit doc; **gitignore** the large artifacts (`fluxora-site/`, `neuralkinetics-ai-search-standalone/`, `.codex/`).
4. **`bun.lock`** modified by `bun install` — uncommitted; should be committed (legitimate refresh).
5. **Full `bun test`** not yet run on the SEO integration — run to confirm no regressions across the 13 conflict resolutions.
6. **`settings-change-requires-publish`** — call out in the GEO workspace UI (item in Stage 3).
7. **`tool-case-solid` provenance** — verify it's a real upstream pixel-art-icons icon (the stale-`node_modules` symptom could recur if another install goes stale; `icons:check` passes but only checks `vendor`, not `node_modules`).

## Open decisions
- AEO D1 rendering mechanism (the spike above).
- GEO Admin `sameAs` editor v1 scope (simple add/remove list vs. per-platform validation/icons — array schema already supports either).
- Admin/Client capability grants for `geo.*` (mirror `seo.*`).
- `llms.txt` page selection default (all non-`noindex` pages; `excludedTargets` filter already wired).

## Suggested order
1. Housekeeping first (commit/sort NK tweaks + `bun.lock`; full `bun test`; decide `optimizeDeps`).
2. GEO Stage 2 (small — one file, `seoHead.ts`).
3. GEO Stage 3 (the workspace — ~6 files; the user-facing win).
4. GEO Stage 4 (capabilities + tests + docs).
5. AEO spike → AEO stages (after green-light).

## Related
- Detailed plans: `docs/plans/aeo.md`, `docs/plans/geo.md`
- Audit + sources: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO template (the pattern everything mirrors): `src/core/seo/`, `server/handlers/cms/seo.ts`, `src/admin/pages/seo/`
