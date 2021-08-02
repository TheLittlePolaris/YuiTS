import 'reflect-metadata'
import { isUndefined, isFunction } from '../helpers/helper-functions'
import { GenericClassDecorator, Type } from '../interfaces/di-interfaces'
import {
  SELF_DECLARED_DEPS_METADATA,
  PROPERTY_DEPS_METADATA,
  INJECTABLE_METADATA,
  DESIGN_TYPE,
  InjectTokenName,

} from '@/ioc-container/constants/di-connstants'


// NestJS Inject function, edited
export const Inject = (token: InjectTokenName) => {
  return (target: object, key: string | symbol, index?: number) => {
    token = token || Reflect.getMetadata(DESIGN_TYPE, target, key)
    const type = token && isFunction(token) ? (token as any as Function).name : token

    if (!isUndefined(index)) {
      let dependencies = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) || []
      dependencies = { ...dependencies, [index]: type }
      Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, dependencies, target)
      return
    }

    let properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, target) || []
    properties = { ...properties, [key]: type }
    Reflect.defineMetadata(PROPERTY_DEPS_METADATA, properties, target)
  }
}

export function Injectable<T = any>(): GenericClassDecorator<Type<T>> {
  return (target: Type<any>) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target)
    // decoratorLogger(target.name, 'Class')
  }
}