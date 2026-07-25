/**
 * GEO workspace API — `/admin/api/cms/geo/*`.
 *
 * GEO is site-scoped (entity identity + llms.txt licensing are site-wide
 * decisions), so the surface is just two routes:
 *   GET /geo/site — read `site.settings.geo` + the configured public origin.
 *   PUT /geo/site — write `site.settings.geo`.
 *
 * Capabilities: `geo.read` to read, `geo.manage` to write. Mirrors the SEO
 * handler's site-settings write (`seo.ts:208` `handlePutSiteSeo`).
 */
import { Type } from '@core/utils/typeboxHelpers'
import { SiteGeoSettingsSchema, parseSiteGeoSettings } from '@core/geo'
import type { DbClient } from '../../db/client'
import { badRequest, jsonResponse, readValidatedBody } from '../../http'
import { requireCapability } from '../../auth/authz'
import { canonicalPublicOrigin } from '../../auth/security'
import { getDraftSite, saveDraftSite } from '../../repositories/site'
import { CMS_API_PREFIX } from './shared'
import type { CmsHandlerOptions } from './shared'
import { runRouteTable, type Route } from './routeTable'

const SiteGeoPutBodySchema = Type.Object({
  geo: SiteGeoSettingsSchema,
})

async function handleGetSiteGeo(req: Request, db: DbClient): Promise<Response> {
  const user = await requireCapability(req, db, 'geo.read')
  if (user instanceof Response) return user
  const site = await getDraftSite(db)
  return jsonResponse({
    siteName: site?.name ?? '',
    publicOrigin: canonicalPublicOrigin(),
    siteGeo: site?.settings.geo ?? null,
  })
}

async function handlePutSiteGeo(req: Request, db: DbClient): Promise<Response> {
  const user = await requireCapability(req, db, 'geo.manage')
  if (user instanceof Response) return user

  const body = await readValidatedBody(req, SiteGeoPutBodySchema)
  if (!body) return badRequest('Invalid site GEO payload')

  const site = await getDraftSite(db)
  if (!site) return jsonResponse({ error: 'Site not found' }, { status: 404 })

  const geo = parseSiteGeoSettings(body.geo)
  await saveDraftSite(db, { ...site, settings: { ...site.settings, geo } }, user.id)

  return jsonResponse({ geo: geo ?? null })
}

const GEO_ROUTES: readonly Route<[CmsHandlerOptions]>[] = [
  { method: 'GET', pattern: `${CMS_API_PREFIX}/geo/site`, handler: handleGetSiteGeo },
  { method: 'PUT', pattern: `${CMS_API_PREFIX}/geo/site`, handler: handlePutSiteGeo },
]

export async function handleGeoRoutes(
  req: Request,
  db: DbClient,
  options: CmsHandlerOptions,
): Promise<Response | null> {
  return runRouteTable(req, db, GEO_ROUTES, options)
}
