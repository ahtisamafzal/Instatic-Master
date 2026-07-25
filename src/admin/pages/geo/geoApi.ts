/**
 * GEO workspace API client — typed wrappers over `/admin/api/cms/geo/*`.
 * Responses validate against TypeBox schemas via `apiRequest`; the GEO object
 * shape comes straight from `@core/geo`, shared with the server handler.
 */
import { Type } from '@core/utils/typeboxHelpers'
import { apiRequest } from '@core/http'
import { SiteGeoSettingsSchema, type SiteGeoSettings } from '@core/geo'

const SiteGeoResponseSchema = Type.Object({
  siteName: Type.String(),
  publicOrigin: Type.Union([Type.String(), Type.Null()]),
  siteGeo: Type.Union([SiteGeoSettingsSchema, Type.Null()]),
})

export interface SiteGeoResponse {
  siteName: string
  publicOrigin: string | null
  siteGeo: SiteGeoSettings | null
}

const SiteGeoPutResponseSchema = Type.Object({
  geo: Type.Union([SiteGeoSettingsSchema, Type.Null()]),
})

export async function fetchSiteGeo(signal?: AbortSignal): Promise<SiteGeoResponse> {
  return apiRequest('/admin/api/cms/geo/site', {
    schema: SiteGeoResponseSchema,
    signal,
    fallbackMessage: 'Could not load GEO settings',
  })
}

export async function saveSiteGeo(geo: SiteGeoSettings): Promise<SiteGeoSettings | null> {
  const result = await apiRequest('/admin/api/cms/geo/site', {
    method: 'PUT',
    body: { geo },
    schema: SiteGeoPutResponseSchema,
    fallbackMessage: 'Could not save GEO settings',
  })
  return result.geo
}
