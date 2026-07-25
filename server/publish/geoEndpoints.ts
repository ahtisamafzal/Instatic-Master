/**
 * First-party `GET /llms.txt`.
 *
 * Opt-in (`site.settings.geo.llmsTxt.enabled`). Generated from the PUBLISHED
 * snapshot (GEO follows the publish lifecycle — draft edits appear after the
 * next publish) and cached keyed by `publishVersion` + origin, the same
 * discipline as the SEO endpoint cache: first request after a publish
 * regenerates, `bumpPublishVersion()` turns the cached body stale.
 *
 * Non-canonical host (preview/staging) → 404: never advertise AI content
 * licensing for a non-production origin.
 *
 * Dispatched by `server/router.ts` BEFORE static assets and public rendering —
 * `/llms.txt` must never fall through to an HTML response.
 */

import type { DbClient } from '../db/client'
import { isTemplatePage } from '@core/templates'
import { generateLlmsTxt, type LlmsTxtLink } from '@core/geo'
import { absoluteUrl } from '@core/seo'
import { canonicalPublicOrigin, requestHostIsCanonical } from '../auth/security'
import { getLatestSnapshotForVersion } from './publishedSnapshotCache'
import { getPublishVersion } from './publishState'

interface CachedGeoFile {
  version: number
  origin: string
  body: string
}

let llmsCache: CachedGeoFile | null = null

/** Test seam — drop the cached body. */
export function resetGeoEndpointCachesForTests(): void {
  llmsCache = null
}

function resolveOrigin(url: URL): string {
  return canonicalPublicOrigin() ?? url.origin
}

export async function serveLlmsTxt(db: DbClient, url: URL, req: Request): Promise<Response> {
  // Non-canonical host → 404 (uncached): never advertise AI licensing on staging.
  if (requestHostIsCanonical(req) === false) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const version = getPublishVersion()
  const snapshot = await getLatestSnapshotForVersion(db, version)
  const geo = snapshot?.site.settings.geo

  // Opt-in: llms.txt is served only when explicitly enabled.
  if (geo?.llmsTxt?.enabled !== true) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const origin = resolveOrigin(url)

  if (!llmsCache || llmsCache.version !== version || llmsCache.origin !== origin) {
    const siteName = snapshot?.site.name ?? 'Site'
    const siteDescription = snapshot?.site.settings.seo?.description

    const excluded = new Set(geo.llmsTxt?.excludedTargets ?? [])
    const links: LlmsTxtLink[] = []
    if (snapshot) {
      for (const page of snapshot.site.pages) {
        if (isTemplatePage(page)) continue
        if (page.seo?.noindex === true) continue
        if (excluded.has(`page:${page.id}`)) continue
        const slug = page.slug.replace(/^\/+/, '')
        const routePath = slug === 'index' || slug === '' ? '/' : `/${slug}`
        links.push({ label: page.title || routePath, url: absoluteUrl(origin, routePath) })
      }
    }

    llmsCache = {
      version,
      origin,
      body: generateLlmsTxt(geo, { origin, siteName, siteDescription, links }),
    }
  }

  return new Response(llmsCache.body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
