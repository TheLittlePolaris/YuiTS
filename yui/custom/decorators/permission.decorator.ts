import { Message, PermissionResolvable } from 'discord.js'
import {
  ADMIN_COMMANDS,
  ADMIN_ACTION_TYPE
} from '@/services/app-services/administration/admin-interfaces/administration.interface'
import { AdministrationService } from '@/services/app-services/administration/administration.service'
import { Prototype, BOT_GLOBAL_CLIENT, BOT_GLOBAL_CONFIG } from 'djs-ioc-container'

enum REFLECT_PERMISSION_SYMBOLS {
  COMMAND = 'command'
}

const REFLECT_PERMISSION_KEYS = {
  COMMAND: Symbol(REFLECT_PERMISSION_SYMBOLS.COMMAND)
}

export function AdminPermissionValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalDescriptor = descriptor.value

    descriptor.value = async function (this: AdministrationService, ..._args: any[]) {
      const [message, args, command] = _args as [Message, Array<string>, string]
      const [yui, actionMember] = await Promise.all([
        this[BOT_GLOBAL_CLIENT].getGuildMember(message),
        Promise.resolve(message.member)
      ])
      if (!command || !ADMIN_COMMANDS.includes(command)) return

      const isOwner: boolean = message.author.id === this[BOT_GLOBAL_CONFIG].ownerId

      let yuiPermission, memberPermission: boolean

      const hasPermissions = (permissions: PermissionResolvable) => {
        yuiPermission = yui.permissions.has(permissions, true)
        memberPermission = actionMember.permissions.has(permissions, true)
      }

      switch (command as ADMIN_ACTION_TYPE) {
        case 'kick': {
          hasPermissions(['KICK_MEMBERS'])
          break
        }
        case 'ban': {
          hasPermissions(['BAN_MEMBERS'])
          break
        }
        case 'addrole':
        case 'removerole': {
          hasPermissions(['MANAGE_ROLES'])
          break
        }
        case 'mute':
        case 'unmute': {
          hasPermissions(['MUTE_MEMBERS'])
          break
        }
        case 'setnickname': {
          hasPermissions(['MANAGE_NICKNAMES'])
          break
        }
        default:
          hasPermissions('ADMINISTRATOR')
          break
      }

      if (!(yuiPermission && (memberPermission || isOwner))) return

      return originalDescriptor.apply(this, _args)
    }
  }
}

export function CommandValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalDescriptor = descriptor.value
    descriptor.value = function (..._args: any[]) {
      const [message, args] = _args as [Message, Array<string>]

      if (!args.length) {
        message.author.send(`**You must specify which action to be executed.**`)
        return
      }
      if (!ADMIN_COMMANDS.includes(args[0])) return
      const subCommand: ADMIN_ACTION_TYPE = <ADMIN_ACTION_TYPE>args.shift()

      const commandIndex = Reflect.getMetadata(REFLECT_PERMISSION_KEYS.COMMAND, target, propertyKey)

      if (commandIndex) _args[commandIndex] = subCommand

      return originalDescriptor.apply(this, _args)
    }
  }
}

export const AdminCommand = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.COMMAND, paramIndex, target, propertyKey)
  }
}
