import { Message } from 'discord.js'
import {
  ADMIN_COMMANDS,
  ADMIN_ACTION_TYPE,
} from '@/services/app-services/administration/admin-interfaces/administration.interface'
import { Prototype } from '../interfaces/di-interfaces'
import { decoratorLogger } from '@/ioc-container/log/logger'
import { AdministrationService } from '@/services/app-services/administration/administration.service'

enum REFLECT_PERMISSION_SYMBOLS {
  COMMAND = 'command',
}

const REFLECT_PERMISSION_KEYS = {
  COMMAND: Symbol(REFLECT_PERMISSION_SYMBOLS.COMMAND),
}

export function AdminPermissionValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    // decoratorLogger(target.constructor.name, 'AdminPermissionValidator', propertyKey)
    const originalDescriptor = descriptor.value

    descriptor.value = async function (this: AdministrationService, ..._args: any[]) {
      const [message, args, command] = _args as [Message, Array<string>, string]
      const [yui, actionMember] = await Promise.all([
        this.yui.getMember(message),
        Promise.resolve(message.member),
      ])
      if (!command || !ADMIN_COMMANDS.includes(command)) return

      const isOwner: boolean = message.author.id === this.configService.ownerId

      let yuiPermission, memberPermission: boolean
      switch (command as ADMIN_ACTION_TYPE) {
        case 'kick': {
          yuiPermission = yui.hasPermission(['KICK_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          memberPermission = actionMember.hasPermission(['KICK_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          break
        }
        case 'ban': {
          yuiPermission = yui.hasPermission(['BAN_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          memberPermission = actionMember.hasPermission(['BAN_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          break
        }
        case 'addrole':
        case 'removerole': {
          memberPermission = actionMember.hasPermission(['MANAGE_ROLES'], {
            checkAdmin: true,
            checkOwner: true,
          })
          yuiPermission = yui.hasPermission(['MANAGE_ROLES'], {
            checkAdmin: true,
            checkOwner: true,
          })
          break
        }
        case 'mute':
        case 'unmute': {
          memberPermission = actionMember.hasPermission(['MUTE_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          yuiPermission = yui.hasPermission(['MUTE_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          break
        }
        case 'setnickname': {
          memberPermission = actionMember.hasPermission(['MANAGE_NICKNAMES'], {
            checkAdmin: true,
            checkOwner: true,
          })
          yuiPermission = yui.hasPermission(['MUTE_MEMBERS'], {
            checkAdmin: true,
            checkOwner: true,
          })
          break
        }
        default:
          memberPermission = false
          yuiPermission = false
          break
      }

      if (!(yuiPermission && (memberPermission || isOwner))) return

      return originalDescriptor.apply(this, _args)
    }
  }
}

export function CommandValidator() {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    // decoratorLogger(target.constructor.name, 'CommandValidator', propertyKey)
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

export const Command = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.COMMAND, paramIndex, target, propertyKey)
  }
}
