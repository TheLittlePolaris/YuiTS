/* eslint-disable prefer-rest-params */
import { samePermissions } from '../../helpers'
import { ClientEvents, GuildMember, Message, PermissionResolvable, User } from 'discord.js'

import { COMMAND_HANDLER } from '../../constants'
import { ExecutionContext } from '../../event-execution-context'
import { ICommandHandlerMetadata } from '../../interfaces'
import { Logger } from '../../logger'
import { createMethodDecorator, createParamDecorator } from '../generators'

const getMsgContent = (ctx: ExecutionContext) => {
  const [message] = ctx.getOriginalArguments<ClientEvents['messageCreate']>()
  return message.content.replace(ctx.config['prefix'], '').trim().split(/ +/g)
}

const getMessageProperty = <T extends Message[keyof Message]>(ctx: ExecutionContext, key: keyof Message): T => {
  const [message] = ctx.getOriginalArguments<ClientEvents['messageCreate']>()
  return message[key] as T
}

export const HandleCommand = (command = 'default', ...aliases: string[]) =>
  createMethodDecorator(
    (context: ExecutionContext) => {
      return context
    },
    (target, propertyKey) => {
      let commands: ICommandHandlerMetadata[] = Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
      commands = [...commands, { propertyKey, command, commandAliases: aliases }]
      Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)
    }
  )()

export const DeleteMessage = (strategy?: 'send' | 'reply', responseMessage?: string) =>
  createMethodDecorator(async (ctx) => {
    const [message] = ctx.getOriginalArguments<ClientEvents['messageCreate']>()
    const author = getMessageProperty<User>(ctx, 'author')

    const yuiMember = ctx.client.getGuildMember(message)
    const yuiCanDelete = yuiMember.permissions.has('MANAGE_MESSAGES')

    if (yuiCanDelete) {
      await message.delete().catch((err) => {
        Logger.error(err.stack)
      })
      if (strategy === 'reply') message.reply(responseMessage)
      else if (strategy === 'send') author.send(responseMessage)
    }

    return ctx
  })()

export const Permissions = (...permissions: PermissionResolvable[]) =>
  createMethodDecorator((ctx) => {
    const [message] = ctx.getOriginalArguments<ClientEvents['messageCreate']>()
    const [author, member] = [getMessageProperty<User>(ctx, 'author'), getMessageProperty<GuildMember>(ctx, 'guild')]

    const yuiMember = ctx.client.getGuildMember(message)
    const enoughPermissions = samePermissions(permissions, yuiMember, member)

    if (!enoughPermissions) {
      ctx.terminate()
      author.send('Not enough permission to perform this action').catch(null)
    }

    return ctx
  })()

  /**
 * @descrition Message
 */
export const Msg = createParamDecorator((ctx) => ctx.getOriginalArguments()[0])

/**
 * @descrition The command of this message
 */
export const MsgCmd = createParamDecorator((ctx) => getMsgContent(ctx)[0])

/**
 * @descrition Arguments for the command
 */
export const MsgArgs = createParamDecorator((ctx) => getMsgContent(ctx).slice(1))

/**
 * @descrition Author of this message
 */
export const MsgAuthor = createParamDecorator((ctx) => getMessageProperty(ctx, 'author'))

/**
 * @descrition Guild of this message
 */
export const MsgGuild = createParamDecorator((ctx) => getMessageProperty(ctx, 'guild'))

/**
 * @descrition Channel of this message
 */
export const MsgChannel = createParamDecorator((ctx) => getMessageProperty(ctx, 'channel'))
