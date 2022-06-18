import { getParamDecoratorResolverValue } from '../../builder'
import { METHOD_PARAMS_METADATA_INTERNAL } from '../../constants'
import { ExecutionContext } from '../../event-execution-context'
import { MethodDecoratorResolver, MethodDecoratorPresetter, Prototype } from '../../interfaces'
import { Logger } from '../../logger'
import { isEmpty, isFunction } from 'lodash'

export function wrappedDecorator(method?: MethodDecoratorResolver, presetter?: MethodDecoratorPresetter) {
  return (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    if (isFunction(presetter)) presetter(target, propertyKey, descriptor)

    const originalDescriptor = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const context = new ExecutionContext(args, { target, propertyKey, descriptor }, originalDescriptor.bind(this))

      if (method) await method(context)

      const paramResolverList: Record<string, number> =
        Reflect.getMetadata(METHOD_PARAMS_METADATA_INTERNAL, target.constructor, propertyKey) || {}

      if (isEmpty(paramResolverList)) return context.call()

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

export function createMethodDecorator(method: MethodDecoratorResolver, presetter?: MethodDecoratorPresetter) {
  return () => wrappedDecorator(method, presetter)
}

