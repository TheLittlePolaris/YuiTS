import { METHOD_PARAM_METADATA } from '../constants'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Prototype } from '../interfaces'
import { MethodDecoratorResolver, ParamDecoratorResolver } from '../interfaces/decorator.interface'

export function createDecorator(method: MethodDecoratorResolver) {
  return (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    const originalDescriptor = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const context = new ExecutionContext(
        args as any,
        { target, propertyKey, descriptor },
        originalDescriptor.bind(this)
      )

      await method(context)

      return context.call()
    }
  }
}

export function createParamDecorator(method: ParamDecoratorResolver) {
  return (target: Prototype, propertyKey: string, paramIndex: number) => {
    let definedParams = Reflect.getMetadata(METHOD_PARAM_METADATA, target, propertyKey) || []
    definedParams = {
      [`_params.${target.constructor.name}.${propertyKey}.${paramIndex}`]: paramIndex,
      ...definedParams
    }
    Reflect.defineMetadata(METHOD_PARAM_METADATA, definedParams, target, propertyKey)
  }
}

/**
 *
 * @param method the method, should return the altered descriptor (or the original one) and argument list
 * @returns
 */
export function createMethodDecorator(method: MethodDecoratorResolver) {
  return () => createDecorator(method)
}
