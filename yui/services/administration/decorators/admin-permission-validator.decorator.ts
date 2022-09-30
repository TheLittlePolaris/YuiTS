import { Message } from 'discord.js';
import { createMethodDecorator, ExecutionContext, hasPermissions } from 'djs-ioc-container';

import { AdminAction, AdminActionPermission } from '../admin-interfaces';
import { getEnumValues } from '../../utilities';

const adminCommands = getEnumValues(AdminAction);

export const AdminPermissionValidator = createMethodDecorator((context: ExecutionContext) => {
  const [message, _, command] =
    context.getOriginalArguments<[Message, Array<string>, AdminAction]>();
  if (!command || !adminCommands.includes(command)) {
    context.terminate();
    return context;
  }

  const isOwner = message.author.id === context.config.get('OWNERID');

  if (
    !hasPermissions(
      context.client.getGuildMemberByMessage(message),
      AdminActionPermission[command]
    ) ||
    !(isOwner || hasPermissions(message.member, AdminActionPermission[command]))
  )
    context.terminate();

  return context;
});
