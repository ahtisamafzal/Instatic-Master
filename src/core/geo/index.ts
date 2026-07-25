/**
 * @core/geo — public barrel.
 *
 * The Generative Engine Optimization engine: persisted site settings (entity
 * `sameAs` graph, `llms.txt` opt-in), the Organization identity JSON-LD
 * builder, and the `llms.txt` / `llms-full.txt` generators. Imported by the
 * publisher (entity JSON-LD) and the server route layer (llms endpoints). Pure
 * leaf: no imports from publisher, server, or admin code.
 *
 * Deep imports are gated by `src/__tests__/architecture/no-core-barrel-deep-imports.test.ts`.
 */

export {
  GeoEntitySameAsSchema,
  LlmsTxtSettingsSchema,
  SiteGeoSettingsSchema,
  parseSiteGeoSettings,
  type GeoEntitySameAs,
  type LlmsTxtSettings,
  type SiteGeoSettings,
} from './schema'

export {
  buildOrganizationEntity,
  buildGeoJsonLdEntity,
  type GeoJsonLdEntity,
} from './jsonLd'

export {
  generateLlmsTxt,
  generateLlmsFullTxt,
  type LlmsTxtContext,
} from './endpoints'
