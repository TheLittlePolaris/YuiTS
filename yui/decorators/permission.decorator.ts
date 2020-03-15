import type { GuildMember } from 'discord.js'
import {
  AdminCommands,
  ADMIN_ACTION_TYPE
} from '@/handlers/services/administration/admin-interfaces/administration.interface'

export const CheckMemberPermissions = ({actionMember, action}: { actionMember: GuildMember, action: string}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalDescriptor = descriptor.value
    descriptor.value = function(...args: any[]) {
      if (!action || !AdminCommands.includes(action)) return
      switch (action as ADMIN_ACTION_TYPE) {
        case 'kick': {
          if (actionMember.hasPermission(['KICK_MEMBERS'], false, true, true))
            return originalDescriptor.apply(this, args)
          return
        }
        case 'ban': {
          if (actionMember.hasPermission(['BAN_MEMBERS'], false, true, true))
            return originalDescriptor.apply(this, args)
          return
        }
        case 'addrole':
        case 'removerole': {
          if (actionMember.hasPermission(['MANAGE_ROLES'], false, true, true))
            return originalDescriptor.apply(this, args)
          return
        }
        case 'mute':
        case 'unmute': {
          if (actionMember.hasPermission(['MUTE_MEMBERS'], false, true, true))
            return originalDescriptor.apply(this, args)
          return
        }
        default:
          return
      }
    }
  }
}
