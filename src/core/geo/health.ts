/**
 * GEO health report — rigorous site-scoped checks + a weighted 0–100 score.
 * 100/100 requires llms.txt enabled with a real intro, 3+ diverse sameAs
 * profiles including Wikidata and GitHub.
 */
import type { SiteGeoSettings } from './schema'

export type GeoCheckStatus = 'pass' | 'warn' | 'fail'
export type GeoCheckId = 'llmsEnabled' | 'sameAsCount' | 'sameAsDiversity' | 'hasWikidata' | 'hasGithub' | 'hasYoutube' | 'llmsIntro'

export interface GeoCheck {
  id: GeoCheckId
  label: string
  status: GeoCheckStatus
  advice?: string
  weight: number
}

export interface GeoReport {
  checks: GeoCheck[]
  score: number
  issueCount: number
}

export type GeoScoreTier = 'good' | 'fair' | 'poor'

export function geoScoreTier(score: number): GeoScoreTier {
  if (score >= 80) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

function scoreFromChecks(checks: GeoCheck[]): GeoReport {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  return { checks, score: Math.round((earned / totalWeight) * 100), issueCount: checks.filter((c) => c.status !== 'pass').length }
}

function hasPlatform(sameAs: { label: string; url: string }[], keyword: string): boolean {
  return sameAs.some((e) => e.url.toLowerCase().includes(keyword) || e.label.toLowerCase().includes(keyword))
}

export function computeGeoReport(geo: SiteGeoSettings | null | undefined): GeoReport {
  const sameAs = geo?.sameAs ?? []
  const llms = geo?.llmsTxt ?? {}
  const checks: GeoCheck[] = []

  checks.push({
    id: 'llmsEnabled', label: 'llms.txt enabled', weight: 20,
    status: llms.enabled === true ? 'pass' : 'fail',
    ...(llms.enabled !== true ? { advice: 'Enable llms.txt so AI crawlers can read your site summary.' } : {}),
  })

  if (sameAs.length >= 3) checks.push({ id: 'sameAsCount', label: `Entity profiles (${sameAs.length})`, weight: 25, status: 'pass' })
  else if (sameAs.length >= 1) checks.push({ id: 'sameAsCount', label: `Entity profiles (${sameAs.length})`, weight: 25, status: 'warn', advice: `Only ${sameAs.length} profile${sameAs.length === 1 ? '' : 's'} — add 3+ so generative engines can verify your identity.` })
  else checks.push({ id: 'sameAsCount', label: 'Entity profiles', weight: 25, status: 'fail', advice: 'No entity profiles — add LinkedIn, YouTube, Wikidata, etc.' })

  const domains = new Set(sameAs.map((e) => { try { return new URL(e.url).hostname } catch { return e.url } }))
  checks.push({
    id: 'sameAsDiversity', label: 'Profile diversity', weight: 20,
    status: domains.size >= 3 ? 'pass' : domains.size >= 1 ? 'warn' : 'fail',
    ...(domains.size < 3 ? { advice: `Only ${domains.size} unique platform${domains.size === 1 ? '' : 's'} — diversify across LinkedIn, YouTube, GitHub, Wikidata.` } : {}),
  })

  checks.push({
    id: 'hasWikidata', label: 'Wikidata entry', weight: 10,
    status: hasPlatform(sameAs, 'wikidata') ? 'pass' : 'warn',
    ...(!hasPlatform(sameAs, 'wikidata') ? { advice: 'Add a Wikidata URL — generative engines use it as a structured identity source.' } : {}),
  })

  checks.push({
    id: 'hasGithub', label: 'GitHub entry', weight: 10,
    status: hasPlatform(sameAs, 'github') ? 'pass' : 'warn',
    ...(!hasPlatform(sameAs, 'github') ? { advice: 'Add a GitHub URL — signals technical credibility to AI systems.' } : {}),
  })

  checks.push({
    id: 'hasYoutube', label: 'YouTube entry', weight: 10,
    status: hasPlatform(sameAs, 'youtube') ? 'pass' : 'warn',
    ...(!hasPlatform(sameAs, 'youtube') ? { advice: 'Add a YouTube URL — the most-cited domain in Google AI Overviews.' } : {}),
  })

  const intro = llms.intro?.trim() ?? ''
  checks.push({
    id: 'llmsIntro', label: 'llms.txt intro line', weight: 5,
    status: intro.length >= 50 ? 'pass' : intro.length > 0 ? 'warn' : 'fail',
    ...(intro.length < 50 ? { advice: intro.length === 0 ? 'Add an intro line to your llms.txt.' : 'Intro is short — aim for 50+ characters describing what your site offers.' } : {}),
  })

  return scoreFromChecks(checks)
}
