import { GuildMember, PermissionResolvable } from 'discord.js'

export function hasPermissions(
  guildMember: GuildMember,
  permissions: PermissionResolvable[],
  checkAdmin?: boolean
): boolean {
  return guildMember.permissions.has(permissions, checkAdmin)
}

export function samePermissions(permissions: PermissionResolvable[], ...entities: GuildMember[]) {
  return entities.every((entity) => hasPermissions(entity, permissions))
}
