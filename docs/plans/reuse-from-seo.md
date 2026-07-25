# Reuse from SEO — AEO + GEO build map

Audit of the SEO workspace (`src/admin/pages/seo/` + `@core/seo` + `server/handlers/cms/seo.ts`) for what AEO and GEO can take without reinventing. Three tiers: **extract** (generic → move to shared, once), **direct-reuse** (import as-is), **mirror** (copy the structure, swap the data).

The principle: reuse the workspace *machinery* (save bridge, toolbar, layout, API shape) and the generic *building blocks*; write only the AEO/GEO-specific *domain* (FAQ/HowTo fields, sameAs list, llms.txt body).

## Extract to shared (generic machinery — do once, all three workspaces win)
- **Save/publish bridge** — `hooks/useSeoSaveBridge.ts` (`useSeoSaveBridge` + `useSeoSaveSurface`). Domain-neutral already: status channel + ref-held actions + surface registration + clean handover on tab/switch. Extract to `src/admin/shared/workspace/saveBridge.ts` as `useSaveBridge` / `useSaveSurface` with a neutral `SaveStatus` / `SaveState`; migrate SEO onto it; GEO + AEO use it. **Highest-value extraction** — this is the part you'd otherwise copy verbatim per workspace.
- **Toolbar view-state** — `components/SeoToolbar.tsx` `deriveViewState` (idle/saving/saved/publishing/published/error → label/tone/icon). The underlying `PublishActionGroup` (`@site/toolbar/PublishActionGroup`) is **already shared** (Site / Content / SEO all use it). Extract `deriveViewState` + a thin `WorkspaceToolbar` alongside it so GEO/AEO get a toolbar with no copy-paste.

## Direct-reuse (import as-is from `src/admin/pages/seo/components/*` + `hooks/*`)
- `SeoFormRow` — labeled form row + hint → GEO/AEO field rows.
- `SeoImageField` — media-library image picker → AEO social image.
- `SeoCodeEditor` / `SeoCodeViewer` — code editor/viewer → **GEO `llms.txt` editor** (mirror `RobotsTab`).
- `MetaLengthMeter` — char/pixel budget meter → AEO answer-length guidance.
- `SchemaPreview` — JSON-LD viewer → **GEO `Organization` preview + AEO `FAQPage`/`HowTo` preview**.
- `SeoPreviewRail` / `SeoPreviewEditor` — sticky editor + preview-rail layout shell → GEO/AEO preview tabs.
- `AiSuggestionBubbles` + `hooks/useAiSuggestions` — AI-suggestion UI/state → **AEO AI suggestions** (mirror `seoGenerate` → `aeoGenerate`).

## Mirror (copy the structure, swap in AEO/GEO data)
- **`SiteDefaultsEditor.tsx` → GEO site editor (closest analog).** Reuse the whole skeleton: local draft + baseline dirty-tracking, `normalize`/`sameXxx` compare, `handleSave` (`workspace.saveSite`), `handlePublish` (`runStepUp` + `publishCmsDraft`), `useSeoSaveSurface` registration, read-only + error gating — swap the fields (extensible `sameAs` list + `llms.txt` enabled/intro/excludedTargets for SEO's title-pattern/OG/X/Organization). ~70% structural reuse.
- **`seoApi.ts` → `geoApi.ts` / `aeoApi.ts`.** Same shape: TypeBox response schemas + `apiRequest` GET/PUT wrappers over `@core/*` schema types. GEO: 2 fns (`fetchSiteGeo`, `saveSiteGeo`, site-scoped). AEO: per-target family mirroring `fetchSeoTargets` / `saveSeoTarget` / `generateSeoSuggestions`.
- **`useSeoWorkspace` → `useGeoWorkspace` / `useAeoWorkspace`.** GEO's is ~30 lines (load `siteGeo` + `saveSiteGeo`; no targets). AEO's mirrors SEO (per-target). Don't force-generalize — site-scoped vs per-target argues for one small hook per workspace.
- **`RobotsTab.tsx` → GEO llms.txt tab.** "code-editor over a generated body + toggles" pattern transfers directly.
- **Server handler** — `seo.ts` `handlePutSiteSeo` (site-settings write via `saveDraftSite`) + `runRouteTable` + `requireCapability`. GEO mirrors (Stage 3 spec); AEO mirrors the per-target family.

## SEO-specific (do NOT reuse — different domain)
- `SearchSnippetPreview`, `OpenGraphPreview`, `XCardPreview` — Google / OG / X card previews (SEO-only).
- `resolveTargetSeo` + `@core/seo/health` (`computeSeoReport`, scoring) — SEO scoring engine.
- `indexTargets` / `SeoTargetIndex` — per-target list (AEO reuses the *pattern*; GEO is site-scoped → skip).

## Shared infra already in use (keep using)
`publishCmsDraft` (`@core/persistence`), `runStepUp` (`@admin/shared/StepUp`), `apiRequest` (`@core/http`), `saveDraftSite` / `getDraftSite` (`@repositories/site`), `runRouteTable` / `Route` (`handlers/cms/routeTable`), `PublishActionGroup` (`@site/toolbar`), `serializeJsonLd` / `absoluteUrl` (`@core/seo`).

## Recommendation per stage
- **GEO Stage 3 (next):** (1) extract `useSaveBridge` / `useSaveSurface` to shared (one-time; benefits AEO too); (2) mirror `SiteDefaultsEditor` for the GEO editor; (3) direct-import `SeoFormRow`, `SeoCodeEditor` / `SeoCodeViewer` (llms.txt), `SchemaPreview`; (4) reuse `PublishActionGroup` + extracted `deriveViewState` for the toolbar. Defer promoting the UI blocks to `@ui` until a third consumer appears (avoid premature abstraction).
- **AEO:** additionally mirror `seoApi.ts` (per-target), reuse `AiSuggestionBubbles` + `useAiSuggestions`, mirror `SeoTargetIndex`.

## Net effect
Building GEO Stage 3 is mostly **mirroring `SiteDefaultsEditor` + reusing the save bridge / toolbar / form-row / code-editor**, not a from-scratch workspace. AEO similarly leans on the per-target machinery SEO already wrote. The only genuinely new domain code is: the GEO `sameAs` list editor + llms.txt body, and the AEO FAQ/HowTo fields + content module (the latter pending the cell-array spike in `aeo.md`).

## Related
- Remaining-work backlog: `docs/plans/remaining-work.md`
- Stage plans: `docs/plans/aeo.md`, `docs/plans/geo.md`
- SEO source of truth: `src/admin/pages/seo/`, `server/handlers/cms/seo.ts`, `src/core/seo/`
