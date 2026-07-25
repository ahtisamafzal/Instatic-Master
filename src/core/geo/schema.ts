/**
 * GEO settings schemas — the persisted shapes for generative-engine-targeted
 * data: the brand's entity `sameAs` identity graph (the independent mentions
 * LLMs use to verify identity) and the `llms.txt` opt-in.
 *
 * `SiteGeoSettings` lives under `site.settings.geo`. GEO is site-scoped rather
 * than per-target (entity identity and AI content licensing are site-wide
 * decisions), so there is no per-target GEO cell.
 *
 * Pure leaf module: no imports from publisher, server, or admin code.
 */

import { Type, type Static } from '@core/utils/typeboxHelpers'
import { compiledCheck } from '@core/utils/typeboxCompiler'

// ---------------------------------------------------------------------------
// Entity sameAs — extensible list of canonical profile URLs (identity proof)
// ---------------------------------------------------------------------------

export const GeoEntitySameAsEntrySchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  url: Type.String({ minLength: 1 }),
})

export type GeoEntitySameAsEntry = Static<typeof GeoEntitySameAsEntrySchema>

/** Ordered list of profile URLs cited as identity proof (LinkedIn, YouTube, Wikidata, GitHub, …). */
export const GeoEntitySameAsSchema = Type.Array(GeoEntitySameAsEntrySchema)

export type GeoEntitySameAs = Static<typeof GeoEntitySameAsSchema>

// ---------------------------------------------------------------------------
// llms.txt — opt-in AI content summary
// ---------------------------------------------------------------------------

export const LlmsTxtSettingsSchema = Type.Object({
  /** Opt-in for `/llms.txt`. Default off. */
  enabled: Type.Optional(Type.Boolean()),
  /** Optional custom intro line above the curated links (falls back to the site SEO description). */
  intro: Type.Optional(Type.String()),
  /** Target ids (`page:<rowId>` / `row:<rowId>`) excluded from the links section. */
  excludedTargets: Type.Optional(Type.Array(Type.String())),
})

export type LlmsTxtSettings = Static<typeof LlmsTxtSettingsSchema>

// ---------------------------------------------------------------------------
// SiteGeoSettings — site-wide GEO config (site.settings.geo)
// ---------------------------------------------------------------------------

export const SiteGeoSettingsSchema = Type.Object({
  sameAs: Type.Optional(GeoEntitySameAsSchema),
  llmsTxt: Type.Optional(LlmsTxtSettingsSchema),
})

export type SiteGeoSettings = Static<typeof SiteGeoSettingsSchema>

/**
 * Tolerant parse for `site.settings.geo`. Invalid blobs become `undefined`
 * (site loads with no GEO config rather than failing).
 */
export function parseSiteGeoSettings(raw: unknown): SiteGeoSettings | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return compiledCheck(SiteGeoSettingsSchema, raw) ? (raw as SiteGeoSettings) : undefined
}
