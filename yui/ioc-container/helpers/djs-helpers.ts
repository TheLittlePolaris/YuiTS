import { GuildMember, PermissionResolvable } from 'discord.js'

export function hasPermissions(guildMember: GuildMember, permissions: PermissionResolvable[]): boolean {
  return guildMember.permissions.has(permissions)
}

export function samePermissions(permissions: PermissionResolvable[], ...entities: GuildMember[]) {
  return entities.every((entity) => hasPermissions(entity, permissions))
}

