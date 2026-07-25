/**
 * GEO sameAs contributor — extracts the `sameAs` URL list from GEO settings so
 * the publisher can enrich SEO's `Organization` entity with identity-proof
 * links. Per the GEO plan (D1), GEO never emits a standalone Organization —
 * it contributes `sameAs` into the single Organization the publisher builds,
 * avoiding duplicate competing entities.
 *
 * Pure leaf module: depends only on `./schema`.
 */

import type { GeoEntitySameAs } from './schema'

/**
 * Return the profile URLs from a sameAs list, in order, dropping blanks.
 * The publisher merges these into the SEO Organization's `sameAs` field.
 */
export function sameAsUrls(sameAs: GeoEntitySameAs | undefined): string[] {
  if (!sameAs) return []
  return sameAs
    .map((entry) => entry.url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
}
