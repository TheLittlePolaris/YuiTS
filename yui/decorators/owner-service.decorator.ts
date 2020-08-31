import { decoratorLogger } from '@/handlers/log.handler'
import { INJECTABLE_METADATA } from '@/decorators/dep-injection-ioc/constants/di-connstants'
import { Type, GenericClassDecorator } from './dep-injection-ioc/interfaces/di-interfaces'

export function OwnerServiceInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return function (target: Type<T>) {
    decoratorLogger(target['name'], 'Class', 'Initiator')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}
