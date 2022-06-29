import { Message } from 'discord.js'
import { METHOD_PARAM_METADATA } from '@/ioc-container/constants/dependencies-injection.constant'
import { Prototype } from '../../ioc-container/interfaces/dependencies-injection.interfaces'
import { YuiLogger } from '@/services/logger/logger.service'
import { MusicService } from '@/services/app-services/music/music.service'
import { replyMessage } from '@/services/app-services/utilities'

enum MUSIC_PARAM {
  CLIENT = 'client',
  STREAM = 'stream'
}

export type MUSIC_PARAM_NAME = Record<MUSIC_PARAM, string>
export type MUSIC_PARAM_KEY = keyof typeof MUSIC_PARAM

export function AccessController(
  { join }: { join?: boolean } = {
    join: false
  }
) {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    descriptor.value = async function (this: MusicService, message: Message, ...args: any[]) {
      const filteredArgs = <any[]>[message, ...args]
      const { channel, guild, member } = message

      const {
        voice: { channel: voiceChannel }
      } = member || {}
      if (!voiceChannel) {
        return replyMessage(message, '**please join a __`Voice Channel`__!**')
      }

      if (!this.streams) return

      const stream = this.streams.get(guild.id) || null
      const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || {}

      const streamParamIndex: number | undefined = paramIndexes[MUSIC_PARAM.STREAM]
      if (streamParamIndex) filteredArgs[streamParamIndex] = stream

      const clientUserIndex: number = paramIndexes[MUSIC_PARAM.CLIENT]
      if (clientUserIndex) {
        const client = this.yui.getGuildMember(message)
        filteredArgs[clientUserIndex] = client
      }

      const { boundVoiceChannel } = stream || {}
      if (!boundVoiceChannel && join) {
        return originalMethod.apply(this, filteredArgs)
      }

      if (boundVoiceChannel) {
        const boundTextChannel = stream.boundTextChannel
        if (channel.id !== boundTextChannel.id || voiceChannel.id !== boundVoiceChannel.id) {
          return replyMessage(
            message,
            `**I'm playing at \`${boundTextChannel.name}\` -- \` ${boundVoiceChannel.name}\`**`
          )
        } else {
          return originalMethod.apply(this, filteredArgs)
        }
      } else {
        return replyMessage(message, `**I'm not in any voice channel.**`)
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
