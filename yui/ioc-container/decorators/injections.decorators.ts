import 'reflect-metadata'

import {
  DESIGN_TYPE,
  INJECTABLE_METADATA,
  InjectToken,
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '../constants'
import { isFunction, isUndefined } from '../helpers'
import { GenericClassDecorator, Type } from '../interfaces'

// NestJS Inject function, edited
export const Inject = (token: InjectToken) => {
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
  }
}

