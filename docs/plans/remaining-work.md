# Remaining Work — AEO + GEO Implementation

Updated after the full build session. Most items are now DONE; this doc reflects the current state.

## ✅ DONE (committed on `feat/seo-aeo-geo`, pushed to fork)

### SEO platform (from PR #53 integration)
- Per-page metadata, canonical, OG/X, JSON-LD, robots.txt, sitemap.xml.
- `/admin/tools/seo` workspace with 13-check health scoring (expanded from 6).
- commit `6b91e619` (integration) + `e6c42bd5` (13-check expansion).

### GEO — fully built
- **Stage 0**: scaffold revision (extensible `sameAs` array), barrel gate.
- **Stage 1**: `/llms.txt` endpoint + router + Vite exemption (fixes robots/sitemap in dev too).
- **Stage 2**: `sameAs` enrichment into Organization JSON-LD (`seoHead.ts`).
- **Stage 3**: admin workspace (`GeoPage` — sameAs editor + llms.txt toggle), site-scoped API, capabilities, route, nav.
- **Stage 4 (partial)**: 7-check health scoring module; capabilities in core + meta + Admin role.
- Commits: `e3647a71`, `d8afa37a`, `9db509d5`, `a2353047`, `a833be07`.

### AEO — workspace + publisher built
- **Stage 1a**: `aeoMetadata` field type registered across 12 data-model files.
- **Stage 1c**: admin workspace (`AeoPage` — per-page FAQ editor), per-target API, capabilities, route, nav.
- **Publisher wiring**: `pageFromRow` cells.aeo mapping + `buildPageRenderSeo`/`buildRowRenderSeo` compose `buildAeoJsonLdEntities` → `FAQPage` JSON-LD emits on published pages.
- **8-check health scoring** module (hasFaq, faqCount, answerDetail, questionFormat, noDuplicates, hasSpeakable, hasHowTo, coverage).
- Commits: `e808007e`, `2550b91c`, `9db509d5`, `950350c3`, `a2353047`, `a833be07`.

### MCP tools — all three disciplines accessible to AI agents
- 8 headless server-resolved tools: `seo_read_site`, `seo_update_site`, `seo_read_targets`, `seo_update_target`, `aeo_read_targets`, `aeo_update_target`, `geo_read_site`, `geo_update_site`.
- Connector capabilities updated (all three tokens granted seo/aeo/geo read+manage).
- commit `29db6263`.

### NK page data — written via MCP + published
- SEO: title (44 chars), description (105 chars), canonical, OG image+alt, X image+alt, X card.
- AEO: 15 FAQ Q/A pairs covering the full service offering.
- GEO: llms.txt enabled + intro line.
- Published: 28 pages, FAQPage JSON-LD confirmed emitting.

---

## 🔵 REMAINING

### GEO Stage 4 tail
- [ ] Tests for `serveLlmsTxt` (mirror `src/core/seo/__tests__/robots.test.ts`).
- [ ] Graduate `geo.md` → `docs/features/geo.md`; update `docs/README.md` + `docs/reference/capabilities.md`.

### AEO hardening
- [ ] Architecture gate: add `@core/aeo` to `no-core-barrel-deep-imports.test.ts` (the scaffold comment claims it; it's false until added).
- [ ] Tests for the AEO handler + publisher composition.
- [ ] Graduate `aeo.md` → `docs/features/aeo.md`.
- [ ] **Cell-array rendering spike** (D1): how a visible FAQ content module reads `aeo.faq[]` from a cell. Bindings resolve scalars; Loops iterate table rows; neither iterates an array nested in a single cell. Likely the module reads the entry's aeo cell directly (like `readAeoCell`) and renders the list itself.
- [ ] **FAQ content module** (D1): a first-party `base.*` block that renders visible FAQs bound to `cells_json.aeo` — single source of truth for visible + JSON-LD.

### SEO health test update
- [ ] `src/core/seo/__tests__/health.test.ts` references old check IDs (`socialImage`); needs test cases for the 7 new checks.
- [ ] `src/__tests__/admin/seoWorkspace.test.tsx` testId `seo-improvement-socialImage` may need updating.

### Housekeeping
- [ ] Commit/sort the 10 uncommitted NK tweaks + `bun.lock` (gitignore the large artifacts: `fluxora-site/`, `neuralkinetics-ai-search-standalone/`, `.codex/`).
- [ ] Revert the `optimizeDeps.include` band-aid in `vite.config.ts` (real fix was `bun install`).
- [ ] Run the full `bun test` suite to confirm no regressions across all the changes.
- [ ] `geo.md` cosmetic: "(Stage 1.5)" → "Stage 1, step 5".

---

## Suggested order
1. `@core/aeo` barrel gate (quick, makes the scaffold honest).
2. AEO cell-array spike → FAQ content module (the visible-FAQ single-source-of-truth).
3. Tests for all three (GEO llms.txt, AEO handler/publisher, SEO 13-check health).
4. Docs graduation (plans → features).
5. Housekeeping (NK tweaks, optimizeDeps revert, full test suite).

## Related
- Detailed plans: `docs/plans/aeo.md`, `docs/plans/geo.md`
- Reuse map: `docs/plans/reuse-from-seo.md`
- Audit + sources: `docs/neuralkinetics-site/aeo-geo-seo-audit.md`
- SEO template: `src/core/seo/`, `server/handlers/cms/seo.ts`, `src/admin/pages/seo/`
