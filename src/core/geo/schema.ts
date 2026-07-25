/**
 * GEO settings schemas — the persisted shapes for generative-engine-targeted
 * data: the brand's entity `sameAs` graph (the independent mentions LLMs use
 * to verify identity) and the `llms.txt` / `llms-full.txt` opt-in.
 *
 * `SiteGeoSettings` lives under `site.settings.geo`. GEO is site-scoped rather
 * than per-target (entity identity and AI-crawler licensing are site-wide
 * decisions), so there is no per-target GEO cell.
 *
 * Pure leaf module: no imports from publisher, server, or admin code.
 */

import { Type, type Static } from '@core/utils/typeboxHelpers'
import { compiledCheck } from '@core/utils/typeboxCompiler'

// ---------------------------------------------------------------------------
// Entity sameAs — canonical profiles cited as identity proof
// ---------------------------------------------------------------------------

export const GeoEntitySameAsSchema = Type.Object({
  linkedinUrl: Type.Optional(Type.String()),
  youtubeUrl: Type.Optional(Type.String()),
  wikidataUrl: Type.Optional(Type.String()),
  githubUrl: Type.Optional(Type.String()),
  redditUrl: Type.Optional(Type.String()),
  wikipediaUrl: Type.Optional(Type.String()),
})

export type GeoEntitySameAs = Static<typeof GeoEntitySameAsSchema>

// ---------------------------------------------------------------------------
// llms.txt — opt-in AI content licensing
// ---------------------------------------------------------------------------

export const LlmsTxtSettingsSchema = Type.Object({
  /** Opt-in for `/llms.txt` (concise site summary for LLMs). */
  enabled: Type.Optional(Type.Boolean()),
  /** Opt-in for `/llms-full.txt` (fuller content — a content-licensing decision). */
  fullEnabled: Type.Optional(Type.Boolean()),
})

export type LlmsTxtSettings = Static<typeof LlmsTxtSettingsSchema>

// ---------------------------------------------------------------------------
// SiteGeoSettings — site-wide GEO config (site.settings.geo)
// ---------------------------------------------------------------------------

export const SiteGeoSettingsSchema = Type.Object({
  /** Organization/brand name used as the entity label. Falls back to site name. */
  entityName: Type.Optional(Type.String()),
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
