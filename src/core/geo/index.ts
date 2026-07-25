/**
 * @core/geo — public barrel.
 *
 * The Generative Engine Optimization engine: persisted site settings (entity
 * `sameAs` graph as an extensible list, `llms.txt` opt-in), the sameAs URL
 * contributor, and the `llms.txt` generator. Imported by the publisher (sameAs
 * enrichment) and the server route layer (`/llms.txt`). Pure leaf: no imports
 * from publisher, server, or admin code.
 *
 * Deep imports are gated by `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`.
 */

export {
  GeoEntitySameAsEntrySchema,
  GeoEntitySameAsSchema,
  LlmsTxtSettingsSchema,
  SiteGeoSettingsSchema,
  parseSiteGeoSettings,
  type GeoEntitySameAsEntry,
  type GeoEntitySameAs,
  type LlmsTxtSettings,
  type SiteGeoSettings,
} from './schema'

export { sameAsUrls } from './jsonLd'

export {
  generateLlmsTxt,
  type LlmsTxtLink,
  type LlmsTxtContext,
} from './endpoints'

export {
  computeGeoReport,
  geoScoreTier,
  type GeoReport,
  type GeoCheck,
  type GeoCheckId,
  type GeoCheckStatus,
  type GeoScoreTier,
} from './health'
