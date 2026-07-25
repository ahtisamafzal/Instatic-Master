/**
 * GEO crawl-file generators — the `llms.txt` and `llms-full.txt` bodies served
 * as opt-in, origin-resolved endpoints for AI crawlers. Parallel to the SEO
 * module's `generateRobotsTxt`.
 *
 * Note on the convention: Google Search ignores `llms.txt`; these files target
 * the ChatGPT / Claude / Perplexity ecosystem and are opt-in (`llms-full.txt`
 * especially is a content-licensing decision). The server route layer decides
 * whether to serve based on `SiteGeoSettings.llmsTxt.enabled`.
 */

import type { SiteGeoSettings } from './schema'

export interface LlmsTxtContext {
  /** Absolute site origin, when configured. Omitted from the body when unset. */
  origin?: string
  siteName: string
  siteDescription?: string
}

/** Generate `/llms.txt` — a concise markdown summary of the site for LLMs. */
export function generateLlmsTxt(_settings: SiteGeoSettings, ctx: LlmsTxtContext): string {
  const lines: string[] = [`# ${ctx.siteName}`]
  if (ctx.origin) lines.push('', `> ${ctx.origin}`)
  if (ctx.siteDescription) lines.push('', ctx.siteDescription)
  return `${lines.join('\n')}\n`
}

/**
 * Generate `/llms-full.txt` — fuller content for LLMs. Opt-in only; the
 * default implementation mirrors the summary until per-section content is wired.
 */
export function generateLlmsFullTxt(settings: SiteGeoSettings, ctx: LlmsTxtContext): string {
  return generateLlmsTxt(settings, ctx)
}
