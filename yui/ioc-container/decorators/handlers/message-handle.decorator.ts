/* eslint-disable prefer-rest-params */
import {
  ClientEvents,
  GuildMember,
  Message,
  PermissionFlagsBits,
  PermissionResolvable,
  User
} from 'discord.js';

import { samePermissions } from '../../helpers';
import { COMMAND_HANDLER } from '../../constants';
import { ExecutionContext } from '../../event-execution-context';
import { ICommandHandlerMetadata } from '../../interfaces';
import { Logger } from '../../logger';
import {
  createMethodDecorator,
  createParamDecorator as createParameterDecorator
} from '../generators';

const getMessageContent = (context: ExecutionContext) => {
  const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>();
  return message.content.replace(context.config.prefix, '').trim().split(/ +/g);
};

const getMessageProperty = <T extends Message[keyof Message]>(
  context: ExecutionContext,
  key: keyof Message
): T => {
  const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>();
  return message[key] as T;
};

export const HandleCommand = (command = 'default', ...aliases: string[]) =>
  createMethodDecorator(
    (context: ExecutionContext) => context,
    (target, propertyKey) => {
      let commands: ICommandHandlerMetadata[] =
        Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || [];
      commands = [...commands, { propertyKey, command, commandAliases: aliases }];
      Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor);
    }
  )();

export const DeleteMessage = (strategy?: 'send' | 'reply', responseMessage?: string) =>
  createMethodDecorator(async (context) => {
    const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>();
    const author = getMessageProperty<User>(context, 'author');

    const yuiMember = context.client.getGuildMemberByMessage(message);
    const yuiCanDelete = yuiMember.permissions.has(PermissionFlagsBits.ManageMessages);

    if (yuiCanDelete) {
      await message.delete().catch((error) => {
        Logger.error(error.stack);
      });
      if (strategy === 'reply') message.reply(responseMessage);
      else if (strategy === 'send') author.send(responseMessage);
    }

    return context;
  })();

export const Permissions = (...permissions: PermissionResolvable[]) =>
  createMethodDecorator((context) => {
    const [message] = context.getOriginalArguments<ClientEvents['messageCreate']>();
    const [author, member] = [
      getMessageProperty<User>(context, 'author'),
      getMessageProperty<GuildMember>(context, 'member')
    ];

    const yuiMember = context.client.getGuildMemberByMessage(message);

    const enoughPermissions = samePermissions(permissions, yuiMember, member);

    if (!enoughPermissions) {
      context.terminate();
      author
        .send(
          `<@${member?.user.id}>, you do not have permission to use this command in \`${message.guild.name}\`.`
        )
        .catch(null);
    }

    return context;
  })();

/**
 * @descrition Message
 */
export const Msg = createParameterDecorator((context) => context.getOriginalArguments()[0]);

/**
 * @descrition The command of this message
 */
export const MsgCmd = createParameterDecorator((context) => getMessageContent(context)[0]);

/**
 * @descrition Arguments for the command
 */
export const MsgArgs = createParameterDecorator((context) => getMessageContent(context).slice(1));

/**
 * @descrition Author of this message
 */
export const MsgAuthor = createParameterDecorator((context) =>
  getMessageProperty(context, 'author')
);

/**
 * @descrition Guild of this message
 */
export const MsgGuild = createParameterDecorator((context) => getMessageProperty(context, 'guild'));

/**
 * @descrition Channel of this message
 */
export const MsgChannel = createParameterDecorator((context) =>
  getMessageProperty(context, 'channel')
);
