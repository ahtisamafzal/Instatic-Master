/**
 * GEO health report — site-scoped checks + a weighted 0–100 score.
 * Mirrors `@core/seo/health.ts`.
 */
import type { SiteGeoSettings } from './schema'

export type GeoCheckStatus = 'pass' | 'warn' | 'fail'
export type GeoCheckId = 'llmsEnabled' | 'sameAsCount' | 'hasIntro'

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

export function computeGeoReport(geo: SiteGeoSettings | null | undefined): GeoReport {
  const llmsEnabled = geo?.llmsTxt?.enabled === true
  const sameAsCount = geo?.sameAs?.length ?? 0
  const hasIntro = !!geo?.llmsTxt?.intro?.trim()

  const checks: GeoCheck[] = [
    {
      id: 'llmsEnabled',
      label: 'llms.txt enabled',
      status: llmsEnabled ? 'pass' : 'fail',
      weight: 40,
      ...(!llmsEnabled ? { advice: 'Enable llms.txt so AI crawlers can read your site summary.' } : {}),
    },
    {
      id: 'sameAsCount',
      label: 'Entity profiles',
      status: sameAsCount >= 2 ? 'pass' : sameAsCount >= 1 ? 'warn' : 'fail',
      weight: 40,
      ...(sameAsCount < 2 ? { advice: 'Add entity profiles (LinkedIn, YouTube, etc.) so generative engines can verify your identity.' } : {}),
    },
    {
      id: 'hasIntro',
      label: 'llms.txt intro',
      status: hasIntro ? 'pass' : 'warn',
      weight: 20,
      ...(!hasIntro ? { advice: 'Add an intro line to your llms.txt for better AI context.' } : {}),
    },
  ]
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  return { checks, score: Math.round((earned / totalWeight) * 100), issueCount: checks.filter((c) => c.status !== 'pass').length }
}
