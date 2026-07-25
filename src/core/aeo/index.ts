/**
 * @core/aeo — public barrel.
 *
 * The Answer Engine Optimization engine: persisted schemas (FAQ, How-to,
 * Speakable), the tolerant resolver, and schema.org JSON-LD builders
 * (`FAQPage`, `HowTo`, `Speakable`). Imported by the publisher (which composes
 * AEO entities alongside SEO/GEO and owns serialization). Pure leaf: no
 * imports from publisher, server, or admin code.
 *
 * Deep imports are gated by `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`.
 */

export {
  FaqEntrySchema,
  HowToStepSchema,
  HowToSchema,
  AeoMetadataSchema,
  SiteAeoSettingsSchema,
  parseAeoMetadata,
  parseSiteAeoSettings,
  type FaqEntry,
  type HowToStep,
  type HowTo,
  type AeoMetadata,
  type SiteAeoSettings,
} from './schema'

export {
  resolveAeoMetadata,
  type ResolveAeoInput,
  type ResolvedAeoMetadata,
} from './resolve'

export {
  buildFaqPage,
  buildHowTo,
  buildSpeakable,
  buildAeoJsonLdEntities,
  type AeoJsonLdEntity,
  type AeoJsonLdContext,
} from './jsonLd'

export {
  computeAeoReport,
  aeoScoreTier,
  type AeoReport,
  type AeoCheck,
  type AeoCheckId,
  type AeoCheckStatus,
  type AeoScoreTier,
} from './health'
