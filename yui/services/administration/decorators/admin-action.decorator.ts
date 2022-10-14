import { Message } from 'discord.js';
import { createMethodDecorator, ExecutionContext, createParamDecorator } from '@tlp01/djs-ioc-container';

import { messageMentionRegexp, messageMentionRoleRegex } from '@/constants';

export const AdminAction = createMethodDecorator((context: ExecutionContext) => context);

export const Targets = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message]>();
  return message.mentions.members;
});

export const CmdExecutor = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message]>();
  return message.member;
});

export const Reason = createParamDecorator((context) => {
  const [_, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  return inputArguments
    .filter(
      (argument) => !(messageMentionRegexp.test(argument) || messageMentionRoleRegex.test(argument))
    )
    .join(' ');
});

export const SubCommand = createParamDecorator((context) => context.propertyKey);

export const MentionedRoles = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message, string[]]>();
  return message.mentions.roles;
});

export const Nickname = createParamDecorator((context) => {
  const [_, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  return inputArguments
    .filter(
      (argument) => !(messageMentionRegexp.test(argument) && messageMentionRoleRegex.test(argument))
    )
    .join(' ');
});
