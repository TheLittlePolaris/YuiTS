import { AdminAction, AdminActionPermission } from '../admin-interfaces'
import { Message } from 'discord.js'
import { createMethodDecorator, ExecutionContext, hasPermissions } from 'djs-ioc-container'
import { getEnumValues } from '../../utilities'

const adminCommands = getEnumValues(AdminAction)

export const AdminPermissionValidator = createMethodDecorator((ctx: ExecutionContext) => {
  const [message, _, command] = ctx.getOriginalArguments<[Message, Array<string>, AdminAction]>()
  if (!command || !adminCommands.includes(command)) {
    ctx.terminate()
    return ctx
  }

  const isOwner = message.author.id === ctx.config.get('OWNERID')

  if (
    !hasPermissions(ctx.client.getGuildMemberByMessage(message), AdminActionPermission[command]) ||
    !(isOwner || hasPermissions(message.member, AdminActionPermission[command]))
  ) {
    ctx.terminate()
  }

  return ctx
})

