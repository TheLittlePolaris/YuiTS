import { YuiLogger } from '@/services/logger'
import { Collection, Guild, GuildMember, Message, MessageOptions, MessagePayload } from 'discord.js'

export const sendChannelMessage = async (message: Message, content: string | MessagePayload | MessageOptions) => {
  try {
    return await message.channel.send(content)
  } catch (error) {
    YuiLogger.error(error?.['stack'] || error, 'SendMessageToChannel')
  }
}

export const sendDMMessage = async (message: Message, content: string | MessagePayload | MessageOptions) => {
  try {
    return await message.author.send(content)
  } catch (error) {
    YuiLogger.error(error?.['stack'] || error, 'SendMessageToUser')
  }
}

export const deleteMessage = async (message: Message) => {
  try {
    return await message.delete()
  } catch (error) {
    YuiLogger.error(error?.['stack'] || error, 'SendMessageToUser')
  }
}

export const getMentionString = (guildMembers: GuildMember[] | Collection<string, GuildMember>) => {
  const mentions = (guildMembers as GuildMember[]).map((u) => u.toString()) as string[]
  return mentions.length === 0
    ? ''
    : mentions.length === 1
    ? mentions[0]
    : `${mentions[0]}${mentions.slice(1, -1).join(', ')} and ${mentions[mentions.length]}`
}
