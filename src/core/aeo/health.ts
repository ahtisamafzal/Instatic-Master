/**
 * AEO health report — per-target checks + a weighted 0–100 score.
 * Mirrors `@core/seo/health.ts`. Each check carries advice for the editor.
 */
import type { AeoMetadata } from './schema'

export type AeoCheckStatus = 'pass' | 'warn' | 'fail'
export type AeoCheckId = 'hasFaq' | 'faqCount' | 'answerLength'

export interface AeoCheck {
  id: AeoCheckId
  label: string
  status: AeoCheckStatus
  advice?: string
  weight: number
}

export interface AeoReport {
  checks: AeoCheck[]
  score: number
  issueCount: number
}

export type AeoScoreTier = 'good' | 'fair' | 'poor'

export function aeoScoreTier(score: number): AeoScoreTier {
  if (score >= 80) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

export function computeAeoReport(aeo: AeoMetadata | null | undefined): AeoReport {
  const faq = aeo?.faq ?? []
  const checks: AeoCheck[] = [
    {
      id: 'hasFaq',
      label: 'Has FAQ',
      status: faq.length > 0 ? 'pass' : 'fail',
      weight: 40,
      ...(faq.length === 0 ? { advice: 'Add at least one FAQ entry so answer engines can extract direct answers.' } : {}),
    },
    {
      id: 'faqCount',
      label: 'FAQ depth',
      status: faq.length >= 3 ? 'pass' : faq.length >= 1 ? 'warn' : 'fail',
      weight: 30,
      ...(faq.length < 3 && faq.length >= 1 ? { advice: 'Three or more FAQs give answer engines more to cite.' } : faq.length === 0 ? { advice: 'No FAQ entries yet.' } : {}),
    },
    {
      id: 'answerLength',
      label: 'Answer detail',
      status: faq.length > 0 && faq.every((f) => f.answer.length >= 30) ? 'pass' : 'warn',
      weight: 30,
      ...(faq.some((f) => f.answer.length < 30) ? { advice: 'Some answers are short — aim for 30+ characters so answer engines have enough context.' } : {}),
    },
  ]
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  return { checks, score: Math.round((earned / totalWeight) * 100), issueCount: checks.filter((c) => c.status !== 'pass').length }
}
