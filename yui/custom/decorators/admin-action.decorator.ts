import { Message, GuildMember, Role } from 'discord.js'
import { ADMIN_COMMANDS, ADMIN_ACTION_TYPE } from '@/services/app-services/administration/admin-interfaces'
import { GenericMethodDecorator, Prototype, METHOD_PARAM_METADATA } from '@/ioc-container'

enum ADMIN_PARAMS {
  REASON = 'reason',
  TARGETS = 'targets',
  ROLES = 'roles',
  NICKNAME = 'nickname',
  EXECUTOR = 'executor',
}

export type ADMIN_PARAM_NAME = Record<ADMIN_PARAMS, string>
export type ADMIN_PARAM_KEY = keyof typeof ADMIN_PARAMS

export function AdminCommandValidator(): GenericMethodDecorator<any> {
  return function (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) {
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

      const mentionedMembers = message.mentions.members

      if (!mentionedMembers.size) {
        message.author.send('**Please mention at least one member for the action.**')
        return
      }
      const reason = args.filter((arg) => !/^<@(?:!?)\d+>/i.test(arg))

      const {
        [ADMIN_PARAMS.TARGETS]: targetsIndex,
        [ADMIN_PARAMS.EXECUTOR]: executorIndex,
        [ADMIN_PARAMS.REASON]: reasonIndex,
        [ADMIN_PARAMS.ROLES]: roles,
        [ADMIN_PARAMS.NICKNAME]: nickName,
      } = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}

      if (!targetsIndex) return

      if (executorIndex !== undefined) _args[executorIndex] = executor
      _args[targetsIndex] = mentionedMembers
      if (['addrole', 'removerole'].includes(subCommand)) {
        const serverRoles = message.guild.roles.cache
        const selectedRoles = serverRoles.filter((role) => {
          const regexp = new RegExp(`^(?:<@&${role.id}>|${role.name})$`, 'gi')
          const { length } = reason.filter((arg, i) => (regexp.test(arg) && delete reason[i]) || false)
          return !!length
        })
        if (!selectedRoles) {
          message.author.send('**Please mention a role or type a role name**')
          return
        }
        const updatedReason = reason.filter(Boolean)
        const rolesIndex = roles
        if (rolesIndex == null) return
        _args[rolesIndex] = selectedRoles
        if (reasonIndex != null) _args[reasonIndex] = updatedReason.join(' ')
        return originalDescriptor.apply(this, _args)
      } else if (['setnickname'].includes(subCommand)) {
        const nicknameIndex = nickName

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
