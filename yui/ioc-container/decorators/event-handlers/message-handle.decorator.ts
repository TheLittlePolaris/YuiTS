import { ConfigService } from '@/config-service/config.service'
import { ICommandHandlerMetadata, Prototype } from '@/ioc-container/interfaces'
import { ClientEvents, Message, PermissionResolvable } from 'discord.js'
import {
  COMMAND_HANDLER,
  COMMAND_HANDLER_PARAMS,
  MESSAGE_PARAMS,
} from '@/ioc-container/constants/dependencies-injection.constant'

export function HandleCommand(command = 'default', ...aliases: string[]) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command, commandAliases: aliases }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)

    const originalHandler = descriptor.value as Function
    descriptor.value = function ([message]: ClientEvents['messageCreate']) {
      // TODO: Custom prefix will need to edit this
      const [_command, ..._args] = message.content.replace('-', '').trim().split(/ +/g)
      
      const paramList =
        Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
      const { channel, author, guild } = message
      const defaultIndex = [message, author, _args, guild, channel, command]
      const compiledArgs = (paramList.length && paramList.map((i) => defaultIndex[i])) || [message]

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

export const Author = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.AUTHOR)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageParam = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.MESSAGE)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Args = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.ARGS)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageGuild = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.GUILD)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const MessageChannel = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.CHANNEL)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}

export const Command = () => {
  return function (target: Prototype, propertyKey: string, paramIndex: number) {
    const paramList: number[] =
      Reflect.getMetadata(COMMAND_HANDLER_PARAMS, target.constructor, propertyKey) || []
    paramList.unshift(MESSAGE_PARAMS.COMMAND)
    Reflect.defineMetadata(COMMAND_HANDLER_PARAMS, paramList, target.constructor, propertyKey)
  }
}
