/**
 * GeoPage — `/admin/tools/geo`.
 *
 * Site-scoped Generative Engine Optimization workspace: the brand entity
 * `sameAs` identity graph (LinkedIn/YouTube/Wikidata/… — feeds the
 * `Organization` JSON-LD) and the opt-in `llms.txt` toggle + intro line.
 * Mirrors the SEO workspace's layout + capability gating; the editor body
 * reuses `SeoFormRow` from the sibling SEO folder.
 *
 * Capabilities: `geo.read` gates the workspace (via `canAccessWorkspace`);
 * `geo.manage` gates the Save control.
 *
 * Note: GEO settings follow the publish lifecycle — edits go live on the next
 * publish (surfaced inline so a toggle-then-curl isn't mistaken for broken).
 */
import { useId, useState } from 'react'
import { Button } from '@ui/components/Button'
import { Input } from '@ui/components/Input'
import { Switch } from '@ui/components/Switch'
import { Separator } from '@ui/components/Separator'
import { AdminPageLayout } from '@admin/layouts/AdminPageLayout'
import { hasCapability } from '@admin/access'
import { useCurrentAdminUser } from '@admin/sessionContext'
import { getErrorMessage } from '@core/utils/errorMessage'
import { SeoFormRow } from '../seo/components/SeoFormRow'
import { computeGeoReport, type GeoEntitySameAsEntry, type SiteGeoSettings } from '@core/geo'
import { useGeoWorkspace, type GeoWorkspace } from './useGeoWorkspace'
import styles from './GeoPage.module.css'

export function GeoPage() {
  const currentUser = useCurrentAdminUser()
  const unrestricted = !currentUser
  const canManage = unrestricted || hasCapability(currentUser, 'geo.manage')
  const workspace = useGeoWorkspace()

  return (
    <AdminPageLayout
      workspace="geo"
      title="GEO"
      titleId="geo-title"
      description="Generative Engine Optimization: entity identity (sameAs) and the llms.txt opt-in for the ChatGPT/Claude/Perplexity ecosystem."
      tabs={<></>}
      loading={workspace.loading}
    >
      {workspace.error ? (
        <p className={styles.loadError} role="alert">{workspace.error}</p>
      ) : (
        <GeoEditor workspace={workspace} canManage={canManage} />
      )}
    </AdminPageLayout>
  )
}

function GeoEditor({ workspace, canManage }: { workspace: GeoWorkspace; canManage: boolean }) {
  const stored = workspace.siteGeo ?? {}
  const [draft, setDraft] = useState<SiteGeoSettings>(stored)
  const [baseline, setBaseline] = useState<SiteGeoSettings>(stored)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idBase = useId()

  const geoReport = computeGeoReport(draft)
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const sameAs = draft.sameAs ?? []
  const llms = draft.llmsTxt ?? {}
  const llmsEnabled = llms.enabled === true

  function touch(): void {
    if (savedAt) setSavedAt(false)
  }

  function setEnabled(enabled: boolean): void {
    setDraft((c) => ({ ...c, llmsTxt: { ...(c.llmsTxt ?? {}), enabled } }))
    touch()
  }

  function setIntro(intro: string): void {
    setDraft((c) => ({
      ...c,
      llmsTxt: { ...(c.llmsTxt ?? {}), ...(intro.trim() === '' ? {} : { intro: intro.trim() }) },
    }))
    touch()
  }

  function setSameAs(entries: GeoEntitySameAsEntry[]): void {
    setDraft((c) => ({ ...c, sameAs: entries.length > 0 ? entries : undefined }))
    touch()
  }

  function updateSameAs(index: number, patch: Partial<GeoEntitySameAsEntry>): void {
    setSameAs(sameAs.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    setError(null)
    try {
      await workspace.saveSite(draft)
      setBaseline(draft)
      setSavedAt(true)
    } catch (err) {
      console.error('[geo-page] save failed:', err)
      setError(getErrorMessage(err, 'Could not save GEO settings'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.body}>
      {error && <p className={styles.loadError} role="alert">{error}</p>}
      {!canManage && (
        <p className={styles.readOnlyNote} role="status">Read-only — your role does not include Manage GEO.</p>
      )}

      <div className={styles.scoreSection}>
        <h2 className={styles.heading}>GEO Score: {geoReport.score}/100</h2>
        {geoReport.checks.map((check) => (
          <div key={check.id} className={styles.checkRow}>
            <span className={check.status === 'pass' ? styles.checkPass : check.status === 'warn' ? styles.checkWarn : styles.checkFail}>
              {check.status.toUpperCase()}
            </span>
            <span>{check.label}{check.advice ? ` — ${check.advice}` : ''}</span>
          </div>
        ))}
      </div>

      <Separator />

      <section className={styles.section} aria-label="Entity identity">
        <h2 className={styles.heading}>Entity identity (sameAs)</h2>
        <p className={styles.hint}>
          Canonical profile URLs merged into the homepage <code>Organization</code> JSON-LD —
          how generative engines verify who runs this site. Add one row per profile.
        </p>
        <div className={styles.sameAsList}>
          {sameAs.map((entry, index) => (
            <div className={styles.sameAsRow} key={index}>
              <Input
                type="text"
                aria-label={`Profile ${index + 1} label`}
                placeholder="LinkedIn"
                value={entry.label}
                disabled={!canManage}
                onChange={(e) => updateSameAs(index, { label: e.target.value })}
              />
              <Input
                type="url"
                aria-label={`Profile ${index + 1} URL`}
                placeholder="https://www.linkedin.com/company/your-brand"
                value={entry.url}
                disabled={!canManage}
                onChange={(e) => updateSameAs(index, { url: e.target.value })}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canManage}
                onClick={() => setSameAs(sameAs.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canManage}
          onClick={() => setSameAs([...sameAs, { label: '', url: '' }])}
        >
          Add profile
        </Button>
      </section>

      <Separator />

      <section className={styles.section} aria-label="llms.txt">
        <h2 className={styles.heading}>llms.txt</h2>
        <p className={styles.hint}>
          Opt-in <code>/llms.txt</code> — a markdown summary of the site for AI crawlers
          (ChatGPT/Claude/Perplexity). Google Search ignores it. Goes live after the next publish.
        </p>
        <SeoFormRow label="Enable /llms.txt" htmlFor={`${idBase}-enabled`}>
          <Switch
            id={`${idBase}-enabled`}
            checked={llmsEnabled}
            disabled={!canManage}
            onCheckedChange={setEnabled}
          />
        </SeoFormRow>
        <SeoFormRow label="Intro line" htmlFor={`${idBase}-intro`}>
          <Input
            id={`${idBase}-intro`}
            type="text"
            value={llms.intro ?? ''}
            placeholder="One-line site summary (falls back to the SEO site description)"
            disabled={!canManage}
            onChange={(e) => setIntro(e.target.value)}
          />
        </SeoFormRow>
      </section>

      <Separator />

      <div className={styles.saveRow}>
        <Button
          type="button"
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!canManage || !isDirty || saving}
        >
          {saving ? 'Saving…' : 'Save GEO settings'}
        </Button>
        {savedAt && !isDirty && (
          <span className={styles.savedNote} role="status">Saved — goes live on publish.</span>
        )}
      </div>
    </div>
  )
}
