import { isFunction } from 'lodash'
import { METHOD_PARAM_METADATA } from '../constants'
import { setParamDecoratorResolver } from '../containers/params-decorator.container'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Prototype } from '../interfaces'
import {
  MethodDecoratorPresetter,
  MethodDecoratorResolver,
  ParamDecoratorResolver
} from '../interfaces/decorator.interface'
import { paramKeyPrefix } from './constants'

export function wrappedDecorator(method: MethodDecoratorResolver, presetter?: MethodDecoratorPresetter) {
  return (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    if (isFunction(presetter)) presetter(target, propertyKey, descriptor)

    const originalDescriptor = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const context = new ExecutionContext(args, { target, propertyKey, descriptor }, originalDescriptor.bind(this))

      await method(context)

      return context.call()
    }
  }
}

export function constructParamKey(target: Prototype, propertyKey: string, paramIndex: number) {
  return `${paramKeyPrefix}::${target.constructor.name}::${propertyKey}::${paramIndex}`
}

export function wrappedParamDecorator(method: ParamDecoratorResolver) {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    const definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target.constructor, propertyKey) || []

    const paramKey = constructParamKey(target, propertyKey, paramIndex)
    setParamDecoratorResolver(paramKey, method)

    Reflect.defineMetadata(
      METHOD_PARAM_METADATA,
      {
        [paramKey]: paramIndex,
        ...definedParams
      },
      target.constructor,
      propertyKey
    )
  }
}

/**
 *
 * @param method the method, should return the altered descriptor (or the original one) and argument list
 * @returns
 */
export function createMethodDecorator(method: MethodDecoratorResolver, presetter?: MethodDecoratorPresetter) {
  return () => wrappedDecorator(method, presetter)
}

export function createParamDecorator(method: ParamDecoratorResolver) {
  return () => wrappedParamDecorator(method)
}
