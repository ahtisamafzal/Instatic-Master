/** AEO workspace API client — typed wrappers over `/admin/api/cms/aeo/*`. */
import { Type, type Static } from '@core/utils/typeboxHelpers'
import { apiRequest } from '@core/http'
import { AeoMetadataSchema, type AeoMetadata } from '@core/aeo'

const AeoTargetSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  route: Type.String(),
  aeo: Type.Union([AeoMetadataSchema, Type.Null()]),
})
export type AeoTarget = Static<typeof AeoTargetSchema>

const AeoTargetsResponseSchema = Type.Object({ targets: Type.Array(AeoTargetSchema) })
const AeoTargetPutResponseSchema = Type.Object({ target: AeoTargetSchema })

export async function fetchAeoTargets(signal?: AbortSignal): Promise<{ targets: AeoTarget[] }> {
  return apiRequest('/admin/api/cms/aeo/targets', { schema: AeoTargetsResponseSchema, signal, fallbackMessage: 'Could not load AEO targets' })
}

export async function saveAeoTarget(id: string, aeo: AeoMetadata): Promise<AeoTarget> {
  const result = await apiRequest(`/admin/api/cms/aeo/targets/${encodeURIComponent(id)}`, { method: 'PUT', body: { aeo }, schema: AeoTargetPutResponseSchema, fallbackMessage: 'Could not save AEO data' })
  return result.target
}
