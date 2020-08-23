/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ClientOptions, Client, Message } from 'discord.js'
import { MessageHandler } from '@/handlers/message.handler'
import { VoiceStateHandler } from '@/handlers/voice-state.handler'
import { TFunction, LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger, infoLogger } from '@/handlers/log.handler'
import { DiscordEvent } from '@/constants/discord-events'

export function Yui() {
  return <T extends TFunction>(superClass: T) => {
    decoratorLogger(superClass['name'], 'Class', 'Initiator')
    return class extends superClass {}
  }
}

// TODO:
export function On(event: DiscordEvent) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(`On - ${event}`, LOG_SCOPE.YUI_CORE, propertyKey)
    // return (descriptor.value = descriptor.value)
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      // console.log('RUN MESSAGE')
      return originalMethod.apply(this, args)
    }
  }
}
