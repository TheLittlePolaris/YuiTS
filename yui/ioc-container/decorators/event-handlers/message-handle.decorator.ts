/* eslint-disable prefer-rest-params */
import { ClientEvents, Guild, GuildMember, Message, PermissionResolvable, User } from 'discord.js'

import { COMMAND_HANDLER } from '../../constants'
import { ICommandHandlerMetadata } from '../../interfaces'
import { createMethodDecorator, createParamDecorator, samePermissions } from '../../helpers'
import { ExecutionContext } from '../../event-execution-context'
import { Logger } from '../../logger'

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

export const DeleteOriginalMessage = (strategy?: 'send' | 'reply', responseMessage?: string) =>
  createMethodDecorator(async (ctx) => {
    const [message] = ctx.getOriginalArguments<ClientEvents['messageCreate']>()
    const cfg = ctx.config
    const guild = getMessageProperty<Guild>(ctx, 'guild')
    const author = getMessageProperty<User>(ctx, 'author')

    const yuiMember = guild.members.resolve(cfg['yuiId'])
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

export const MemberPermissions = (...permissions: PermissionResolvable[]) =>
  createMethodDecorator((ctx) => {
    const [author, member, guild] = [
      getMessageProperty<User>(ctx, 'author'),
      getMessageProperty<GuildMember>(ctx, 'guild'),
      getMessageProperty<Guild>(ctx, 'guild')
    ]

    const yuiMember = guild.members.resolve(ctx.config['yuiId'])
    const enoughPermissions = samePermissions(permissions, yuiMember, member)

    if (!enoughPermissions) {
      ctx.terminate()
      author.send('Not enough permission to perform this action').catch(null)
    }

    return ctx
  })()

export const Msg = createParamDecorator((ctx) => ctx.getOriginalArguments()[0])
export const Args = createParamDecorator((ctx) => getMsgContent(ctx)[0])
export const Command = createParamDecorator((ctx) => getMsgContent(ctx).slice(1))
export const MsgAuthor = createParamDecorator((ctx) => getMessageProperty(ctx, 'author')) //
export const MsgGuild = createParamDecorator((ctx) => getMessageProperty(ctx, 'guild'))
export const MsgChannel = createParamDecorator((ctx) => getMessageProperty(ctx, 'channel'))
