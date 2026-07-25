/**
 * AEO workspace API — `/admin/api/cms/aeo/*`.
 *   GET  /aeo/targets        — the page target index with each page's `aeo` cell.
 *   PUT  /aeo/targets/:id    — write one page's structured `aeo` cell.
 * Capabilities: `aeo.read` to read, `aeo.manage` to write. Per-target like SEO.
 */
import { Type } from '@core/utils/typeboxHelpers'
import type { DataRow } from '@core/data/schemas'
import { readAeoCell, readTitleCell } from '@core/data/cells'
import { AeoMetadataSchema } from '@core/aeo'
import type { DbClient } from '../../db/client'
import { badRequest, jsonResponse, readValidatedBody } from '../../http'
import { requireCapability } from '../../auth/authz'
import { listDataRows, getDataRow, saveDataRowDraft } from '../../repositories/data'
import { CMS_API_PREFIX } from './shared'
import type { CmsHandlerOptions } from './shared'
import { runRouteTable, type Route, type RouteParams } from './routeTable'

const AeoTargetPutBodySchema = Type.Object({ aeo: AeoMetadataSchema })

interface AeoTargetPayload {
  id: string
  title: string
  route: string
  aeo: ReturnType<typeof readAeoCell> | null
}

function pageRowToTarget(row: DataRow): AeoTargetPayload {
  const slug = row.slug.replace(/^\/+/, '')
  return {
    id: row.id,
    title: readTitleCell(row.cells) || row.slug,
    route: slug === 'index' || slug === '' ? '/' : `/${slug}`,
    aeo: readAeoCell(row.cells) ?? null,
  }
}

async function handleGetTargets(req: Request, db: DbClient): Promise<Response> {
  const user = await requireCapability(req, db, 'aeo.read')
  if (user instanceof Response) return user
  const pageRows = await listDataRows(db, 'pages')
  return jsonResponse({ targets: pageRows.map(pageRowToTarget) })
}

async function handlePutTarget(req: Request, db: DbClient, params: RouteParams): Promise<Response> {
  const user = await requireCapability(req, db, 'aeo.manage')
  if (user instanceof Response) return user
  const body = await readValidatedBody(req, AeoTargetPutBodySchema)
  if (!body) return badRequest('Invalid AEO payload')
  const row = await getDataRow(db, params.id)
  if (!row) return jsonResponse({ error: 'Target not found' }, { status: 404 })
  const updated = await saveDataRowDraft(db, row.id, { cells: { ...row.cells, aeo: body.aeo }, slug: row.slug }, user.id)
  if (!updated) return jsonResponse({ error: 'Target not found' }, { status: 404 })
  return jsonResponse({ target: pageRowToTarget(updated) })
}

const AEO_ROUTES: readonly Route<[CmsHandlerOptions]>[] = [
  { method: 'GET', pattern: `${CMS_API_PREFIX}/aeo/targets`, handler: handleGetTargets },
  { method: 'PUT', pattern: new RegExp(`^${CMS_API_PREFIX}/aeo/targets/(?<id>[^/]+)$`), handler: handlePutTarget },
]

export async function handleAeoRoutes(req: Request, db: DbClient, options: CmsHandlerOptions): Promise<Response | null> {
  return runRouteTable(req, db, AEO_ROUTES, options)
}
