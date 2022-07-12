import { getParamDecoratorResolverValue } from '../../builder'
import { METHOD_PARAMS_METADATA_INTERNAL } from '../../constants'
import { ExecutionContext } from '../../event-execution-context'
import { MethodDecoratorResolver, MethodDecoratorPresetter, Prototype } from '../../interfaces'
import { Logger } from '../../logger'
import { isEmpty, isFunction } from 'lodash'

async function compileContextArguments(context: ExecutionContext): Promise<void> {
  const paramResolverList: Record<string, number> =
    Reflect.getMetadata(
      METHOD_PARAMS_METADATA_INTERNAL,
      context.target.constructor,
      context.propertyKey
    ) || {}

  if (isEmpty(paramResolverList)) return

  const compiledArgs = context.getArguments()

  await Promise.all(
    Object.entries(paramResolverList).map(
      async ([key, index]) =>
        (compiledArgs[index] = await getParamDecoratorResolverValue(key, context))
    )
  ).catch((error) => Logger.error(error))

  context.setArguments(compiledArgs)
}

export function wrappedDecorator(
  method?: MethodDecoratorResolver,
  presetter?: MethodDecoratorPresetter
) {
  return (
    target: Prototype,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    if (isFunction(presetter)) presetter(target, propertyKey, descriptor)

    const originalDescriptor = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const context = new ExecutionContext(
        args,
        { target, propertyKey, descriptor },
        originalDescriptor.bind(this)
      )

      if (method) await method(context)

      if (context.terminated) return

      await compileContextArguments(context)

      return context.call()
    }
  }
}

/**
 *
 * @param method The method to perform at run time, on every execution of this method
 * @param presetter the method to perform at build time, run only once (mostly used for emitting custom metadata)
 * @returns
 */
export function createMethodDecorator(
  method: MethodDecoratorResolver,
  presetter?: MethodDecoratorPresetter
) {
  return () => wrappedDecorator(method, presetter)
}
