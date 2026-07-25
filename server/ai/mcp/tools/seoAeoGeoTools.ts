/**
 * Headless SEO / AEO / GEO MCP tools.
 *
 * Server-resolved (no editor needed). Reads + writes go straight to the DB via
 * the same repositories the HTTP handlers use. An MCP agent with the matching
 * capabilities can read and write site SEO settings, per-target SEO/AEO cells,
 * and site GEO settings.
 */
import { Type } from '@core/utils/typeboxHelpers'
import type { AiTool, ToolContext } from '../../runtime/types'
import { getDraftSite, saveDraftSite } from '../../../repositories/site'
import { listDataRows, getDataRow, saveDataRowDraft } from '../../../repositories/data'
import { readSeoCell, readAeoCell, readTitleCell } from '@core/data/cells'
import { SeoMetadataSchema, SiteSeoSettingsSchema, parseSiteSeoSettings } from '@core/seo'
import { AeoMetadataSchema } from '@core/aeo'
import { SiteGeoSettingsSchema, parseSiteGeoSettings } from '@core/geo'

function rowRoute(row: { slug: string }): string {
  const slug = row.slug.replace(/^\/+/, '')
  return slug === '' ? '/' : `/${slug}`
}

export const seoAeoGeoMcpTools: AiTool[] = [
  {
    name: 'seo_read_site',
    description: 'Read site-wide SEO settings (title pattern, description, OG defaults, robots, sitemap). Headless — no editor needed.',
    scope: 'site',
    execution: 'server',
    inputSchema: Type.Object({}, { additionalProperties: false }),
    requiredCapabilities: ['seo.read'],
    handler: async (_input, ctx: ToolContext) => {
      const site = await getDraftSite(ctx.db)
      return { siteSeo: site?.settings.seo ?? null }
    },
  },
  {
    name: 'seo_update_site',
    description: 'Write site-wide SEO settings. Requires seo.manage. Pass the full `seo` object (title pattern, description, OG defaults, robots, sitemap).',
    scope: 'site',
    execution: 'server',
    mutates: true,
    inputSchema: Type.Object({ seo: SiteSeoSettingsSchema }),
    requiredCapabilities: ['seo.manage'],
    handler: async (input, ctx: ToolContext) => {
      const { seo: seoRaw } = input as { seo: Record<string, unknown> }
      const site = await getDraftSite(ctx.db)
      if (!site) return { ok: false, error: 'No site found.' }
      const seo = parseSiteSeoSettings(seoRaw)
      await saveDraftSite(ctx.db, { ...site, settings: { ...site.settings, seo } }, ctx.userId)
      return { seo: seo ?? null }
    },
  },
  {
    name: 'seo_read_targets',
    description: 'List all pages with their per-target SEO metadata (title, description, canonical, OG, noindex). Headless.',
    scope: 'site',
    execution: 'server',
    inputSchema: Type.Object({}, { additionalProperties: false }),
    requiredCapabilities: ['seo.read'],
    handler: async (_input, ctx: ToolContext) => {
      const rows = await listDataRows(ctx.db, 'pages')
      return {
        targets: rows.map((row) => ({
          id: row.id,
          title: readTitleCell(row.cells) || row.slug,
          route: rowRoute(row),
          seo: readSeoCell(row.cells) ?? null,
        })),
      }
    },
  },
  {
    name: 'seo_update_target',
    description: "Write one page's SEO metadata cell. Requires seo.manage. Pass the target `id` (from seo_read_targets) and the `seo` object.",
    scope: 'site',
    execution: 'server',
    mutates: true,
    inputSchema: Type.Object({ id: Type.String({ minLength: 1 }), seo: SeoMetadataSchema }),
    requiredCapabilities: ['seo.manage'],
    handler: async (input, ctx: ToolContext) => {
      const { id, seo } = input as { id: string; seo: Record<string, unknown> }
      const row = await getDataRow(ctx.db, id)
      if (!row) return { ok: false, error: 'Target not found.' }
      await saveDataRowDraft(ctx.db, row.id, { cells: { ...row.cells, seo }, slug: row.slug }, ctx.userId)
      return { ok: true, id: row.id }
    },
  },
  {
    name: 'aeo_read_targets',
    description: 'List all pages with their per-target AEO data (FAQ entries [{question, answer}], How-to). Headless.',
    scope: 'site',
    execution: 'server',
    inputSchema: Type.Object({}, { additionalProperties: false }),
    requiredCapabilities: ['aeo.read'],
    handler: async (_input, ctx: ToolContext) => {
      const rows = await listDataRows(ctx.db, 'pages')
      return {
        targets: rows.map((row) => ({
          id: row.id,
          title: readTitleCell(row.cells) || row.slug,
          route: rowRoute(row),
          aeo: readAeoCell(row.cells) ?? null,
        })),
      }
    },
  },
  {
    name: 'aeo_update_target',
    description: "Write one page's AEO data (FAQ Q/A pairs). Requires aeo.manage. Pass the target `id` and the `aeo` object with a `faq` array of {question, answer}.",
    scope: 'site',
    execution: 'server',
    mutates: true,
    inputSchema: Type.Object({ id: Type.String({ minLength: 1 }), aeo: AeoMetadataSchema }),
    requiredCapabilities: ['aeo.manage'],
    handler: async (input, ctx: ToolContext) => {
      const { id, aeo } = input as { id: string; aeo: Record<string, unknown> }
      const row = await getDataRow(ctx.db, id)
      if (!row) return { ok: false, error: 'Target not found.' }
      await saveDataRowDraft(ctx.db, row.id, { cells: { ...row.cells, aeo }, slug: row.slug }, ctx.userId)
      return { ok: true, id: row.id }
    },
  },
  {
    name: 'geo_read_site',
    description: 'Read site GEO settings (entity sameAs profiles [{label, url}], llms.txt {enabled, intro}). Headless.',
    scope: 'site',
    execution: 'server',
    inputSchema: Type.Object({}, { additionalProperties: false }),
    requiredCapabilities: ['geo.read'],
    handler: async (_input, ctx: ToolContext) => {
      const site = await getDraftSite(ctx.db)
      return { siteGeo: site?.settings.geo ?? null }
    },
  },
  {
    name: 'geo_update_site',
    description: 'Write site GEO settings (entity sameAs profiles [{label, url}], llms.txt {enabled, intro}). Requires geo.manage.',
    scope: 'site',
    execution: 'server',
    mutates: true,
    inputSchema: Type.Object({ geo: SiteGeoSettingsSchema }),
    requiredCapabilities: ['geo.manage'],
    handler: async (input, ctx: ToolContext) => {
      const { geo: geoRaw } = input as { geo: Record<string, unknown> }
      const site = await getDraftSite(ctx.db)
      if (!site) return { ok: false, error: 'No site found.' }
      const geo = parseSiteGeoSettings(geoRaw)
      await saveDraftSite(ctx.db, { ...site, settings: { ...site.settings, geo } }, ctx.userId)
      return { geo: geo ?? null }
    },
  },
]
