# AEO (Answer Engine Optimization) — Implementation Plan

Per-page answer-targeted schema.org data (`FAQPage`, `HowTo`, `Speakable`) emitted as JSON-LD on published pages, with the **visible** FAQ/HowTo content rendered from the **same source** — so answer engines (Google AI Overviews, voice, ChatGPT) extract direct answers and the visible page never drifts from the schema. Mirrors the SEO feature end-to-end.

Status: engine scaffold exists; this plan covers wiring it into the CMS. **Amended after design review** to resolve the visible-content source of truth (G1), the server↔publisher handshake (G2), and the field integration surface (G4).

## Key decisions (resolved)
- **D1 — One source of truth for FAQ/HowTo (was G1).** The visible FAQ/HowTo section and the JSON-LD draw from a single store: `cells_json.aeo`. AEO ships a first-party **FAQ/HowTo content module** (a `base.*` block) whose items bind to the page/entry's `aeo` cell via the existing dynamic-binding engine (the same pattern Loop/data bindings use). Editing the block edits the cell; the JSON-LD reads the same cell. No editorial matching, no drift. This is the bulk of Stage 2.
- **D2 — Server↔publisher handshake (was G2), mirrors SEO's two-path split.**
  - **Server path:** `server/publish/publicRenderer.ts` (`buildPageRenderSeo` / `buildRowRenderSeo`) pre-resolves AEO from the row's `aeo` cell via a new `readAeoCell` (mirroring `readSeoCell` at `src/core/data/cells.ts:77`), with the origin, and threads it through `renderMergedTemplate` → `publishPage` as `options.aeo: PublishedAeo`.
  - **Fallback path:** `src/core/publisher/seoHead.ts` resolves AEO with no origin (previews/exports).
  - **Speakable rule:** Speakable requires an absolute URL, so the fallback path omits it while the server path includes it — identical to SEO's absolute-URL discipline. Speakable itself is **deferred** (D4) — Google-News-beta-scoped.
  - **Type home:** `PublishedSeo` does not grow AEO. A parallel `PublishedAeo` is threaded alongside it; the JSON-LD composition assembles one combined `JsonLdEntity[]` at a single point in `seoHead.ts`, serialized with SEO's `serializeJsonLd`.
- **D3 — No template inheritance for AEO (was G9).** Unlike SEO's row→template→site chain, AEO resolves target → site default only. FAQs are per-target and must not inherit from templates. Deliberate divergence, stated.
- **D4 — Speakable deferred.** Schema/builder stay; wiring lands only if a concrete need appears.

## TL;DR
- Engine `src/core/aeo/` scaffolded (compiles).
- Remaining: per-target `aeo` built-in field (mirrors `seoMetadata` in ~12 places), the server+fallback resolution threading, publisher JSON-LD composition, the FAQ/HowTo content module (visible source of truth), server API, admin workspace, capabilities, gate, tests.
- Order: emit (data model + resolution + publisher) → edit (module + API + workspace) → harden.

## What's already done
- `src/core/aeo/schema.ts` — `FaqEntrySchema`, `HowToSchema`, `AeoMetadataSchema`, `SiteAeoSettingsSchema` + tolerant parsers.
- `src/core/aeo/jsonLd.ts` — `buildFaqPage`, `buildHowTo`, `buildSpeakable`, `buildAeoJsonLdEntities` (returns plain entity objects).
- `src/core/aeo/resolve.ts`, `src/core/aeo/index.ts`.

## Remaining work (staged)

### Stage 0 — make the scaffold honest
- Add `@core/aeo` to `BARRELLED_MODULES` in `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`. (The barrel comment currently claims this gating; it's false until added.)

### Stage 1 — make it emit (backend)
1. **Per-target `aeo`/`aeoMetadata` built-in field.** Mirror `seoMetadata` everywhere it's special-cased — NOT just `schemas.ts`. The full surface: `src/core/data/fields.ts:85` (cell serialization), `src/core/data/cells.ts` (typed reader — add `readAeoCell`), `src/core/forms/validation.ts:147`, `src/core/data/templatePreviewData.ts:84`, `src/admin/pages/data/utils/fieldIcons.ts:36`, `src/admin/pages/data/utils/fieldDefaults.ts:49`, `src/admin/pages/data/components/DataInspector/fieldGuards.ts:35`, `src/admin/pages/data/components/DataInspector/fieldEditState.ts:202`, `src/admin/pages/data/components/DataGrid/cells/CellEditorRenderer.tsx:97`, `CellDisplayRenderer.tsx:440`, `src/admin/pages/site/property-controls/bindingCompatibility.ts:32,62`, and **`ContentCollectionCreateDialog`** (the toggle that seeds the field on new postType tables — easy to miss). Missing any one → the field renders raw JSON in the data grid.
2. **Migration (no precedent — fully specified; was G5).** The `seo` field exists only in the `001_baseline` seeds; no migration has ever added a built-in field to existing tables. AEO's migration: an **idempotent `fields_json` update** that appends the `aeo` field definition for the `pages` system table and every existing `postType` table; **presence-check before insert** so tables where the user previously removed the field are skipped (not force-re-added); identical semantics in `server/db/migrations-pg.ts` AND `server/db/migrations-sqlite.ts` (dialect lockstep; the `migration-parity.test.ts` gate).
3. **Resolution + handshake (D2).** Implement `readAeoCell`; extend `publicRenderer.ts` page/row render builders to resolve AEO with origin and thread `options.aeo`; fallback in `seoHead.ts` omits Speakable.
4. **Publisher composition.** In `seoHead.ts`, assemble SEO entities + `buildAeoJsonLdEntities(resolvedAeo, ctx)` into one list; serialize once with `serializeJsonLd`. `noindex` pages emit no AEO (mirror `src/core/seo/jsonLd.ts:69`).
   - Verify: view-source of a page with `aeo.faq` shows one `FAQPage` block; a `noindex` page shows none.

### Stage 2 — make it editable (visible source of truth + UI)
5. **FAQ/HowTo content module (D1).** A first-party `base.*` block rendering visible questions/answers (and how-to steps) bound to the page/entry's `aeo` cell. One source → visible + JSON-LD.
6. **Server handler.** `server/handlers/cms/aeo.ts` — per-target family mirroring `seo.ts`; PUT writes through the same cells-write path as the SEO `handlePutTarget`.
7. **Admin workspace.** `src/admin/pages/aeo/` — per-target FAQ/HowTo editor + Rich Results preview; route `/admin/tools/aeo` + Tools nav (`AdminSectionNavigation`).
8. **AI suggestions (optional).** Mirror `server/handlers/cms/seoGenerate.ts`.

### Stage 3 — harden
9. **Capabilities** — `aeo.read`/`aeo.manage` (`src/core/capabilities.ts`, `src/admin/shared/CapabilityPicker/capabilityMeta.ts`, `SYSTEM_ROLES`).
10. **Tests** — mirror `src/core/seo/__tests__/` (jsonLd, resolve, health).
11. **Docs** — graduate this plan to `docs/features/aeo.md`; update `docs/README.md`, `docs/reference/capabilities.md`.

## Integration points (mirror SEO — exhaustive)
| Concern | SEO reference | AEO target |
|---|---|---|
| Engine module | `src/core/seo/` | `src/core/aeo/` (done) |
| Barrel gate | `no-core-barrel-deep-imports.test.ts` | add `@core/aeo` (Stage 0) |
| Per-target field type | `seoMetadata` special-cased in ~12 files (listed in Stage 1.1) | mirror each |
| Cell reader | `readSeoCell` (`src/core/data/cells.ts:77`) | `readAeoCell` |
| Site settings field | `src/core/page-tree/siteSettings.ts:45` (`seo`) | add `aeo` |
| Server resolution | `publicRenderer.ts` page/row builders | add AEO resolution + `options.aeo` |
| Publisher head | `src/core/publisher/seoHead.ts` | compose AEO JSON-LD here |
| Render call site | `src/core/publisher/render.ts:534-542` | (same) |
| Content module (visible) | (SEO has none) | new `base.*` FAQ/HowTo block bound to `aeo` cell |
| Server API | `server/handlers/cms/seo.ts` | `server/handlers/cms/aeo.ts` |
| Admin workspace | `src/admin/pages/seo/` | `src/admin/pages/aeo/` |
| Route | `/admin/tools/seo` | `/admin/tools/aeo` |
| Capabilities | `seo.read`/`seo.manage` | `aeo.read`/`aeo.manage` |

## Verification
- Google Rich Results Test parses `FAQPage` with no errors.
- Visible FAQ questions (rendered by the content module) match the JSON-LD **exactly** — provable because both read `cells_json.aeo` (D1).
- A `noindex` page emits no AEO; Speakable is omitted on the fallback path.
- Removing then re-adding the field per-table works (migration idempotency).
- `bun test`, `bun run build`, `bun run lint` clean.

## Risks
- FAQ/schema drift → eliminated by D1 (single cell + bound module).
- The `aeo` field must be a built-in seeded on every page/postType table; the migration must skip tables where the user removed it.
- Composition types: the combined JSON-LD list is `JsonLdEntity[]` from `@core/seo`; AEO entities are `Record<string, unknown>` — the composition point owns the widening cast.

## Related
- Audit + sources: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO template: `src/core/seo/`, `docs/features/seo.md`
- GEO plan: `docs/plans/geo.md`
