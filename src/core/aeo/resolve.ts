/**
 * AEO resolver — turns persisted AEO data into the resolved shape the JSON-LD
 * builders consume. Mirrors the SEO resolver's "tolerant of missing data"
 * contract: a target with no AEO cell resolves to an empty `AeoMetadata`.
 */

import { parseAeoMetadata, parseSiteAeoSettings, type AeoMetadata } from './schema'

export interface ResolveAeoInput {
  /** Raw `cells_json.aeo` blob for the target (page/entry). */
  rawTargetMetadata: unknown
  /** Raw `site.settings.aeo` blob. */
  rawSiteSettings: unknown
}

export interface ResolvedAeoMetadata {
  metadata: AeoMetadata
}

export function resolveAeoMetadata(input: ResolveAeoInput): ResolvedAeoMetadata {
  const target = parseAeoMetadata(input.rawTargetMetadata) ?? {}
  const site = parseSiteAeoSettings(input.rawSiteSettings)

  // Site-level default for speakable, applied only when the target omits it.
  if (!target.speakableCssSelectors && site?.defaultSpeakableSelector) {
    target.speakableCssSelectors = [site.defaultSpeakableSelector]
  }

  return { metadata: target }
}
