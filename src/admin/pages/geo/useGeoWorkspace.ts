/** useGeoWorkspace — GEO workspace data layer. Loads `site.settings.geo` once, exposes a typed save. */
import { useEffect, useState } from 'react'
import { isAbortError } from '@core/http'
import { getErrorMessage } from '@core/utils/errorMessage'
import type { SiteGeoSettings } from '@core/geo'
import { fetchSiteGeo, saveSiteGeo } from './geoApi'

export interface GeoWorkspace {
  loading: boolean
  error: string | null
  siteName: string
  publicOrigin: string | null
  siteGeo: SiteGeoSettings | null
  /** PUT site.settings.geo; updates local state on success. */
  saveSite: (geo: SiteGeoSettings) => Promise<void>
}

export function useGeoWorkspace(): GeoWorkspace {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [siteName, setSiteName] = useState('')
  const [publicOrigin, setPublicOrigin] = useState<string | null>(null)
  const [siteGeo, setSiteGeo] = useState<SiteGeoSettings | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchSiteGeo(controller.signal)
      .then((payload) => {
        setSiteName(payload.siteName)
        setPublicOrigin(payload.publicOrigin)
        setSiteGeo(payload.siteGeo)
        setError(null)
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return
        console.error('[geo-page] load failed:', err)
        setError(getErrorMessage(err, 'Could not load GEO settings'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function saveSite(geo: SiteGeoSettings): Promise<void> {
    const saved = await saveSiteGeo(geo)
    setSiteGeo(saved)
  }

  return { loading, error, siteName, publicOrigin, siteGeo, saveSite }
}
