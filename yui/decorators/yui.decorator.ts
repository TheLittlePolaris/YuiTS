/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TFunction, LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { DiscordEvent } from '@/constants/discord-events'
import { INJECTABLE_METADATA } from '@/constants/di-connstants'

export function Yui() {
  return <T extends TFunction>(target: T) => {
    decoratorLogger(target['name'], 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

// TODO:
export const On = (event: DiscordEvent) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(`On - ${event}`, LOG_SCOPE.YUI_CORE, propertyKey)
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args)
    }
  }
}
