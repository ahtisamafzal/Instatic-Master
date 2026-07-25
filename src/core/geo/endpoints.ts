/**
 * GEO crawl-file generator — the `/llms.txt` body served as an opt-in,
 * origin-resolved endpoint for AI crawlers. Parallel to the SEO module's
 * `generateRobotsTxt`.
 *
 * Convention shape: H1 site name, blockquote origin, a summary line, then an
 * H2 section of curated markdown links. Google Search ignores `llms.txt`; this
 * targets the ChatGPT / Claude / Perplexity ecosystem and is opt-in
 * (`SiteGeoSettings.llmsTxt.enabled`). The server route layer decides whether
 * to serve and builds the link list from the published snapshot.
 */

import type { SiteGeoSettings } from './schema'

export interface LlmsTxtLink {
  label: string
  url: string
}

export interface LlmsTxtContext {
  /** Absolute site origin, when configured. Omitted from the body when unset. */
  origin?: string
  siteName: string
  /** Site description fallback when `settings.llmsTxt.intro` is absent. */
  siteDescription?: string
  /** Curated links (homepage + included pages), built by the endpoint. */
  links: LlmsTxtLink[]
}

/** Generate `/llms.txt` — a markdown summary of the site for LLMs. */
export function generateLlmsTxt(settings: SiteGeoSettings, ctx: LlmsTxtContext): string {
  const lines: string[] = [`# ${ctx.siteName}`]
  if (ctx.origin) lines.push('', `> ${ctx.origin}`)

  const summary = settings.llmsTxt?.intro?.trim() || ctx.siteDescription?.trim()
  if (summary) lines.push('', summary)

  if (ctx.links.length > 0) {
    lines.push('', '## Pages')
    for (const link of ctx.links) lines.push(`- [${link.label}](${link.url})`)
  }
  return `${lines.join('\n')}\n`
}
