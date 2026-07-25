# NeuralKinetics — SEO / AEO / GEO Audit & Implementation Plan

A single source of truth for the SEO, AEO, and GEO state of the NeuralKinetics site, how each gap was identified, and the plan to close it. **Updated 2026-07-24 after a material upstream change:** the Instatic project now has a draft PR (#53) that delivers the entire **SEO platform layer**, which absorbs most of the original "build it ourselves" work. What remains genuinely ours is the **AEO** and **GEO** layers (not covered by #53) plus the site/content work.

This covers the page at `http://127.0.0.1:5173/neuralkinetics-ai-search` — the marketing page for NeuralKinetics, a provider of **SEO / AEO / GEO services**. Because NeuralKinetics sells these disciplines, the bar is not "acceptable" — it is "exemplary." A prospect running the site through any SEO/AEO checker must see a site that practices what it sells.

> Scope note: this folder (`docs/neuralkinetics-site/`) is client-site content, not Instatic-system documentation. It is intentionally kept separate from the Instatic `docs/` feature/reference tree governed by `docs/CONVENTIONS.md`. Codebase claims are anchored to real file paths and were independently verified on 2026-07-24.

---

## TL;DR

- **All three disciplines are now built and live on `feat/seo-aeo-geo`:** SEO (PR #53 integration + 13-check health scoring), GEO (engine + `/llms.txt` endpoint + admin workspace + 7-check scoring), AEO (field type + admin workspace + publisher wiring + 8-check scoring).
- **MCP tools (8)** expose all three to AI agents: read/write SEO targets, AEO FAQ, GEO settings — headless, capability-gated.
- **NK AI-search page** has SEO metadata (title/description/canonical/OG/X), 15 FAQ entries (FAQPage JSON-LD emitting), and llms.txt enabled — all written via MCP and published.
- **What's NOT done:** AEO visible FAQ content module (cell-array spike), tests for all three, docs graduation, housekeeping (NK tweaks commit, optimizeDeps revert, full test suite).
- Commits: 16 feature/fix commits from `6b91e619` through `e6c42bd5`, all on `feat/seo-aeo-geo`, pushed to fork.

---

## 1. The page under audit

| Field | Value |
|-------|-------|
| Public URL | `http://127.0.0.1:5173/neuralkinetics-ai-search` |
| Page title (stored) | "NeuralKinetics - AI Search" |
| Slug | `neuralkinetics-ai-search` |
| Page ID | `96193ab7-705f-4057-a268-deae4ea22735` |
| Root node ID | `nk-page` |
| Contact signals on page | `hello@neuralkinetics.ai`, `+44 (0)20 3890 1184` |
| Audit date | 2026-07-24 (re-verified against codebase + upstream PR survey) |

---

## 2. How the gaps were identified (method)

Findings are reproducible from the live server, the codebase, and the upstream repo:

1. **MCP connection.** The Instatic site is exposed as an MCP server at `http://127.0.0.1:5173/_instatic/mcp`. `site_list_documents` confirmed the page and returned its ID/root node.
2. **Live HTML fetch.** `GET /neuralkinetics-ai-search` returns server-rendered HTML (body content present — good). `<head>`, meta tags, `<html>` tag, and headings were parsed from this response.
3. **Standard SEO endpoints.** `GET /robots.txt` and `/sitemap.xml` were requested. **In dev (`:5173`) both return the React SPA shell** (Vite proxy fallthrough); **in production they return the site's designed 404**. Both broken; different mechanisms.
4. **Structured-data scan.** Count of `application/ld+json` blocks + listing of `<meta>`/`<link rel>` tags from the served HTML.
5. **Codebase trace.** `buildDocumentMetaTags`, the page/row schemas, `PUBLIC_ORIGIN`, the publish seams, and the static-asset paths were read directly (anchors in §8).
6. **Cross-source synthesis.** Findings validated against four external references (§6).
7. **Upstream PR survey (2026-07-24).** `gh pr list` + `gh issue list` over `CoreBunch/Instatic`, plus inspection of landed commits in v0.0.13 and the open draft PR #53 (file list, description, rebasing it onto `main` in an isolated worktree to assess merge health).

---

## 3. What is present (working)

- `<title>NeuralKinetics - AI Search</title>` — real, descriptive. (Note: a recent upstream fix, **#217**, corrected a bug where every page's `<title>` leaked from its wrapping template; titles are now correct.)
- `<html lang="en">` — correct language attribute.
- Exactly **one `<h1>`** and a logical **h1 → h2 → h3** hierarchy.
- Strong, well-structured marketing copy (SEO vs AEO vs GEO, keyword-intent framework, E-E-A-T principles, process, contact).
- **Server-side rendering of body content on every public route** — confirmed-good; the publisher bakes pages/entry-templates/404 at publish time and defers only detected dynamic subtrees.
- Contact details (email + phone) present.

---

## 4. Gap status after the upstream change

Severity: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low / contested
Status legend: 🔒 **closed by PR #53** (once adopted) · 🟦 **AEO — ours** · 🟩 **GEO — ours** · 🟧 **content — ours (Track B)** · ⚙️ **platform/config — ours**

### 4.1 Gaps closed by PR #53 (when adopted) — no longer build work
| Original gap | How #53 closes it |
|---|---|
| #1 `robots.txt` not served | `server/publish/seoEndpoints.ts` — first-party `/robots.txt` with **AI-crawler toggles** (training: GPTBot, Google-Extended, CCBot, Applebot-Extended, meta-externalagent; answer: OAI-SearchBot, PerplexityBot, ChatGPT-User, Claude-SearchBot), cached per publishVersion. |
| #2 `sitemap.xml` not served | Same endpoint module — `/sitemap.xml` generated from the published snapshot. |
| #3 no per-page description | `SeoMetadata` in `cells_json.seo` on page + postType tables; emitted via `src/core/publisher/seoHead.ts`. |
| #4 no canonical | `seoHead.ts` emits canonical; absolute URLs from configured `PUBLIC_ORIGINS`. |
| #5 no OG / Twitter | `seoHead.ts` emits Open Graph (og:locale, og:site_name, article:*_time) + X cards. |
| #6 no `<meta robots>` | `seoHead.ts` emits `noindex` (never a silent `nofollow`); per-page override. |
| #12 zero JSON-LD | `seoHead.ts` emits WebSite, Organization, Article, BreadcrumbList. |
| #13 orphaned row-level SEO | #53 **destructively replaces** the flat `seoTitle`/`seoDescription` with the structured `seo` field — so this gap is resolved (the old fields go away). |
| #14 pages have no SEO fields | `seoMetadata` is a built-in field on `page` tables too. |
| Origin threading (§8.4) | Resolved by #53: baked HTML uses `PUBLIC_ORIGINS`; dynamic endpoints fall back to request origin. (Multi-origin selection still worth confirming against the running workspace.) |

### 4.2 AEO gaps remaining — ours to build on top of #53 🟦
| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| A1 | **No `FAQPage` schema** | 🔴 | The headline AEO win (Webflow: +24% impressions, +300 citations). #53 has JSON-LD infra but not this type. Pairs with the visible FAQ section (Track B). |
| A2 | No `HowTo` / `Q&A` / `Education Q&A` schema | 🟠 | Answer-targeted types for process and comparison content. |
| A3 | No `Speakable` schema | 🟡 | For voice/assistant answer extraction. |
| A4 | No answer-first content tooling / "People Also Ask" targeting | 🟡 | Editorial pattern, not just schema. |

### 4.3 GEO gaps remaining — ours to build on top of #53 🟩
| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| G1 | **No `llms.txt` / `llms-full.txt`** | 🟡 | #53 has robots AI-crawler toggles (adjacent) but no llms files. Google ignores these; ChatGPT/Claude/Perplexity ecosystem expects them. Opt-in; `llms-full.txt` is a content-licensing decision. |
| G2 | No entity / citation tooling | 🟠 | GEO hinges on being cited; no tracking or entity-consistency tooling. |
| G3 | No AI-crawler analytics / monitoring | 🟠 | Can't show "AI cites you" without measuring it. |
| G4 | No off-site presence guidance / integrations | 🟡 | Reddit, LinkedIn, YouTube, Wikidata, GitHub — editorial + structural, largely outside the CMS. |

### 4.4 Content / credibility gaps — ours (Track B) 🟧
| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| C1 | No FAQ section | 🔴 | Highest-impact content gap; feeds AEO `FAQPage` (A1). |
| C2 | No case studies shown | 🟠 | Copy promises them. |
| C3 | No team / author / expertise block | 🟠 | No human credibility signals. |
| C4 | No original research / proprietary data | 🟠 | Biggest differentiator per sources. |
| C5 | No review-platform presence (Clutch, G2, Trustpilot, Google) | 🟠 | AI tools scrape these for credibility. |
| C6 | No image `alt` text audited | 🟡 | |
| C7 | No outbound citations / source links | 🟡 | |
| C8 | Copy is generic, not unique POV | 🟡 | Not "non-commodity." |
| C9 | No video / YouTube presence | 🟡 | Most-cited domain in AI Overviews. |

### 4.5 Site / architecture gaps ⚙️
| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| S1 | ~28 flat pages, no clear nav hierarchy | 🟡 | Off-topic demo pages may dilute topical authority. **#53 adds per-page `noindex`**, so `noindex`-the-demos becomes viable without deletes. |
| S2 | BreadcrumbList readability | 🟡 | #53 **auto-emits** `BreadcrumbList` from URL segments for routes ≥2 deep (`jsonLd.ts:34-58`) — not a build task. Residual work is editorial: names come from URL slugs, so SEO-friendly slugs + a real nav hierarchy make them readable; a flat site triggers few. |
| S3 | No Google Business Profile | 🟡 | UK phone → local signals in scope. |
| S4 | NAP incomplete | 🟡 | Phone present, no address; no cross-directory consistency. |
| S5 | Performance / Core Web Vitals unmeasured | 🟠 | LCP/INP/CLS/TTFB + image compression. |
| S6 | Mobile responsiveness not verified | 🟡 | |
| S7 | Broken links / crawlability pass not done | 🟡 | |

### 4.6 Measurement gaps ⚙️
| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| M1 | No Search Console + generative-AI program enrollment | 🟡 | Enrollment is a prerequisite for AI Overviews eligibility, not just indexing. |
| M2 | No GA4 AI-referral tracking + bot monitoring | 🟡 | Can't sell "measure AI visibility" without measuring own. |
| M3 | No citation tracking (e.g. Profound) | 🟡 | |
| M4 | No 30-day refresh cadence | 🟡 | |

---

## 5. Source reconciliation (read before quoting tactics to prospects)

These references were reviewed. Where they disagree, the prospect-facing position is noted.

- **`llms.txt` / `llms-full.txt`** — Google **ignores** these (harmless). Verndale and the LinkedIn experts recommend them for the ChatGPT/Claude/Perplexity ecosystem; Verndale recommends serving them as dynamic, cacheable endpoints (maps onto Instatic's bake-at-publish model). **Position:** add as opt-in; never claim they help on Google.
- **Structured data** — Google calls it "not required" for generative AI but useful for rich results. Every other source treats it as foundational. **Position:** mandatory for a provider; the Webflow results (+24% impressions, +300 citations from FAQ schema) are the headline proof point.
- **JavaScript rendering** — Google can render JS; LinkedIn experts warn most AI crawlers do not. **Position:** every page must server-render. **Verified satisfied** for Instatic (§3); keep as a regression check.
- **"AEO/GEO hacks"** — Google debunks content "chunking", rewriting solely for AI, and inauthentic mentions. **Position:** lead with foundational SEO + unique content; treat AEO/GEO as SEO done well, not a separate hack stack.
- **Search Console eligibility** — a site must be **enrolled in the Search Console generative-AI features program** to be eligible for AI Overviews/AI Mode, not merely indexed. Treat enrollment as a prerequisite (M1).

---

## 6. References reviewed

External:
| # | Source | Key contribution |
|---|--------|------------------|
| 1 | **Webflow / Aakash Gupta & Josh Grant** — "The Ultimate Guide to AEO and GEO" | SEO/AEO/GEO diagnostic framework; FAQ-schema proof point (+24% impressions, +300 citations); 30-day refresh cadence. |
|   | URL | https://www.news.aakashg.com/p/guide-aeo-geo |
|   | Caveat | **Paywalled after Step 2** — only Steps 1–2 are independently verifiable; do not quote Steps 3–6 as confirmed. |
| 2 | **Verndale** — "How to Jumpstart Your AEO & GEO Strategy" | 5 steps: structured data/schema, metadata + E-E-A-T, `llms.txt`/`llms-full.txt`, trusted-source presence, performance/CWV. |
|   | URL | https://www.verndale.com/insights/digital-marketing/aeo-geo-ai-sitecore-website-optimization |
| 3 | **Google Search Central** — "Optimizing your website for generative AI features on Google Search" | Official position: generative-AI search is still SEO; RAG + query fan-out; non-commodity content; mythbusting (llms.txt ignored, no chunking, no special schema); Search Console Generative AI report; agentic readiness. |
|   | URL | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide |
| 4 | **LinkedIn expert collection** — "Step-by-Step Guide for SEO, AEO, and GEO Strategy" (Diggity, Donnelly, Mahmood, Bolis, Manela) | Review-platform trust signals; AI-bot `robots.txt` allowlist; entity context in copy; facts in 3 formats; 40–60 word answer blocks; topical authority + prune off-topic pages; YouTube; Wikidata/GitHub datasets; GA4 AI-referral tracking; the SEO/AEO/GEO/AIO/SXO 5-layer stack. |
|   | URL | https://www.linkedin.com/top-content/marketing/seo-techniques/step-by-step-guide-for-seo-aeo-and-geo-strategy/ |

Internal (upstream `CoreBunch/Instatic`):
| # | Item | Relevance |
|---|------|-----------|
| 5 | **PR #53** — `feat(seo): SEO & AEO workspace` (draft, DavidBabinec) | Delivers the SEO platform layer; absorbs §4.1. Analyzed in §8.0. Branch `feat/seo-aeo-workspace`. |
| 6 | **#217** `fix(templates): stop leaking the template's title into published pages` (landed, v0.0.12) | `<title>` now matches the actual page/entry, not the wrapping template. SEO-correctness fix. |
| 7 | **#220** `fix(editor): make page slug editable via a new Page settings dialog` (landed, v0.0.13) | New `PageSettingsDialog` + `usePageSettingsDialogs` — the natural UI home for per-page SEO fields if we extend beyond #53. |
| 8 | **#245** `feat(ai): redesign settings and add MCP OAuth` (landed, v0.0.13) | Settings UI redesign (site-wide SEO config home) + MCP OAuth (affects connector auth). |
| 9 | **#225** (open issue) `publish.html filter context lacks the page's public path` | Prerequisite only if we emit per-entry metadata via the `publish.html` filter. #53 sidesteps it by using `PUBLIC_ORIGINS` + request-origin fallback — confirm it's not needed once #53 runs. |

---

## 7. Implementation checklist (revised)

Source key: **[W]** Webflow · **[V]** Verndale · **[G]** Google · **[L]** LinkedIn. Items marked 🔒 are delivered by PR #53 and need only **adoption + verification**, not new code.

### Track 0 — Adopt PR #53 (prerequisite to everything below)
- [ ] Resolve the rebase onto current `main` (see §8.0 conflict set) — or merge instead of rebase if cleaner given #53 contains merge commits.
- [ ] Run `bun install`, `bun test`, `bun run build`, `bun run lint` on the integrated branch.
- [ ] Exercise the `/admin/tools/seo` workspace; confirm robots/sitemap/OG/canonical/JSON-LD render for the NeuralKinetics page.
- [ ] Confirm the destructive changes are acceptable: `metaTitle`/`metaDescription` settings removed; local dev DB needs re-seeding; `seoTitle`/`seoDescription` flat fields replaced by structured `seo`.
- [ ] Verify against the live NK page: `curl -i /robots.txt` → 200 `text/plain`; `curl -i /sitemap.xml` → 200 `application/xml`; view-source has canonical + OG + JSON-LD (both `:5173` and prod).

### Track AEO — build on #53's JSON-LD foundation 🟦
- [ ] **A1 `FAQPage` schema** driven by the visible FAQ content (single source of truth, no drift) `[W,V,L]` — Verify: Rich Results Test parses FAQPage; questions match the visible section.
- [ ] A2 `HowTo` / `Q&A` schema for process/comparison content `[V,L]`
- [ ] A3 `Speakable` for voice/assistant extraction `[L]`
- [ ] A4 Answer-first (40–60 word) blocks + "People Also Ask" targeting in the editor workflow `[L]`

### Track GEO — build on #53's crawl-control foundation 🟩
- [ ] **G1 `llms.txt` / `llms-full.txt`** as bake-at-publish, cacheable endpoints (opt-in; `llms-full.txt` = content-licensing decision) `[G,V,L]` — Verify: `curl -i /llms.txt` → 200 `text/plain`.
- [ ] G2 Entity-consistency tooling (Organization/`sameAs` to LinkedIn/YouTube/Wikidata) `[L]`
- [ ] G3 AI-crawler analytics / citation monitoring (e.g. Profound) `[W,L]`
- [ ] G4 Off-site presence plan: Reddit, LinkedIn, YouTube, Wikidata, GitHub `[V,L]`

### Track B — content & credibility (site edits via editor/MCP) 🟧
- [ ] **C1 FAQ section** (highest-impact; feeds A1) `[W,V,L]`
- [ ] C2 Case studies `[W,V]`
- [ ] C3 Team / author / expertise block `[V]`
- [ ] C4 Original research / proprietary data `[W,G]`
- [ ] C5 Review-platform presence: Clutch, G2, Trustpilot, Google `[L]`
- [ ] C6 Image `alt` text audit `[G]`
- [ ] C7 Outbound citations / source links `[V,L]`
- [ ] C8 Non-commodity, unique-POV copy rewrite + entity context ("NeuralKinetics…") `[G,L]`
- [ ] C9 Video / YouTube presence `[G,L]`

### Track S — site / architecture ⚙️
- [ ] S1 Resolve demo pages: **`noindex`** (now viable via #53's per-page robots) or delete `[L]`
- [ ] S2 Nav hierarchy + internal linking (3-click) — for UX + topical authority (BreadcrumbList auto-emits from URL depth per #53) `[L]`
- [ ] S3 Google Business Profile claimed + complete `[L]`
- [ ] S4 NAP consistency across directories `[L]`
- [ ] S5 Performance / Core Web Vitals baseline (Lighthouse: LCP/INP/CLS/TTFB; image compression) `[V,L]`
- [ ] S6 Mobile responsiveness check `[L]`
- [ ] S7 Broken-links / crawlability pass `[L]`

### Track M — measurement ⚙️
- [ ] M1 Search Console verified + **generative-AI features program enrollment** `[G]`
- [ ] M2 GA4 AI-referral tracking + bot monitoring `[L]`
- [ ] M3 Citation tracking `[W]`
- [ ] M4 30-day refresh cadence on top pages `[W]`

### Track E — emerging
- [ ] Agentic readiness: semantic HTML, accessibility tree, monitor UCP protocol `[G]`

---

## 8. Implementation design

### 8.0 PR #53 — adoption analysis (the new primary path)

**What it delivers** (from its description + file list; confirm by running):
- `src/core/seo/` (new barrel-gated engine): `SeoMetadata` in `cells_json.seo`; `SiteSeoSettings` under `site.settings.seo`; two-stage title resolution shared by publisher + admin previews.
- `src/core/publisher/seoHead.ts`: title, description, canonical, `noindex`, OG (og:locale/og:site_name/article:*_time), X cards, JSON-LD (WebSite, Organization, Article, BreadcrumbList).
- `server/publish/seoEndpoints.ts`: first-party `/robots.txt` + `/sitemap.xml`, AI-crawler toggles (training vs answer bots), cached per `publishVersion`, dispatched before static assets/public rendering.
- `src/admin/pages/seo/`: full workspace at `/admin/tools/seo` (Meta/Robots/Sitemap tabs, Search/OG/X/Schema previews, length meters, AI suggestions via `POST /seo/generate`).
- `server/handlers/cms/seo.ts`, `seoGenerate.ts`; new `seo.read`/`seo.manage` capabilities (38 total, was 36); `docs/features/seo.md`; ~1,000 lines of tests.

**What it does NOT deliver** (the AEO/GEO gap that's now ours):
- AEO: no `FAQPage`, `HowTo`, `Q&A`, `Education Q&A`, or `Speakable` schema; no answer-first/PAA tooling.
- GEO: no `llms.txt`/`llms-full.txt`; no entity/citation tooling; no AI-crawler analytics. (It has robots AI-crawler toggles + Organization schema, which are adjacent but not a GEO capability.)

**State:** draft · opened 2026-06-12 · last commit 2026-06-27 · author DavidBabinec (someone else's work) · same-repo branch `feat/seo-aeo-workspace` · 9,299+/357− across 158 files · author claims `bun test` 5438 pass / build+lint clean · **zero human reviews** (2 bot reviews: `github-advanced-security`, `github-code-quality`), zero comments, `mergeable: CONFLICTING` (`mergeStateStatus: DIRTY`) — corroborates the rebase-conflict finding below.
- **Verified design facts** (`src/core/seo/jsonLd.ts:34-58`, docblock `:12-13`): `BreadcrumbList` is **auto-derived from URL segments** (zero-config; emitted only for routes ≥2 segments deep) — so it is not a build task. The docblock also settles two §8.4 open questions — entities requiring absolute URLs are **omitted when no origin is configured** (the origin-degradation rule), and **`noindex` targets emit no JSON-LD** at all (`buildJsonLdEntities` returns `[]`).

**Merge health (verified in an isolated worktree — branch `pr-53-eval`, parked clean at `C:\Users\ahti_\AppData\Local\Temp\opencode\seo-eval`):**
- **Rebase onto `main` v0.0.13 — does not apply.** Fails at commit 2 (`feat(seo)!: replace flat seoTitle/seoDescription with structured seo field`) with conflicts across the data model (`src/core/data/{schemas,fields,cells,pageFromRow}.ts`, `src/core/page-tree/page.ts`) and the content/data workspace UI. Rebase aborted.
- **Merge `main` into the branch — bounded: 13 conflicts, and the data-model rename auto-merges.** Conflicted files: docs (`auth-and-access.md`, `content-workspace.md`, `plugin-system.md`, `reference/capabilities.md`), `server/ai/tools/content/systemPrompt.ts`, the capability util (`src/admin/pages/users/utils/capabilities.ts`), the admin router (`src/admin/router.tsx`), the publisher hook (`src/core/publisher/render.ts`), content workspace UI (`ContentAgentMount.tsx`, `ContentSettingsPanel.tsx`), `OnboardingPanel.tsx`, the `no-plugin-tab-shells` architecture gate, and `Switch.module.css`. Most are **additive** (seo.* capabilities, `/admin/tools/seo` route, `seoHead` wiring) — resolvable with clear intent.

**Recommended path: merge, not rebase.** A 28-commit branch containing its own merge commits is the worst rebase candidate; the merge trial confirms a small, mostly-additive conflict set with the data-model change auto-resolving. Decision to make before implementation: resolve-and-merge ourselves now, or wait for the upstream author to rebase (no human reviews yet; may be stalled).

### 8.1–8.6 Original "build it ourselves" design (RETAINED AS FALLBACK)
The anchors below were verified against current `main` on 2026-07-24. They describe how to build the SEO platform layer from scratch. **With PR #53 adoptable, this is now a fallback** — but the seams remain the integration points for the **AEO** and **GEO** layers we still must build.
- **Vite dev proxy:** `vite.config.ts:38-41` — extension-bearing paths fall through to the SPA; backend `.something` routes need explicit exemptions. (#53's `seoEndpoints.ts` must still clear this in dev.)
- **Publish/router root-file seam:** `writeStaticAsset` (`server/publish/staticArtefact.ts:480`) is generic but called only in `server/publish/publishSite.ts:290` (full publish) — **incremental-publish drift risk** for any baked root file. `readStaticAsset` (`staticArtefact.ts:503`) is consumed in `server/router.ts:213,557` for runtime assets + site CSS only.
- **Head seam:** `buildDocumentMetaTags` (`src/core/publisher/render.ts:316-331`) — today emits title/site-wide desc/favicon/lang only. Second seam: the `publish.html` filter (`server/publish/publishedHtmlPipeline.ts:61-65`).
- **Origin:** `resolvePublicOrigins` (`server/config.ts:69-79`) returns a **list**; consumed only by CSRF today. (#53 threads it into the publisher — confirm its multi-origin canonical selection once running.)
- **Per-page metadata:** flat `seoTitle`/`seoDescription` (`src/core/data/schemas.ts:484-485`) are orphaned (publisher never reads them); `PageSchema` (`src/core/page-tree/page.ts:30-51`) has no SEO fields. (Both replaced destructively by #53.)

### 8.7 Risk register
| Risk | Severity | Mitigation |
|------|----------|------------|
| #53 rebase conflicts cost more than expected / diverge from author intent. | High | Try merge (§8.0 option 2) before committing to a full rebase; keep the author's commit history for reference. |
| #53 is stalled upstream (no reviews) — we carry maintenance of a 9.3k-line fork. | High | Track upstream; prefer to re-sync if the author resumes. |
| #53's destructive settings rename (`metaTitle`/`metaDescription` → `site.settings.seo`) breaks the live NK site. | High | Re-seed local DB; verify the NK site's existing settings migrate; back up before integrating. |
| Incremental-publish drift (root files staled by `publishRow.ts`). | High | Verify #53 regenerates robots/sitemap in the incremental path; if not, fix. |
| AEO `FAQPage` content/schema drift. | Medium | Single source of truth feeding both the visible FAQ and JSON-LD. |
| `llms-full.txt` content licensing. | Medium | Opt-in toggle only. |

---

## 9. Priority guidance

- **Do first:** **Track 0** (adopt #53) — unblocks the SEO foundation everything else builds on. Pick rebase-vs-merge after a quick merge trial.
- **In parallel (no platform dep):** **Track B** content, starting with **C1 FAQ** (highest-impact; later feeds AEO `FAQPage`). This is the work we can start immediately via the editor/MCP.
- **Then:** **Track AEO** (A1 FAQPage first) and **Track GEO** (G1 llms.txt first), building on #53's JSON-LD + crawl-control foundations.
- **Ongoing:** Tracks S and M compound (authority, performance, measurement).
- **Watch:** Track E (agentic) — adopt for future-proofing; don't over-claim.

---

## 10. Status

### Decision history
1. **First audit (2026-07-24):** identified SEO/AEO/GEO gaps; split into Track A (platform) and Track B (content); decision was "fork/fix locally for NK now."
2. **Upstream survey (2026-07-24):** discovered PR #53 already implements the entire SEO platform layer. Decision revised to **adopt #53** rather than build Track A from scratch.
3. **Current shape:** SEO layer = adopt #53 (Track 0). **AEO + GEO layers remain ours to build** on top of #53. Content work (Track B) proceeds independently.

This is a living document. Update the checkboxes in §7 as items ship, and move resolved gaps out of §4. When a tactic's consensus changes (`llms.txt`, schema, agentic), update §5 first so prospect-facing positions stay accurate. When #53 is integrated, replace §8.0 with a pointer to the shipped code and confirm the §8.1–8.6 seams still apply to the AEO/GEO layers.

---

## Related

- Page under audit: `http://127.0.0.1:5173/neuralkinetics-ai-search` (page ID `96193ab7-705f-4057-a268-deae4ea22735`, root node `nk-page`)
- MCP endpoint: `http://127.0.0.1:5173/_instatic/mcp`
- Upstream repo: https://github.com/CoreBunch/Instatic
- PR #53 (SEO layer): branch `feat/seo-aeo-workspace`; local eval worktree `C:\Users\ahti_\AppData\Local\Temp\opencode\seo-eval` (branch `pr-53-eval`)
- External references: see §6
- Instatic system docs (separate concern): `docs/README.md`, `docs/CONVENTIONS.md`
- Verified codebase anchors (current `main`): `vite.config.ts:38-41`, `src/core/publisher/render.ts:300-331`, `src/core/data/schemas.ts:484-485`, `src/core/page-tree/page.ts:30-51`, `server/config.ts:69-79`, `server/publish/publishedHtmlPipeline.ts:61-65`, `server/publish/staticArtefact.ts:480,503`, `server/publish/publishSite.ts:290`, `server/router.ts:213,557`
