import { isFunction } from 'lodash'
import { METHOD_PARAMS_METADATA_INTERNAL, METHOD_PARAM_METADATA } from '../constants'
import { getParamDecoratorResolverValue, setParamDecoratorResolver } from '../containers/params-decorator.container'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Prototype } from '../interfaces'
import {
  MethodDecoratorPresetter,
  MethodDecoratorResolver,
  ParamDecoratorResolver
} from '../interfaces/decorator.interface'
import { Logger } from '../logger'
import { paramKeyPrefix } from './constants'

export function wrappedDecorator(method?: MethodDecoratorResolver, presetter?: MethodDecoratorPresetter) {
  return (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    if (isFunction(presetter)) presetter(target, propertyKey, descriptor)

    const originalDescriptor = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const context = new ExecutionContext(args, { target, propertyKey, descriptor }, originalDescriptor.bind(this))

      if (method) await method(context)

      const paramResolverList: Record<string, number> =
        Reflect.getMetadata(METHOD_PARAMS_METADATA_INTERNAL, target.constructor, propertyKey) || []

      if (!paramResolverList?.length) return context.call()

      const compiledArgs = context.getArguments()

      await Promise.all(
        Object.entries(paramResolverList).map(
          async ([key, index]) => (compiledArgs[index] = await getParamDecoratorResolverValue(key, context))
        )
      ).catch(Logger.error)

      context.setArguments(compiledArgs)

      return context.call()
    }
  }
}

export function constructParamKey(target: Prototype, propertyKey: string, paramIndex: number) {
  return `${paramKeyPrefix}::${target.constructor.name}::${propertyKey}::${paramIndex}`
}

export function wrappedParamDecorator(method: ParamDecoratorResolver) {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    // TODO: remove after done migrating
    const definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target.constructor, propertyKey) || []

    const definedParams_internal =
      Reflect.getMetadata(METHOD_PARAMS_METADATA_INTERNAL, target.constructor, propertyKey) || []

    const paramKey = constructParamKey(target, propertyKey, paramIndex)
    setParamDecoratorResolver(paramKey, method)

    // TODO: remove after done migrating
    Reflect.defineMetadata(
      METHOD_PARAM_METADATA,
      {
        [paramKey]: paramIndex,
        ...definedParams
      },
      target.constructor,
      propertyKey
    )

    Reflect.defineMetadata(
      METHOD_PARAMS_METADATA_INTERNAL,
      {
        [paramKey]: paramIndex,
        ...definedParams_internal
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
