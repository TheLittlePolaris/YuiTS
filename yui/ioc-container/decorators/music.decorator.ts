import { Message, TextChannel } from 'discord.js'
import { METHOD_PARAM_METADATA } from '@/ioc-container/constants/di-connstants'
import { Prototype } from '../interfaces/di-interfaces'
import { decoratorLogger } from '@/ioc-container/log/logger'
import { YuiLogger } from '@/log/logger.service'
import { MusicService } from '@/services/app-services/music/music.service'

enum MUSIC_PARAM {
  CLIENT = 'client',
  STREAM = 'stream',
}

export type MUSIC_PARAM_NAME = Record<MUSIC_PARAM, string>
export type MUSIC_PARAM_KEY = keyof typeof MUSIC_PARAM

export function AccessController(
  { join, silent }: { join?: boolean; silent?: boolean } = {
    join: false,
    silent: false,
  }
) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    // decoratorLogger(target.constructor.name, 'AccessController', propertyKey)
    const originalMethod = descriptor.value
    descriptor.value = async function (this: MusicService, message: Message, ...args: any[]) {
      const filteredArgs = <any[]>[message, ...args]
      const { channel, guild, member } = message

      const voiceChannel = member.voice.channel

      if (!voiceChannel) {
        return this.replyMessage(message, '**please join a __`Voice Channel`__!**').catch(null)
      }

      if (!this.streams) return

      const stream = this.streams.has(guild.id) ? this.streams.get(guild.id) : null
      const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}

      const streamParamIndex: number | undefined = paramIndexes[MUSIC_PARAM.STREAM]
      if (streamParamIndex) filteredArgs[streamParamIndex] = stream

      const clientUserIndex: number = paramIndexes[MUSIC_PARAM.CLIENT]
      if (clientUserIndex) {
        const client = await message.guild.members.fetch(this.configService.yuiId)
        filteredArgs[clientUserIndex] = client
      }

      const { boundVoiceChannel } = stream || {}
      if (!boundVoiceChannel && join) {
        if (!silent) {
          this.sendMessage(
            message,
            `**Bound to Text Channel: \`${(channel as TextChannel).name}\` and Voice Channel: \`${
              voiceChannel?.name
            }\`**!`
          )
        }
        return originalMethod.apply(this, filteredArgs)
      }

      if (boundVoiceChannel) {
        const boundTextChannel = stream.boundTextChannel
        if (channel.id !== boundTextChannel.id || voiceChannel.id !== boundVoiceChannel.id) {
          return this.replyMessage(
            message,
            `**I'm playing at \`${boundTextChannel.name}\` -- \` ${boundVoiceChannel.name}\`**`
          )
        } else {
          return originalMethod.apply(this, filteredArgs)
        }
      } else {
        return this.replyMessage(message, `**\`I'm not in any voice channel.\`**`)
      }
    }
  }
}

export const MusicParam = (key: MUSIC_PARAM_KEY) => {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}
    definedParams = { [MUSIC_PARAM[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}

function handleError(error: string | Error) {
  return YuiLogger.error(error)
}
