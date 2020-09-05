import { decoratorLogger } from '@/handlers/log.handler'
import { INJECTABLE_METADATA } from '@/dep-injection-ioc/constants/di-connstants'
import { GenericClassDecorator, Type } from '../dep-injection-ioc/interfaces/di-interfaces'

export function VoiceStateInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<T>) => {
    decoratorLogger(target.name, 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}
