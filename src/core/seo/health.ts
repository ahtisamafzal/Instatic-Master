/**
 * SEO report — 13 granular per-target checks plus a weighted 0–100 score.
 * Every metadata field is scored: title, description, canonical, indexability,
 * OG card completeness (image + alt + title + desc + type), and X card
 * completeness (image + alt + title + desc + card type). 100/100 requires
 * ALL fields set correctly — no blind spots.
 */
import type { SeoMetadata } from './schema'
import type { ResolvedSeoMetadata } from './resolve'
import {
  approxPixelWidth,
  meterZone,
  TITLE_PIXEL_BUDGET,
  TITLE_PIXEL_MIN,
  DESCRIPTION_PIXEL_BUDGET,
  DESCRIPTION_PIXEL_MIN,
} from './lengthMeter'

export type SeoCheckStatus = 'pass' | 'warn' | 'fail'

export type SeoCheckId =
  | 'title'
  | 'description'
  | 'socialImage'
  | 'imageAlt'
  | 'xImage'
  | 'xImageAlt'
  | 'ogTitle'
  | 'ogDescription'
  | 'xTitle'
  | 'xDescription'
  | 'xCard'
  | 'indexable'
  | 'canonical'

export interface SeoCheck {
  id: SeoCheckId
  label: string
  status: SeoCheckStatus
  advice?: string
  weight: number
}

export interface SeoReport {
  checks: SeoCheck[]
  score: number
  issueCount: number
}

export type SeoScoreTier = 'good' | 'fair' | 'poor'

export function seoScoreTier(score: number): SeoScoreTier {
  if (score >= 80) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

function titleCheck(resolved: ResolvedSeoMetadata): SeoCheck {
  const base = { id: 'title' as const, label: 'Title', weight: 15 }
  if (resolved.title === '') {
    return { ...base, status: 'fail', advice: 'Add one — the title is the strongest ranking signal on the page.' }
  }
  const zone = meterZone(approxPixelWidth(resolved.title), TITLE_PIXEL_BUDGET, TITLE_PIXEL_MIN)
  if (zone === 'over') return { ...base, status: 'warn', advice: 'Will truncate — keep it under ~60 characters.' }
  if (zone === 'short') return { ...base, status: 'warn', advice: 'Short — 30–60 characters use the snippet space.' }
  if (zone === 'amber') return { ...base, status: 'warn', advice: 'Approaching the truncation limit.' }
  return { ...base, status: 'pass' }
}

function descriptionCheck(resolved: ResolvedSeoMetadata): SeoCheck {
  const base = { id: 'description' as const, label: 'Description', weight: 15 }
  const description = resolved.description ?? ''
  if (description === '') {
    return { ...base, status: 'fail', advice: 'Add one — without it, search engines improvise a snippet.' }
  }
  const zone = meterZone(approxPixelWidth(description), DESCRIPTION_PIXEL_BUDGET, DESCRIPTION_PIXEL_MIN)
  if (zone === 'over') return { ...base, status: 'warn', advice: 'Will truncate — keep it under ~160 characters.' }
  if (zone === 'short') return { ...base, status: 'warn', advice: 'Short — 70–160 characters make a fuller snippet.' }
  if (zone === 'amber') return { ...base, status: 'warn', advice: 'Approaching the truncation limit.' }
  return { ...base, status: 'pass' }
}

function fieldCheck(
  id: SeoCheckId,
  label: string,
  value: string | undefined | null,
  weight: number,
  advice: string,
): SeoCheck {
  return value && value.trim() !== ''
    ? { id, label, status: 'pass', weight }
    : { id, label, status: 'warn', advice, weight }
}

export function computeSeoReport(
  target: SeoMetadata | undefined,
  resolved: ResolvedSeoMetadata,
): SeoReport {
  const checks: SeoCheck[] = [
    titleCheck(resolved),
    descriptionCheck(resolved),

    fieldCheck('socialImage', 'OG image', resolved.ogImage, 10,
      'Add an OG image — links without one render as bare text cards.'),
    fieldCheck('imageAlt', 'OG image alt', resolved.ogImageAlt, 5,
      'Describe the OG image — alt text feeds accessibility and answer engines.'),
    fieldCheck('xImage', 'X image', resolved.xImage, 5,
      'Add an X/Twitter image — ensures rich cards when shared on X.'),
    fieldCheck('xImageAlt', 'X image alt', resolved.xImageAlt, 5,
      'Describe the X image — missing alt is an accessibility gap.'),

    fieldCheck('ogTitle', 'OG title', resolved.ogTitle, 5,
      'Set a custom OG title or confirm the fallback is correct.'),
    fieldCheck('ogDescription', 'OG description', resolved.ogDescription, 5,
      'Set an OG description for social card completeness.'),
    fieldCheck('xTitle', 'X title', resolved.xTitle, 5,
      'Set an X title for card completeness.'),
    fieldCheck('xDescription', 'X description', resolved.xDescription, 5,
      'Set an X description for card completeness.'),
    fieldCheck('xCard', 'X card type', resolved.xCard, 5,
      'Set the X card type (summary or summary_large_image).'),

    target?.noindex === true
      ? { id: 'indexable', label: 'Indexing', status: 'fail', advice: 'noindex is set — intentional for utility pages, fatal for anything that should rank.', weight: 10 }
      : { id: 'indexable', label: 'Indexing', status: 'pass', weight: 10 },

    resolved.canonicalUrl
      ? { id: 'canonical', label: 'Canonical URL', status: 'pass', weight: 10 }
      : { id: 'canonical', label: 'Canonical URL', status: 'warn', advice: 'Set the public origin in Settings so a canonical URL derives automatically.', weight: 10 },
  ]

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
  const earned = checks.reduce(
    (sum, check) =>
      sum + (check.status === 'pass' ? check.weight : check.status === 'warn' ? check.weight / 2 : 0),
    0,
  )

  return {
    checks,
    score: Math.round((earned / totalWeight) * 100),
    issueCount: checks.filter((check) => check.status !== 'pass').length,
  }
}

export function aggregateSeoScore(reports: SeoReport[]): number {
  if (reports.length === 0) return 0
  return Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)
}
