/* eslint-disable prefer-rest-params */
import { ClientEvents, Message, PermissionResolvable } from 'discord.js'

import { ConfigService } from '@/config-service/config.service'

import { COMMAND_HANDLER, COMMAND_HANDLER_PARAMS, MESSAGE_PARAMS } from '../../constants'
import { ICommandHandlerMetadata, Prototype } from '../../interfaces'

export function HandleCommand(command = 'default', ...aliases: string[]) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command, commandAliases: aliases }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)

    const originalHandler = descriptor.value as Function
    descriptor.value = function ([message]: ClientEvents['messageCreate']) {
      const [_, ...args] = message.content.replace('-', '').trim().split(/ +/g)

      const paramList: [number, number][] =
        Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []

      const { channel, author, guild } = message
      const defaultIndex = [message, author, args, guild, channel, command]

      const compiledArgs = []
      for (let i = 0, n = paramList.length; i < n; i++) {
        const [defaultPosition, definedPosition] = paramList[i]
        compiledArgs[definedPosition] = defaultIndex[defaultPosition]
      }

      return originalHandler.apply(this, compiledArgs)
    }
  }
}

export function DeleteOriginalMessage(strategy?: 'send' | 'reply', responseMessage?: string) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalHandler = descriptor.value as Function
    descriptor.value = function (...args: any[]) {
      const [message, config] = args.slice(-2) as [Message, ConfigService]
      const { guild, author } = message

      const yuiMember = guild.members.resolve(config.yuiId)
      const yuiCanDelete = yuiMember.permissions.has('MANAGE_MESSAGES')

      if (yuiCanDelete) {
        message
          .delete()
          .then(() => {
            if (!strategy) return
            if (strategy === 'reply') message.reply(responseMessage)
            else author.send(responseMessage)
          })
          .catch(null)
      }

      return originalHandler.apply(this, args)
    }
  }
}

export function MemberPermissions(...permissions: PermissionResolvable[]) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalHandler = descriptor.value as Function
    descriptor.value = function (...args: any[]) {
      const [message, config] = args.slice(-2) as [Message, ConfigService]
      const { author, member, guild } = message

      const yuiMember = guild.members.resolve(config.yuiId)
      const [hasPermissions, yuiHasPermission] = [
        member.permissions.has(permissions),
        yuiMember.permissions.has(permissions),
      ]

      if (!hasPermissions) {
        author.send('You dont have permission to use this function')
        return null
      }
      if (!yuiHasPermission) {
        author.send('I dont have permission to perform this action')
        return null
      }

      return originalHandler.apply(this, args)
    }
  }
}

const defineIndex = (defaultIndex: MESSAGE_PARAMS) => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: [number, number][] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift([defaultIndex, paramIndex])
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Author = () => {
  return defineIndex(MESSAGE_PARAMS.AUTHOR)
}

export const MessageParam = () => {
  return defineIndex(MESSAGE_PARAMS.MESSAGE)
}

export const Args = () => {
  return defineIndex(MESSAGE_PARAMS.ARGS)
}

export const MessageGuild = () => {
  return defineIndex(MESSAGE_PARAMS.GUILD)
}

export const MessageChannel = () => {
  return defineIndex(MESSAGE_PARAMS.CHANNEL)
}

export const Command = () => {
  return defineIndex(MESSAGE_PARAMS.COMMAND)
}
