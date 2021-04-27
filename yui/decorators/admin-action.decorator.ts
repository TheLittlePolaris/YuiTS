import { LOG_SCOPE } from '@/constants/constants'
import { Message, GuildMember, Role } from 'discord.js'
import {
  ADMIN_COMMANDS,
  ADMIN_ACTION_TYPE,
} from '@/handlers/services/administration/admin-interfaces/administration.interface'
import {
  INJECTABLE_METADATA,
  METHOD_PARAM_METADATA,
} from '@/dep-injection-ioc/constants/di-connstants'
import {
  GenericClassDecorator,
  Type,
  Prototype,
  GenericMethodDecorator,
} from '../dep-injection-ioc/interfaces/di-interfaces'
import { decoratorLogger } from '@/dep-injection-ioc/log/logger'

enum ADMIN_PARAMS {
  REASON = 'reason',
  TARGETS = 'targets',
  ROLES = 'roles',
  NICKNAME = 'nickname',
  EXECUTOR = 'executor',
}

export type ADMIN_PARAM_NAME = Record<ADMIN_PARAMS, string>
export type ADMIN_PARAM_KEY = keyof typeof ADMIN_PARAMS

export function AdminActionInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return function (target: Type<T>) {
    decoratorLogger(target.name, 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

export function ValidateCommand<T = any>(): GenericMethodDecorator<T> {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(target.constructor.name, propertyKey)

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
      const reason = args.filter((arg) => !/^<@(?:!?)\d+>/i.test(arg))

      const paramIndexes: { [key: string]: number } = Reflect.getMetadata(
        METHOD_PARAM_METADATA,
        target,
        propertyKey
      )

      const [targetsIndex, executorIndex, reasonIndex] = [
        paramIndexes[ADMIN_PARAMS.TARGETS],
        paramIndexes[ADMIN_PARAMS.EXECUTOR],
        paramIndexes[ADMIN_PARAMS.REASON],
      ]

      if (!targetsIndex) return

      if (paramIndexes[ADMIN_PARAMS.EXECUTOR] !== undefined) _args[executorIndex] = executor
      _args[targetsIndex] = mentionedMembers
      if (['addrole', 'removerole'].includes(subCommand)) {
        const serverRoles = (await message.guild.roles.fetch()).cache.array()
        const selectedRoles: Role[] = serverRoles.filter((role) => {
          const regexp = new RegExp(`^(?:<@&${role.id}>|${role.name})$`, 'gi')
          const { length } = reason.filter(
            (arg, i) => (regexp.test(arg) && delete reason[i]) || false
          )
          return !!length
        })
        if (!selectedRoles) {
          message.author.send('**Please mention a role or type a role name**')
          return
        }
        const updatedReason = reason.filter(Boolean)
        const rolesIndex = paramIndexes[ADMIN_PARAMS.ROLES]
        if (rolesIndex == null) return
        _args[rolesIndex] = selectedRoles
        if (reasonIndex != null) _args[reasonIndex] = updatedReason.join(' ')
        return originalDescriptor.apply(this, _args)
      } else if (['setnickname'].includes(subCommand)) {
        const nicknameIndex = paramIndexes[ADMIN_PARAMS.NICKNAME]

        if (nicknameIndex == null) return
        _args[nicknameIndex] = reason.join(' ')

        return originalDescriptor.apply(this, _args)
      }

      if (reasonIndex != null) _args[reasonIndex] = reason.join(' ')
      return originalDescriptor.apply(this, _args)
    }
  }
}

export const AdminParam = (key: ADMIN_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [ADMIN_PARAMS[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}
