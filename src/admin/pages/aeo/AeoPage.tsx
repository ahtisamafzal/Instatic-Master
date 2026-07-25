/**
 * AeoPage — `/admin/tools/aeo`.
 * Per-page FAQ structured data editor. Select a page, add question/answer
 * pairs, save. The `aeo` cell feeds `FAQPage` JSON-LD on publish. Mirrors
 * the SEO workspace's per-target pattern; reuses `SeoFormRow`.
 * Capabilities: `aeo.read` gates the workspace; `aeo.manage` gates Save.
 */
import { useId, useState } from 'react'
import { Button } from '@ui/components/Button'
import { Input, Textarea } from '@ui/components/Input'
import { Select } from '@ui/components/Select'
import { Separator } from '@ui/components/Separator'
import { AdminPageLayout } from '@admin/layouts/AdminPageLayout'
import { hasCapability } from '@admin/access'
import { useCurrentAdminUser } from '@admin/sessionContext'
import { getErrorMessage } from '@core/utils/errorMessage'
import { SeoFormRow } from '../seo/components/SeoFormRow'
import { computeAeoReport, type AeoMetadata, type FaqEntry } from '@core/aeo'
import { useAeoWorkspace, type AeoWorkspace } from './useAeoWorkspace'
import styles from './AeoPage.module.css'

export function AeoPage() {
  const currentUser = useCurrentAdminUser()
  const unrestricted = !currentUser
  const canManage = unrestricted || hasCapability(currentUser, 'aeo.manage')
  const workspace = useAeoWorkspace()

  return (
    <AdminPageLayout
      workspace="aeo"
      title="AEO"
      titleId="aeo-title"
      description="Answer Engine Optimization: per-page FAQ structured data for answer engines."
      tabs={<></>}
      loading={workspace.loading}
    >
      {workspace.error ? (
        <p className={styles.loadError} role="alert">{workspace.error}</p>
      ) : (
        <AeoEditor workspace={workspace} canManage={canManage} />
      )}
    </AdminPageLayout>
  )
}

function AeoEditor({ workspace, canManage }: { workspace: AeoWorkspace; canManage: boolean }) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [drafts, setDrafts] = useState<Record<string, AeoMetadata>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(false)
  const idBase = useId()

  const target = workspace.targets.find((t) => t.id === selectedId) ?? null
  const draft: AeoMetadata = selectedId ? (drafts[selectedId] ?? target?.aeo ?? {}) : {}
  const faq: FaqEntry[] = draft.faq ?? []
  const aeoReport = computeAeoReport(draft)
  const isDirty = selectedId ? JSON.stringify(draft) !== JSON.stringify(target?.aeo ?? {}) : false

  function ensureDraft(): void {
    if (selectedId && !drafts[selectedId]) {
      setDrafts((c) => ({ ...c, [selectedId]: target?.aeo ?? {} }))
    }
  }

  function setFaq(entries: FaqEntry[]): void {
    ensureDraft()
    setDrafts((c) => selectedId ? ({ ...c, [selectedId]: { ...(c[selectedId] ?? {}), faq: entries.length > 0 ? entries : undefined } }) : c)
    setSavedAt(false)
  }

  function updateEntry(index: number, patch: Partial<FaqEntry>): void {
    setFaq(faq.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  async function handleSave(): Promise<void> {
    if (!selectedId) return
    setSaving(true); setError(null)
    try {
      await workspace.saveTarget(selectedId, draft)
      setDrafts((c) => { const next = { ...c }; delete next[selectedId]; return next })
      setSavedAt(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save AEO data'))
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.body}>
      {error && <p className={styles.loadError} role="alert">{error}</p>}

      <SeoFormRow label="Page" htmlFor={`${idBase}-page`}>
        <Select id={`${idBase}-page`} value={selectedId} disabled={!canManage} onChange={(e) => { setSelectedId(e.target.value); setSavedAt(false) }}>
          <option value="">Select a page…</option>
          {workspace.targets.map((t) => (
            <option key={t.id} value={t.id}>{t.title} ({t.route})</option>
          ))}
        </Select>
      </SeoFormRow>

      {selectedId && (
        <>
          <Separator />
          <div className={styles.faqSection}>
            <h2 className={styles.heading}>FAQ questions</h2>
            <p className={styles.hint}>
              Each pair becomes a <code>FAQPage</code> JSON-LD entity on this page when published.
              Answer engines (Google AI Overviews, ChatGPT, Perplexity) extract these as direct answers.
            </p>
            <div className={styles.faqList}>
              {faq.map((entry, index) => (
                <div key={index} className={styles.faqCard}>
                  <Input
                    type="text"
                    aria-label={`Question ${index + 1}`}
                    placeholder="Question"
                    value={entry.question}
                    disabled={!canManage}
                    onChange={(e) => updateEntry(index, { question: e.target.value })}
                  />
                  <Textarea
                    aria-label={`Answer ${index + 1}`}
                    rows={2}
                    placeholder="Answer"
                    value={entry.answer}
                    disabled={!canManage}
                    onChange={(e) => updateEntry(index, { answer: e.target.value })}
                  />
                  <Button type="button" variant="secondary" size="sm" disabled={!canManage} onClick={() => setFaq(faq.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" disabled={!canManage} onClick={() => setFaq([...faq, { question: '', answer: '' }])}>
              Add question
            </Button>
          </div>

          <Separator />
          <div className={styles.scoreSection}>
            <h2 className={styles.heading}>AEO Score: {aeoReport.score}/100</h2>
            {aeoReport.checks.map((check) => (
              <div key={check.id} className={styles.checkRow}>
                <span className={check.status === 'pass' ? styles.checkPass : check.status === 'warn' ? styles.checkWarn : styles.checkFail}>
                  {check.status.toUpperCase()}
                </span>
                <span>{check.label}{check.advice ? ` — ${check.advice}` : ''}</span>
              </div>
            ))}
          </div>

          <Separator />
          <div className={styles.saveRow}>
            <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={!canManage || !isDirty || saving}>
              {saving ? 'Saving…' : 'Save AEO data'}
            </Button>
            {savedAt && !isDirty && <span className={styles.savedNote} role="status">Saved — goes live on publish.</span>}
          </div>
        </>
      )}
    </div>
  )
}
