/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TFunction, LOG_SCOPE } from '@/constants/constants'
import { Message, TextChannel } from 'discord.js'
import { decoratorLogger } from '@/handlers/log.handler'
import { INJECTABLE_METADATA } from '@/constants/di-connstants'
import { GlobalMusicStream } from '@/handlers/services/music/global-streams'

enum REFLECT_MUSIC_SYMBOLS {
  STREAM = 'STREAM',
  CLIENT = 'CLIENT',
}

const REFLECT_MUSIC_KEYS = {
  STREAM_KEY: Symbol(REFLECT_MUSIC_SYMBOLS.STREAM),
  CLIENT_KEY: Symbol(REFLECT_MUSIC_SYMBOLS.CLIENT),
}

export const MusicServiceInitiator = () => {
  return <T extends TFunction>(target: T) => {
    decoratorLogger(target['name'], 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

export function AccessController(
  { join, silent }: { join?: boolean; silent?: boolean } = {
    join: false,
    silent: false,
  }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(LOG_SCOPE.MUSIC_SERVICE, 'AccessController - Method', propertyKey)
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const streams = GlobalMusicStream.streams
      console.log(streams)
      const [message] = args as [Message]
      const { channel, guild, member } = message as Message

      const voiceChannel = member.voice.channel

      if (!voiceChannel) {
        message.reply('**please join a __`Voice Channel`__!**')
        return
      }

      if (!streams) return
      const stream = streams.has(guild.id) ? streams.get(guild.id) : null
      console.log(stream)

      const streamParamIndex: number = Reflect.getMetadata(REFLECT_MUSIC_KEYS.STREAM_KEY, target, propertyKey)
      if (streamParamIndex !== undefined) args[streamParamIndex] = stream

      const clientUserIndex: number = Reflect.getMetadata(REFLECT_MUSIC_KEYS.CLIENT_KEY, target, propertyKey)
      if (clientUserIndex !== undefined) {
        const client = await message.guild.members.fetch(global.config.yuiId)
        args[clientUserIndex] = client
      }

      const boundVoiceChannel = stream?.boundVoiceChannel
      if (!boundVoiceChannel && join) {
        if (!silent) {
          message.channel.send(
            `**Bound to Text Channel: \`${(channel as TextChannel).name}\` and Voice Channel: \`${
              voiceChannel?.name
            }\`**!`
          )
        }
        return originalMethod.apply(this, args)
      }
      if (boundVoiceChannel) {
        const boundTextChannel = stream.boundTextChannel
        if (channel.id !== boundTextChannel.id || voiceChannel.id !== boundVoiceChannel.id) {
          message.reply(`**I'm playing at \`${boundTextChannel.name}\` -- \` ${boundVoiceChannel.name}\`**`)

          return
        } else {
          // final condition => All pass
          return originalMethod.apply(this, args)
        }
      } else {
        message.reply(`**\`I'm not in any voice channel.\`**`)
        return
      }
    }
  }
}

export const GuildStream = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_MUSIC_KEYS.STREAM_KEY, paramIndex, target, propertyKey)
  }
}

export const CurrentGuildMember = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_MUSIC_KEYS.CLIENT_KEY, paramIndex, target, propertyKey)
  }
}

export const configurable = (value: boolean) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.configurable = value
    return descriptor
  }
}
