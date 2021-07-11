import { INJECTABLE_METADATA } from '@/dep-injection-ioc/constants/di-connstants'
import { Type, GenericClassDecorator } from '../dep-injection-ioc/interfaces/di-interfaces'
import { decoratorLogger } from '@/dep-injection-ioc/log/logger'

export function MessageHandlerInitiator<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<T>) => {
    decoratorLogger(target.name, 'Class')
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
  }
}
