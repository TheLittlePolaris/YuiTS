import { LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { Message, GuildMember, Role } from 'discord.js'
import {
  ADMIN_COMMANDS,
  ADMIN_ACTION_TYPE,
} from '@/handlers/services/administration/admin-interfaces/administration.interface'
import { INJECTABLE_METADATA } from '@/decorators/dep-injection-ioc/constants/di-connstants'
import { GenericClassDecorator, Type } from './dep-injection-ioc/interfaces/di-interfaces'

enum REFLECT_ADMIN_ACTION_SYMBOLS {
  REASON = 'reason',
  TARGETS = 'targets',
  ROLES = 'roles',
  NICKNAME = 'nickname',
  EXECUTOR = 'executor',
}

const REFLECT_PERMISSION_KEYS = {
  REASON_KEY: Symbol(REFLECT_ADMIN_ACTION_SYMBOLS.REASON),
  TARGETS_KEY: Symbol(REFLECT_ADMIN_ACTION_SYMBOLS.TARGETS),
  ROLES: Symbol(REFLECT_ADMIN_ACTION_SYMBOLS.ROLES),
  NICKNAME: Symbol(REFLECT_ADMIN_ACTION_SYMBOLS.NICKNAME),
  EXECUTOR: Symbol(REFLECT_ADMIN_ACTION_SYMBOLS.EXECUTOR),
}

export function AdminActionInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return function (target: Type<T>) {
    decoratorLogger(target['name'], LOG_SCOPE.ADMIN_ACTION_COMMAND, 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

export function ValidateCommand() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(LOG_SCOPE.ADMIN_SERVICE, 'ValidateCommand - Method', propertyKey)
    const originalDescriptor = descriptor.value

    descriptor.value = async function (..._args: any[]) {
      const [message, args] = _args as [Message, Array<string>]

      if (!args.length) {
        message.author.send(`**You must specify which action to be executed.**`)
        return
      }
      if (!ADMIN_COMMANDS.includes(propertyKey)) return
      const subCommand: ADMIN_ACTION_TYPE = <ADMIN_ACTION_TYPE>propertyKey

      const executor: GuildMember = message.member

      const mentionedMembers = message.mentions.members.array()

      if (!mentionedMembers.length) {
        message.author.send('**Please mention at least one member for the action.**')
        return
      }

      const mentionedStrings = mentionedMembers.map((member) => member.id)
      const reason = args.filter((arg) => {
        return mentionedStrings.every((str) => {
          return !new RegExp(str, 'i').test(arg)
        })
      })

      const [executorIndex, targetsIndex, reasonIndex] = [
        Reflect.getMetadata(REFLECT_PERMISSION_KEYS.EXECUTOR, target, propertyKey),
        Reflect.getMetadata(REFLECT_PERMISSION_KEYS.TARGETS_KEY, target, propertyKey),
        Reflect.getMetadata(REFLECT_PERMISSION_KEYS.REASON_KEY, target, propertyKey),
      ]

      if (!targetsIndex) return

      if (executorIndex !== undefined) _args[executorIndex] = executor
      _args[targetsIndex] = mentionedMembers

      if (['addrole', 'removerole'].includes(subCommand)) {
        const serverRoles = await (await message.guild.roles.fetch()).cache.array()
        const selectedRoles: Role[] = serverRoles
          .map((role) => {
            const test = reason.filter((arg) => {
              const idTest = new RegExp(role.id, 'i').test(arg)
              const nameTest = new RegExp(role.name, 'i').test(arg)
              return idTest || nameTest
            })
            return !!test.length && role
          })
          .filter(Boolean)

        if (!selectedRoles) {
          message.author.send('**Please mention a role or type a role name**')
          return
        }

        const updatedReason = reason.filter((arg) => {
          const test = selectedRoles.filter((role) => {
            const idTest = new RegExp(role.id, 'i').test(arg)
            const nameTest = new RegExp(role.name, 'i').test(arg)
            return idTest || nameTest
          })
          return !test.length
        })

        const rolesIndex = Reflect.getMetadata(REFLECT_PERMISSION_KEYS.ROLES, target, propertyKey)

        if (rolesIndex === undefined) return
        _args[rolesIndex] = selectedRoles

        if (reasonIndex !== undefined) _args[reasonIndex] = updatedReason.join(' ')

        return originalDescriptor.apply(this, _args)
      } else if (['setnickname'].includes(subCommand)) {
        const nicknameIndex = Reflect.getMetadata(REFLECT_PERMISSION_KEYS.NICKNAME, target, propertyKey)

        if (nicknameIndex === undefined) return
        _args[nicknameIndex] = reason.join(' ')

        return originalDescriptor.apply(this, _args)
      }

      if (reasonIndex !== undefined) _args[reasonIndex] = reason.join(' ')
      return originalDescriptor.apply(this, _args)
    }
  }
}

export const Targets = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.TARGETS_KEY, paramIndex, target, propertyKey)
  }
}

export const Reason = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.REASON_KEY, paramIndex, target, propertyKey)
  }
}

export const NickName = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.NICKNAME, paramIndex, target, propertyKey)
  }
}

export const GuildRoles = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.ROLES, paramIndex, target, propertyKey)
  }
}

export const Executor = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_PERMISSION_KEYS.EXECUTOR, paramIndex, target, propertyKey)
  }
}
