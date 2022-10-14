import {
  Collection,
  GuildMember,
  Message,
  MessageEditOptions,
  MessagePayload,
  TextBasedChannel,
  MessageCreateOptions
} from 'discord.js';

import { YuiLogger } from '@/logger/logger.service';

export const sendChannelMessage = async (
  message: Message,
  content: string | MessagePayload | MessageCreateOptions
) => {
  try {
    return await message.channel.send(content);
  } catch (error: any) {
    error.content = content;
    YuiLogger.error(error?.stack || error, 'SendMessageToChannel_message');
  }
};

export const sendMessageToChannel = async (
  channel: TextBasedChannel,
  content: string | MessagePayload | MessageCreateOptions
) => {
  try {
    return await channel.send(content);
  } catch (error: any) {
    error.content = content;
    YuiLogger.error(error?.stack || error, 'SendMessageToChannel_channel');
  }
};

export const sendDMMessage = async (
  message: Message,
  content: string | MessagePayload | MessageCreateOptions
) => {
  try {
    return await message.author.send(content);
  } catch (error: any) {
    error.content = content;
    YuiLogger.error(error?.stack || error, 'SendMessageToUser');
  }
};

export const replyMessage = async (
  message: Message,
  content: string | MessagePayload | MessageCreateOptions
) => {
  try {
    return await message.reply(content);
  } catch (error: any) {
    error.content = content;
    YuiLogger.error(error, 'ReplyMessage');
  }
};

export const editMessage = async (
  message: Message,
  content: string | MessagePayload | MessageEditOptions
) => {
  try {
    return await message.edit(content);
  } catch (error: any) {
    error.content = content;
    YuiLogger.error(error, 'ReplyMessage');
  }
};

export const deleteMessage = async (message: Message) => {
  try {
    return await message.delete();
  } catch (error) {
    YuiLogger.error(error?.stack || error, 'SendMessageToUser');
  }
};

export const getMentionString = (guildMembers: GuildMember[] | Collection<string, GuildMember>) => {
  const mentions = (guildMembers as GuildMember[]).map((u) => u.toString()) as string[];
  return mentions.length === 0
    ? ''
    : mentions.length === 1
    ? mentions[0]
    : `${mentions[0]}${mentions.slice(1, -1).join(', ')} and ${mentions[mentions.length]}`;
};

export const getVoiceChannel = (message: Message) => message.member?.voice?.channel;
