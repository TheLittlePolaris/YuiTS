/* eslint-disable prefer-rest-params */
import { ClientEvents, Message, PermissionResolvable } from 'discord.js'

import { COMMAND_HANDLER, METHOD_PARAM_METADATA } from '../../constants'
import { ICommandHandlerMetadata, Prototype } from '../../interfaces'
import { createMethodDecorator, createParamDecorator } from '@/ioc-container/helpers'
import { ExecutionContext } from '@/ioc-container/event-execution-context'
import { getParamDecoratorResolverValue } from '@/ioc-container/containers/params-decorator.container'
import { ConfigService } from '@/config-service/config.service'

export const HandleCommand = (command = 'default', ...aliases: string[]) =>
  createMethodDecorator(
    (context: ExecutionContext) => {
      const compiledArgs = context.getArguments<ClientEvents['messageCreate']>()
      const { target, propertyKey } = context.getContextMetadata()

      const paramResolverList: Record<string, number> =
        Reflect.getMetadata(METHOD_PARAM_METADATA, target.constructor, propertyKey) || []

      Object.entries(paramResolverList).forEach(([key, index]) => {
        const value = getParamDecoratorResolverValue(key, context)
        compiledArgs[index] = value
      })

      context.setArguments(compiledArgs)
      return context
    },
    (target, propertyKey) => {
      let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
      commands = [...commands, { propertyKey, command, commandAliases: aliases }]
      Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)
    }
  )()

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
        yuiMember.permissions.has(permissions)
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

export const MessageParam = createParamDecorator((context) => context.getOriginalArguments()[0])

const getMsgContent = (context: ExecutionContext) => {
  const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>()
  return message.content.replace(context.config['prefix'], '').trim().split(/ +/g)
}
export const Args = createParamDecorator((context) => getMsgContent(context)[0])
export const Command = createParamDecorator((context) => getMsgContent(context).slice(1))

const getMessageProperty = (context: ExecutionContext, key: keyof Message) => {
  const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>()
  return message[key]
}
export const Author = createParamDecorator((context) => getMessageProperty(context, 'author')) //
export const MessageGuild = createParamDecorator((context) => getMessageProperty(context, 'guild'))
export const MessageChannel = createParamDecorator((context) => getMessageProperty(context, 'channel'))
