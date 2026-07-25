/**
 * AEO JSON-LD builders — schema.org answer-targeted entities derived from
 * resolved AEO metadata. Each builder returns a plain entity object; the
 * publisher composes AEO entities with SEO/GEO entities and owns safe
 * serialization (`</script` / `<!--` escaping) in one place.
 *
 *   - `FAQPage`      — from `AeoMetadata.faq`
 *   - `HowTo`        — from `AeoMetadata.howTo`
 *   - `Speakable`    — from `AeoMetadata.speakableCssSelectors` (requires origin)
 *
 * Pure leaf module: depends only on `./schema`.
 */

import type { AeoMetadata, FaqEntry, HowTo } from './schema'

export type AeoJsonLdEntity = Record<string, unknown>

export interface AeoJsonLdContext {
  origin?: string
  routePath: string
}

export function buildFaqPage(faq: FaqEntry[]): AeoJsonLdEntity {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}

export function buildHowTo(howTo: HowTo): AeoJsonLdEntity {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    ...(howTo.description ? { description: howTo.description } : {}),
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      ...(step.name ? { name: step.name } : {}),
      text: step.text,
    })),
  }
}

export function buildSpeakable(cssSelectors: string[], url: string): AeoJsonLdEntity {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  }
}

/**
 * Build the AEO JSON-LD entities for one route. Returns `[]` when the target
 * carries no answer-targeted data. Speakable is omitted when no origin is
 * configured (it requires an absolute URL).
 */
export function buildAeoJsonLdEntities(
  meta: AeoMetadata,
  ctx: AeoJsonLdContext,
): AeoJsonLdEntity[] {
  const entities: AeoJsonLdEntity[] = []
  if (meta.faq && meta.faq.length > 0) entities.push(buildFaqPage(meta.faq))
  if (meta.howTo) entities.push(buildHowTo(meta.howTo))
  if (meta.speakableCssSelectors && meta.speakableCssSelectors.length > 0 && ctx.origin) {
    entities.push(buildSpeakable(meta.speakableCssSelectors, ctx.origin + ctx.routePath))
  }
  return entities
}
