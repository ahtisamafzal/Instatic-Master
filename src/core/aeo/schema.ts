/**
 * AEO metadata schemas — the persisted shapes for answer-engine-targeted data.
 *
 * `AeoMetadata` is the structured object intended for `cells_json.aeo` on
 * `page` and `postType` rows: FAQ question/answer pairs, How-to steps, and
 * Speakable CSS selectors. `SiteAeoSettings` lives under `site.settings.aeo`
 * for site-wide answer defaults.
 *
 * Pure leaf module: no imports from publisher, server, or admin code.
 */

import { Type, type Static } from '@core/utils/typeboxHelpers'
import { compiledCheck } from '@core/utils/typeboxCompiler'

// ---------------------------------------------------------------------------
// Per-target AEO data (cells_json.aeo)
// ---------------------------------------------------------------------------

export const FaqEntrySchema = Type.Object({
  question: Type.String({ minLength: 1 }),
  answer: Type.String({ minLength: 1 }),
})

export type FaqEntry = Static<typeof FaqEntrySchema>

export const HowToStepSchema = Type.Object({
  name: Type.Optional(Type.String()),
  text: Type.String({ minLength: 1 }),
})

export type HowToStep = Static<typeof HowToStepSchema>

export const HowToSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  steps: Type.Array(HowToStepSchema, { minItems: 1 }),
})

export type HowTo = Static<typeof HowToSchema>

export const AeoMetadataSchema = Type.Object({
  faq: Type.Optional(Type.Array(FaqEntrySchema, { minItems: 1 })),
  howTo: Type.Optional(HowToSchema),
  /** CSS selectors marking the answer-bearing content for voice/assistant extraction. */
  speakableCssSelectors: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
})

export type AeoMetadata = Static<typeof AeoMetadataSchema>

/**
 * Tolerant parse for `cells_json.aeo` blobs read from storage. Returns
 * `undefined` for anything that isn't a valid AeoMetadata object — a corrupt
 * AEO cell must never prevent loading the row.
 */
export function parseAeoMetadata(raw: unknown): AeoMetadata | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return compiledCheck(AeoMetadataSchema, raw) ? (raw as AeoMetadata) : undefined
}

// ---------------------------------------------------------------------------
// SiteAeoSettings — site-wide answer defaults (site.settings.aeo)
// ---------------------------------------------------------------------------

export const SiteAeoSettingsSchema = Type.Object({
  /** Default CSS selector applied when a target omits `speakableCssSelectors`. */
  defaultSpeakableSelector: Type.Optional(Type.String()),
})

export type SiteAeoSettings = Static<typeof SiteAeoSettingsSchema>

/**
 * Tolerant parse for `site.settings.aeo`. Invalid blobs become `undefined`
 * (site loads with no AEO defaults rather than failing).
 */
export function parseSiteAeoSettings(raw: unknown): SiteAeoSettings | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return compiledCheck(SiteAeoSettingsSchema, raw) ? (raw as SiteAeoSettings) : undefined
}
