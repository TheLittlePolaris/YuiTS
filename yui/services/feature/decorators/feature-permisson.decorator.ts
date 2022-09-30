import {
  createMethodDecorator,
  createParamDecorator,
  ExecutionContext,
  hasPermissions
} from 'djs-ioc-container';
import { Message, PermissionFlagsBits, PermissionResolvable } from 'discord.js';

import { messageMentionRegexp } from '@/constants';

export enum FEATURE_PROPERTY_PARAMS {
  GUILD_MEMBER = 'guildMember',
  MENTIONS = 'mentions',
  ACTION = 'actions',
  REQUEST_PARAM = 'requestParam'
}

export type FEATURE_PARAM_NAME = Record<FEATURE_PROPERTY_PARAMS, string>;
export type FEATURE_PARAM_KEY = keyof typeof FEATURE_PROPERTY_PARAMS;

export const Feature = createMethodDecorator(async (context: ExecutionContext) => {
  const [message] = context.getOriginalArguments();
  const discordClient = context.client;

  const requiredPermissions: PermissionResolvable[] = [PermissionFlagsBits.SendMessages];
  const [yuiMember, actionMember] = [
    context.client.getGuildMemberByMessage(message),
    message.member
  ];
  const [yuiPermission, memberPermission, isOwner] = [
    hasPermissions(yuiMember, [...requiredPermissions, PermissionFlagsBits.ManageMessages], true),
    hasPermissions(actionMember, requiredPermissions, true),
    actionMember.user.id === discordClient.user.id
  ];
  if (!(yuiPermission && (memberPermission || isOwner))) context.terminate();

  return context;
});

export const GuildMem = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message]>();
  return message.member;
});

export const Mentions = createParamDecorator((context) => {
  const [message] = context.getOriginalArguments<[Message]>();
  return message.mentions.members;
});

const getAction = (context: ExecutionContext) => {
  const [message, inputArguments] = context.getOriginalArguments<[Message, string[]]>();
  const mentioned = message.mentions.members;
  if (!mentioned.size) return inputArguments;

  const userAction = inputArguments.filter((argument) => !messageMentionRegexp.test(argument));
  return userAction;
};

export const Action = createParamDecorator((context) => getAction(context)[0]);

export const ActionParam = createParamDecorator((context) => getAction(context).slice(1).join(' '));
