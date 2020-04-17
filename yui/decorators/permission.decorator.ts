import { GuildMember, Message, Role } from 'discord.js'
import {
  AdminCommands,
  ADMIN_ACTION_TYPE,
} from '@/handlers/services/administration/admin-interfaces/administration.interface'
import { TFunction, LOG_SCOPE } from '@/constants/constants'
import { AdminstrationActionCommands } from '@/handlers/services/administration/administration-actions/action.service'
import { decoratorLogger } from '@/handlers/log.handler'

enum REFLECT_PERMISSION_SYMBOLS {
  REASON = 'reason',
  TARGETS = 'targets',
  ROLES = 'roles',
  COMMAND = 'command',
  NICKNAME = 'nickname',
  EXECUTOR = 'executor',
}

const REFLECT_PERMISSION_KEYS = {
  REASON_KEY: Symbol(REFLECT_PERMISSION_SYMBOLS.REASON),
  TARGETS_KEY: Symbol(REFLECT_PERMISSION_SYMBOLS.TARGETS),
  COMMAND: Symbol(REFLECT_PERMISSION_SYMBOLS.COMMAND),
  ROLES: Symbol(REFLECT_PERMISSION_SYMBOLS.ROLES),
  NICKNAME: Symbol(REFLECT_PERMISSION_SYMBOLS.NICKNAME),
  EXECUTOR: Symbol(REFLECT_PERMISSION_SYMBOLS.EXECUTOR),
}

export const AdministrationServiceInitiator = (forwardRefFunc?: () => any) => {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], LOG_SCOPE.ADMIN_SERVICE, 'Initiator')
    return class extends superClass {
      _adminActionCommands = new AdminstrationActionCommands()
    }
  }
}

export const ValidatePermissions = () => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    decoratorLogger(
      'ValidatePermissions - Method',
      LOG_SCOPE.ADMIN_ACTION_COMMAND,
      propertyKey
    )
    const originalDescriptor = descriptor.value!

    descriptor.value = function (..._args: any[]) {
      const [message, args, command] = _args as [Message, Array<string>, string]
      const [yui, actionMember] = [
        message.guild.members.find(
          (member) => member.id === global.config.yuiId
        ),
        message.member,
      ]
      if (!command || !AdminCommands.includes(command)) return
      const isOwner: boolean = message.author.id === global.config.ownerId

      let yuiPermission, memberPermission: boolean
      switch (command as ADMIN_ACTION_TYPE) {
        case 'kick': {
          yuiPermission = yui.hasPermission(['KICK_MEMBERS'], false, true, true)
          memberPermission = actionMember.hasPermission(
            ['KICK_MEMBERS'],
            false,
            true,
            true
          )
          break
        }
        case 'ban': {
          yuiPermission = yui.hasPermission(['BAN_MEMBERS'], false, true, true)
          memberPermission = actionMember.hasPermission(
            ['BAN_MEMBERS'],
            false,
            true,
            true
          )
          break
        }
        case 'addrole':
        case 'removerole': {
          memberPermission = actionMember.hasPermission(
            ['MANAGE_ROLES'],
            false,
            true,
            true
          )
          yuiPermission = yui.hasPermission(['MANAGE_ROLES'], false, true, true)
          break
        }
        case 'mute':
        case 'unmute': {
          memberPermission = actionMember.hasPermission(
            ['MUTE_MEMBERS'],
            false,
            true,
            true
          )
          yuiPermission = yui.hasPermission(['MUTE_MEMBERS'], false, true, true)
          break
        }
        case 'setnickname': {
          memberPermission = actionMember.hasPermission(
            ['MANAGE_NICKNAMES'],
            false,
            true,
            true
          )
          yuiPermission = yui.hasPermission(['MUTE_MEMBERS'], false, true, true)
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

export const CommandExecutor = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorLogger(
      'CommandExecutor - Method',
      LOG_SCOPE.ADMIN_SERVICE,
      propertyKey
    )
    const originalDescriptor = descriptor.value!
    descriptor.value = function (..._args: any[]) {
      console.log('command executor validator')
      const [message, args] = _args as [Message, Array<string>]

      if (!args.length) {
        message.author.send(`**You must specify which action to be executed.**`)
        return
      }
      if (!AdminCommands.includes(args[0])) return
      const subCommand: ADMIN_ACTION_TYPE = <ADMIN_ACTION_TYPE>args.shift()

      const commandIndex = Reflect.getMetadata(
        REFLECT_PERMISSION_KEYS.COMMAND,
        target,
        propertyKey
      )

      if (commandIndex) _args[commandIndex] = subCommand
      return originalDescriptor.apply(this, _args)
    }
  }
}

export const ValidateCommand = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    decoratorLogger(
      'ValidateCommand - Method',
      LOG_SCOPE.ADMIN_SERVICE,
      propertyKey
    )
    const originalDescriptor = descriptor.value!

    descriptor.value = function (..._args: any[]) {
      console.log('RUN validate command')
      const [message, args] = _args as [Message, Array<string>]

      if (!args.length) {
        message.author.send(`**You must specify which action to be executed.**`)
        return
      }
      if (!AdminCommands.includes(propertyKey)) return
      const subCommand: ADMIN_ACTION_TYPE = <ADMIN_ACTION_TYPE>propertyKey

      const executor: GuildMember = message.member

      const mentionedMembers = message.mentions.members.array()

      if (!mentionedMembers.length) {
        message.author.send(
          '**Please mention at least one member for the action.**'
        )
        return
      }

      const mentionedStrings = mentionedMembers.map((member) => member.id)
      const reason = args.filter((arg) => {
        return mentionedStrings.every((str) => {
          return !new RegExp(str, 'i').test(arg)
        })
      })

      const [executorIndex, targetsIndex, reasonIndex] = [
        Reflect.getMetadata(
          REFLECT_PERMISSION_KEYS.EXECUTOR,
          target,
          propertyKey
        ),
        Reflect.getMetadata(
          REFLECT_PERMISSION_KEYS.TARGETS_KEY,
          target,
          propertyKey
        ),
        Reflect.getMetadata(
          REFLECT_PERMISSION_KEYS.REASON_KEY,
          target,
          propertyKey
        ),
      ]

      if (!targetsIndex) return

      if (executorIndex !== undefined) _args[executorIndex] = executor
      _args[targetsIndex] = mentionedMembers

      if (['addrole', 'removerole'].includes(subCommand)) {
        console.log(reason, ' <====== REASON ARGSSSSSSSS')
        const serverRoles = message.guild.roles.array()
        const selectedRoles: Role[] = serverRoles
          .map((role) => {
            // console.log('==============================================')
            const test = reason.filter((arg) => {
              // console.log(
              //   `Role: ${role.id} ------ ${role.name}  ===== ARGS: ${arg}`
              // )
              const idTest = new RegExp(role.id, 'i').test(arg)
              // console.log(idTest, ' ================ ID TESTTTTTTTTTTTTT')
              const nameTest = new RegExp(role.name, 'i').test(arg)
              // console.log(
              //   nameTest,
              //   ' <========================   NAME TESTTTTTTTTTTTTTT '
              // )
              return idTest || nameTest
            })
            // console.log(test, ' <====== ROLE TEST RESULTTTTTTTTT')
            return !!test.length && role
          })
          .filter(Boolean)

        if (!selectedRoles) {
          message.author.send('**Please mention a role or type a role name**')
          return
        }

        // console.log(selectedRoles.length)

        const updatedReason = reason.filter((arg) => {
          const test = selectedRoles.filter((role) => {
            const idTest = new RegExp(role.id, 'i').test(arg)
            const nameTest = new RegExp(role.name, 'i').test(arg)
            return idTest || nameTest
          })
          return !test.length
        })

        const rolesIndex = Reflect.getMetadata(
          REFLECT_PERMISSION_KEYS.ROLES,
          target,
          propertyKey
        )

        if (rolesIndex === undefined) return
        _args[rolesIndex] = selectedRoles

        if (reasonIndex !== undefined)
          _args[reasonIndex] = updatedReason.join(' ')

        return originalDescriptor.apply(this, _args)
      } else if (['setnickname'].includes(subCommand)) {
        const nicknameIndex = Reflect.getMetadata(
          REFLECT_PERMISSION_KEYS.NICKNAME,
          target,
          propertyKey
        )

        if (nicknameIndex === undefined) return
        _args[nicknameIndex] = reason.join(' ')

        return originalDescriptor.apply(this, _args)
      }

      if (reasonIndex !== undefined) _args[reasonIndex] = reason.join(' ')
      return originalDescriptor.apply(this, _args)
    }
  }
}

export const Command = () => {
  return function (target: any, propertyKey: string, paramIndex: number) {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.COMMAND,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const Targets = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.TARGETS_KEY,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const Reason = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.REASON_KEY,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const NickName = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.NICKNAME,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const GuildRoles = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.ROLES,
      paramIndex,
      target,
      propertyKey
    )
  }
}

export const Executor = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(
      REFLECT_PERMISSION_KEYS.EXECUTOR,
      paramIndex,
      target,
      propertyKey
    )
  }
}
