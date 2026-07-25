/**
 * GEO JSON-LD builder — emits an `Organization` entity carrying the `sameAs`
 * identity graph (LinkedIn, YouTube, Wikidata, GitHub, …). Generative engines
 * use these independent references to verify brand identity and authority.
 *
 * The publisher may merge this entity with SEO's `Organization` or emit it
 * standalone; either way the builder returns a plain entity object and the
 * publisher owns serialization.
 *
 * Pure leaf module: depends only on `./schema`.
 */

import type { GeoEntitySameAs } from './schema'

export type GeoJsonLdEntity = Record<string, unknown>

export function buildOrganizationEntity(name: string, sameAs: GeoEntitySameAs): GeoJsonLdEntity {
  const urls = [
    sameAs.linkedinUrl,
    sameAs.youtubeUrl,
    sameAs.wikidataUrl,
    sameAs.githubUrl,
    sameAs.redditUrl,
    sameAs.wikipediaUrl,
  ].filter((url): url is string => typeof url === 'string' && url.length > 0)

  const entity: GeoJsonLdEntity = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
  }
  if (urls.length > 0) entity.sameAs = urls
  return entity
}

/**
 * Build the GEO JSON-LD entity for the site. Returns `null` when the entity
 * has no name (nothing meaningful to assert).
 */
export function buildGeoJsonLdEntity(
  entityName: string | undefined,
  siteName: string,
  sameAs: GeoEntitySameAs | undefined,
): GeoJsonLdEntity | null {
  const name = entityName?.trim() || siteName.trim()
  if (!name) return null
  return buildOrganizationEntity(name, sameAs ?? {})
}
