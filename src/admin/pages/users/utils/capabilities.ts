/**
 * Capability metadata + groupings shown in the role-edit dialog.
 *
 * Every entry in `CAPABILITY_GROUPS` maps to a `<section>` with its own
 * "Select all / Clear" header. `CAPABILITY_META` carries the human-readable
 * label + description rendered next to each checkbox so admins don't have to
 * decode raw permission strings like `site.structure.edit`.
 *
 * Adding a new capability: append it to `CORE_CAPABILITIES` (server +
 * `src/core/capabilities.ts`), then add it to one of the groups here and add
 * its meta entry. The dialog only renders capabilities listed here â€” the
 * `capability-picker-coverage.test.ts` gate enforces full coverage so a new
 * capability can't quietly disappear from the role-edit UI.
 */
import type { CoreCapability } from '@core/capabilities'
import type { CapabilityGroup } from '../types'

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  { title: 'Dashboard', capabilities: ['dashboard.read'] },
  {
    title: 'Site',
    capabilities: [
      'site.read',
      'site.structure.edit',
      'site.content.edit',
      'site.style.edit',
    ],
  },
  { title: 'Pages', capabilities: ['pages.edit', 'pages.publish'] },
  {
    title: 'Content',
    capabilities: [
      'content.create',
      'content.edit.own',
      'content.edit.any',
      'content.publish.own',
      'content.publish.any',
      'content.manage',
    ],
  },
  {
    title: 'Data',
    capabilities: [
      'data.custom.tables.read',
      'data.custom.tables.manage',
      'data.system.tables.read',
      'data.system.tables.manage',
      'data.rows.move',
      'data.export',
      'data.import',
    ],
  },
  {
    title: 'Media',
    capabilities: ['media.read', 'media.write', 'media.replace', 'media.delete'],
  },
  {
    title: 'Runtime & storage',
    capabilities: ['runtime.dependencies', 'storage.elect', 'storage.migrate'],
  },
  {
    title: 'Plugins',
    capabilities: ['plugins.read', 'plugins.configure', 'plugins.install', 'plugins.lifecycle'],
  },
  {
    title: 'AI',
    capabilities: ['ai.chat', 'ai.tools.write', 'ai.providers.manage', 'ai.audit.read'],
  },
  { title: 'SEO', capabilities: ['seo.read', 'seo.manage'] },
  { title: 'Users & Roles', capabilities: ['users.manage', 'roles.manage'] },
  { title: 'Audit', capabilities: ['audit.read'] },
]

/**
 * Flat list of every capability rendered by the role-edit dialog, in the
 * order defined by `CAPABILITY_GROUPS`. Used for the dialog's "select all
 * across every group" master toggle.
 */
export const ALL_PICKER_CAPABILITIES: readonly CoreCapability[] = CAPABILITY_GROUPS.flatMap(
  (group) => group.capabilities,
)
