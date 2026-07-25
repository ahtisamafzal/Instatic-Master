# AEO (Answer Engine Optimization) — Implementation Plan

Per-page answer-targeted schema.org data (`FAQPage`, `HowTo`, `Speakable`) emitted as JSON-LD on published pages, so answer engines (Google AI Overviews, voice assistants, ChatGPT) can extract direct answers. Mirrors the SEO feature end-to-end.

Status: the engine scaffold exists; this plan covers wiring it into the CMS.

## TL;DR
- Engine module `src/core/aeo/` is scaffolded (schema, JSON-LD builders, resolver, barrel) and compiles.
- Remaining: a per-target data field, publisher emission, server API, admin workspace, capabilities, architecture gate, tests.
- Order: data model + publisher emission first (so it emits), then API + workspace (so it's editable), then capabilities/gate/tests/docs.

## What's already done
- `src/core/aeo/schema.ts` — `FaqEntrySchema`, `HowToSchema`, `AeoMetadataSchema`, `SiteAeoSettingsSchema` + tolerant parsers.
- `src/core/aeo/jsonLd.ts` — `buildFaqPage`, `buildHowTo`, `buildSpeakable`, `buildAeoJsonLdEntities` (returns plain entity objects; publisher owns serialization).
- `src/core/aeo/resolve.ts` — `resolveAeoMetadata`.
- `src/core/aeo/index.ts` — barrel.

## Remaining work (staged)

### Stage 1 — make it emit (backend)
1. **Per-target data field.** Register an `aeo` built-in field on `page` and `postType` tables (mirror how SEO registers the `seo`/`seoMetadata` built-in — `src/core/data/schemas.ts` `POST_TYPE_FIELD_*` + the field-registration path SEO uses). Stored as `cells_json.aeo`. Additive migration in BOTH `server/db/migrations-pg.ts` and `server/db/migrations-sqlite.ts`.
   - Verify: a page can carry `cells_json.aeo = { faq: [{ question, answer }] }`.
2. **Publisher emission.** Compose AEO JSON-LD into the head alongside SEO's. SEO emits from `src/core/publisher/seoHead.ts` (called at `src/core/publisher/render.ts:534-542`); add `buildAeoJsonLdEntities(resolvedAeo, ctx)` to the same JSON-LD block, serialized with SEO's `serializeJsonLd`. `noindex` pages emit no AEO (mirror SEO's rule in `src/core/seo/jsonLd.ts:69`).

### Stage 2 — make it editable (API + UI)
3. **Server handler.** `server/handlers/cms/aeo.ts` (read/write per-target AEO; mirror `server/handlers/cms/seo.ts`), registered in `server/handlers/cms/index.ts`, routes under `/admin/api/cms/aeo/*`.
4. **Admin workspace.** `src/admin/pages/aeo/` — per-target FAQ/HowTo editor + Rich Results preview (mirror `src/admin/pages/seo/`). Route `/admin/tools/aeo` in `src/admin/router.tsx` and add it to the Tools nav (`src/admin/shared/AdminSectionNavigation/AdminSectionNavigation.tsx`).
5. **AEO AI suggestions (optional).** Mirror `server/handlers/cms/seoGenerate.ts` → `POST /aeo/generate`.

### Stage 3 — harden
6. **Capabilities.** `aeo.read`, `aeo.manage` in `src/core/capabilities.ts`, `src/admin/shared/CapabilityPicker/capabilityMeta.ts`, and `SYSTEM_ROLES` (Owner/Admin).
7. **Architecture gate.** Add `@core/aeo` to `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`.
8. **Tests.** Mirror `src/core/seo/__tests__/` (jsonLd, resolve, health).
9. **Docs.** Graduate this plan to `docs/features/aeo.md`; update `docs/README.md` and `docs/reference/capabilities.md`.

## Integration points (mirror SEO)
| Concern | SEO reference | AEO target |
|---|---|---|
| Engine module | `src/core/seo/` | `src/core/aeo/` (done) |
| Site settings field | `src/core/page-tree/siteSettings.ts:45` (`seo`) | add `aeo` |
| Per-target field | SEO `seo` built-in (`src/core/data/schemas.ts`) | register `aeo` built-in |
| Publisher head | `src/core/publisher/seoHead.ts` | compose AEO JSON-LD here |
| Render call site | `src/core/publisher/render.ts:534-542` | (same) |
| Server API | `server/handlers/cms/seo.ts` | `server/handlers/cms/aeo.ts` |
| Admin workspace | `src/admin/pages/seo/` | `src/admin/pages/aeo/` |
| Route | `/admin/tools/seo` (`src/admin/router.tsx`) | `/admin/tools/aeo` |
| Capabilities | `seo.read` / `seo.manage` | `aeo.read` / `aeo.manage` |

## Verification
- Google Rich Results Test parses `FAQPage` with no errors.
- Visible FAQ questions match the JSON-LD exactly (single source of truth — no drift).
- A `noindex` page emits no AEO JSON-LD.
- `bun test`, `bun run build`, `bun run lint` clean.

## Risks
- FAQ content / schema drift → one source of truth feeding both the visible section and the JSON-LD.
- The `aeo` field must be a built-in (like `seo`) so it's seeded on every page/postType table.

## Related
- Audit + source synthesis: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO feature (the template): `src/core/seo/`, `docs/features/seo.md`
- GEO plan: `docs/plans/geo.md`
