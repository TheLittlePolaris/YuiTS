import { ClientOptions, Client, Message } from 'discord.js'
import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { TFunction, LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger, infoLogger } from '@/handlers/log.handler'
import { DiscordEvent } from '@/constants/discord-events'

export const Yui = ({
  prefix,
  token,
  options,
}: {
  prefix: string
  token: string
  options: ClientOptions
}) => {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {
      prefix = prefix
      token = token
      yui = new Client(options)
      messageHandler = new MessageHandler()
      voiceStateHandler = new VoiceStateHandler(
        this.messageHandler?.musicService || null
      )
    }
  }
}

//TODO:
export const On = (event: DiscordEvent) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): void => {
    decoratorLogger(`On - ${event}`, LOG_SCOPE.YUI_CORE, propertyKey)
    // return (descriptor.value = descriptor.value)
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      // console.log('RUN MESSAGE')
      return originalMethod.apply(this, args)
    }
  }
}
