import type { TFunction } from '@/constants/constants'
import type { MusicStream } from '@/handlers/services/music/music-entities/music-stream'
import { Message, TextChannel } from 'discord.js'


enum REFLECT_SYMBOL_KEY {
  STREAM = 'STREAM'
}

const REFLECT_KEY = {
  STREAM_KEY: Symbol(REFLECT_SYMBOL_KEY.STREAM)
}

class AccessControllerStreams {
  public static streams: Map<string, MusicStream>
  constructor() {}
}

export const MusicServiceInitiator = () => {
  console.log('======= [ MUSIC SERVICE DECORATOR ] =======')
  return <T extends TFunction>(superClass: T) => {
    AccessControllerStreams.streams = new Map<string, MusicStream>()
    return class extends superClass {
      _streams = AccessControllerStreams.streams
    }
  }
}

export const AccessController = (
  { join, silent }: { join?: boolean; silent?: boolean } = {
    join: false,
    silent: false
  }
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    console.log(
      `===== [ ACCESS CONTROLLER - Override: ${propertyKey} ] =====`
    )
    const originalMethod = descriptor.value!
    descriptor.value = function(...args: any[]) {
      const streams = AccessControllerStreams.streams
      const [message] = args
      const {
        channel,
        guild,
        member: { voiceChannel }
      } = message as Message

      if (!voiceChannel) {
        message.reply('**please join a `__Voice Channel__`!**')
        return
      }

      if (!streams) return
      const stream = streams.has(guild.id) ? streams.get(guild.id) : null
      // console.log(stream, ' <====== FOUND STREAMMMMMMMMM')

      const streamParamIndex: number = Reflect.getMetadata(REFLECT_KEY.STREAM_KEY, target, propertyKey);
      if(streamParamIndex) args[streamParamIndex] = stream

      const boundVoiceChannel = stream?.boundVoiceChannel
      // console.log(args, ' <===== args')
      if (!boundVoiceChannel && join) {
        if (!silent) {
          message.channel.send(
            `**Bound to Text Channel: \`${
              (channel as TextChannel).name
            }\` and Voice Channel: \`${voiceChannel?.name}\`**!`
          )
        }
        return originalMethod.apply(this, args)
      }
      if (boundVoiceChannel) {
        const boundTextChannel = stream.boundTextChannel
        if (
          channel.id !== boundTextChannel.id ||
          voiceChannel.id !== boundVoiceChannel.id
        ) {
          message.reply(
            `**I'm playing at \`${boundTextChannel.name}\` -- \` ${boundVoiceChannel.name}\`**`
          )
        } else {
          // final condition => All pass
          return originalMethod.apply(this, args)
        }
      } else {
        message.reply(`**\`I'm not in any voice channel.\`**`)
        return
      }
      return originalMethod.apply(this, args) // just in case
    }
  }
}

export const GuildStream = () => {
  return (target: any, propertyKey: string, paramIndex: number) => {
    Reflect.defineMetadata(REFLECT_KEY.STREAM_KEY, paramIndex, target, propertyKey)
  }
}

export const configurable = (value: boolean) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.configurable = value
    return descriptor
  }
}
