/** useAeoWorkspace — loads the page target index once, exposes a per-target save. */
import { useEffect, useState } from 'react'
import { isAbortError } from '@core/http'
import { getErrorMessage } from '@core/utils/errorMessage'
import type { AeoMetadata } from '@core/aeo'
import { fetchAeoTargets, saveAeoTarget, type AeoTarget } from './aeoApi'

export interface AeoWorkspace {
  loading: boolean
  error: string | null
  targets: AeoTarget[]
  saveTarget: (id: string, aeo: AeoMetadata) => Promise<AeoTarget>
}

export function useAeoWorkspace(): AeoWorkspace {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [targets, setTargets] = useState<AeoTarget[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetchAeoTargets(controller.signal)
      .then((payload) => { setTargets(payload.targets); setError(null) })
      .catch((err: unknown) => { if (isAbortError(err)) return; console.error('[aeo-page] load failed:', err); setError(getErrorMessage(err, 'Could not load AEO targets')) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function saveTarget(id: string, aeo: AeoMetadata): Promise<AeoTarget> {
    const updated = await saveAeoTarget(id, aeo)
    setTargets((current) => current.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  return { loading, error, targets, saveTarget }
}
