import { LOG_SCOPE } from '@/constants/constants'
import { decoratorLogger } from '@/handlers/log.handler'
import { DiscordEvent } from '@/constants/discord-events'
import { INJECTABLE_METADATA } from '@/decorators/dep-injection-ioc/constants/di-connstants'
import { Type, GenericClassDecorator } from './dep-injection-ioc/interfaces/di-interfaces'

export function Yui<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<T>) => {
    decoratorLogger(target['name'], 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}

// TODO: Event emitter
export const On = (event: DiscordEvent) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decoratorLogger(`On - ${event}`, LOG_SCOPE.YUI_CORE, propertyKey)
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args)
    }
  }
}
