/**
 * AEO health report — rigorous per-target checks + a weighted 0–100 score.
 * 100/100 is genuinely hard: requires 5+ well-formatted FAQs with detailed
 * answers, no duplicates, plus speakable selectors and how-to data.
 */
import type { AeoMetadata } from './schema'

export type AeoCheckStatus = 'pass' | 'warn' | 'fail'
export type AeoCheckId = 'hasFaq' | 'faqCount' | 'answerDetail' | 'questionFormat' | 'noDuplicates' | 'hasSpeakable' | 'hasHowTo' | 'coverage'

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

function scoreFromChecks(checks: AeoCheck[]): AeoReport {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  return { checks, score: Math.round((earned / totalWeight) * 100), issueCount: checks.filter((c) => c.status !== 'pass').length }
}

const QUESTION_WORDS = /^(who|what|how|why|when|where|is|are|can|do|does|should|will|which|how much|how long|how many|how do|how does)/i

export function computeAeoReport(aeo: AeoMetadata | null | undefined): AeoReport {
  const faq = aeo?.faq ?? []
  const checks: AeoCheck[] = []

  checks.push({
    id: 'hasFaq', label: 'Has FAQ entries', weight: 20,
    status: faq.length > 0 ? 'pass' : 'fail',
    ...(faq.length === 0 ? { advice: 'Add FAQ entries so answer engines can extract direct answers.' } : {}),
  })

  if (faq.length >= 5) checks.push({ id: 'faqCount', label: 'FAQ depth (5+)', weight: 15, status: 'pass' })
  else if (faq.length >= 1) checks.push({ id: 'faqCount', label: `FAQ depth (${faq.length})`, weight: 15, status: 'warn', advice: `Only ${faq.length} FAQ${faq.length === 1 ? '' : 's'} — aim for 5+ to give answer engines more to cite.` })
  else checks.push({ id: 'faqCount', label: 'FAQ depth', weight: 15, status: 'fail', advice: 'No FAQ entries.' })

  const shortAnswers = faq.filter((f) => f.answer.length < 100)
  if (faq.length > 0 && shortAnswers.length === 0) checks.push({ id: 'answerDetail', label: 'Answer detail (100+ chars)', weight: 15, status: 'pass' })
  else if (shortAnswers.length > 0) checks.push({ id: 'answerDetail', label: 'Answer detail', weight: 15, status: 'warn', advice: `${shortAnswers.length} answer${shortAnswers.length === 1 ? '' : 's'} under 100 characters — expand for better extraction.` })
  else checks.push({ id: 'answerDetail', label: 'Answer detail', weight: 15, status: 'fail', advice: 'No answers to evaluate.' })

  const badQ = faq.filter((f) => !f.question.trim().endsWith('?') || !QUESTION_WORDS.test(f.question.trim()))
  if (faq.length > 0 && badQ.length === 0) checks.push({ id: 'questionFormat', label: 'Question format', weight: 15, status: 'pass' })
  else if (badQ.length > 0) checks.push({ id: 'questionFormat', label: 'Question format', weight: 15, status: 'warn', advice: `${badQ.length} question${badQ.length === 1 ? '' : 's'} should start with Who/What/How/Why and end with ?.` })
  else checks.push({ id: 'questionFormat', label: 'Question format', weight: 15, status: 'fail', advice: 'No questions to evaluate.' })

  const qs = faq.map((f) => f.question.toLowerCase().trim())
  const dupes = qs.filter((q, i) => qs.indexOf(q) !== i)
  checks.push({
    id: 'noDuplicates', label: 'No duplicate questions', weight: 10,
    status: dupes.length === 0 ? 'pass' : 'warn',
    ...(dupes.length > 0 ? { advice: `${dupes.length} duplicate question${dupes.length === 1 ? '' : 's'} found.` } : {}),
  })

  checks.push({
    id: 'hasSpeakable', label: 'Speakable selectors', weight: 10,
    status: aeo?.speakableCssSelectors?.length ? 'pass' : 'warn',
    ...(!aeo?.speakableCssSelectors?.length ? { advice: 'No speakable CSS selectors — voice assistants use these to find answer-bearing content.' } : {}),
  })

  checks.push({
    id: 'hasHowTo', label: 'How-to structured data', weight: 10,
    status: aeo?.howTo ? 'pass' : 'warn',
    ...(!aeo?.howTo ? { advice: 'No How-to steps — add them for process/tutorial content.' } : {}),
  })

  checks.push({
    id: 'coverage', label: 'Content coverage', weight: 5,
    status: faq.length >= 5 ? 'pass' : 'warn',
    ...(faq.length < 5 ? { advice: "Cover more of the page's topics with additional FAQs." } : {}),
  })

  return scoreFromChecks(checks)
}
