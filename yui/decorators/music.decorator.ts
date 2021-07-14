import { Message, TextChannel } from 'discord.js'
import {
  INJECTABLE_METADATA,
  METHOD_PARAM_METADATA,
} from '@/dep-injection-ioc/constants/di-connstants'
import {
  Type,
  GenericClassDecorator,
  Prototype,
} from '../dep-injection-ioc/interfaces/di-interfaces'
import { decoratorLogger } from '@/dep-injection-ioc/log/logger'
import { YuiLogger } from '@/log/logger.service'
import { MusicService } from '@/handlers/services/music/music.service'

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
    decoratorLogger(target.constructor.name, 'AccessController', propertyKey)
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
      const paramIndexes = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey)
      if (paramIndexes != null) {
        const streamParamIndex: number | undefined = paramIndexes[MUSIC_PARAM.STREAM]
        if (streamParamIndex != null) filteredArgs[streamParamIndex] = stream
        const clientUserIndex: number = paramIndexes[MUSIC_PARAM.CLIENT]
        if (clientUserIndex != null) {
          const client = await message.guild.members
            .fetch(this.configService.yuiId)
            .catch((err) => handleError(err))
          filteredArgs[clientUserIndex] = client
        }
      }

      const boundVoiceChannel = stream?.boundVoiceChannel
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
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = { [MUSIC_PARAM[key]]: paramIndex, ...definedParams }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}

function handleError(error: string | Error) {
  return YuiLogger.error(error)
}
