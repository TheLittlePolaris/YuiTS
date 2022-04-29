import { Prototype, Type } from '../interfaces'
import { CreateMethodDecoratorParameters } from '../interfaces/decorator.interface'
const ORIGINAL_ARGS_KEY = 'originalArgs'

type AppGetterType = <T = any>(instanceType: Type<T>) => InstanceType<Type<T>>

let _appGetter: AppGetterType
export const _internalSetGetter = (getter: AppGetterType) => {
  _appGetter = getter
}

let _configRef = null
let _clientRef = null

export const _internalSetRefs = (cfRef, clRef) => {
  _configRef = cfRef
  _clientRef = clRef
}

const isCurrentMethod = (descriptorValue: Function) => {
  return !!descriptorValue?.name
}

/**
 *
 * TODO: push the method to stack
 * if (method name  === propertyKey) => it is the last decorator in the stack, just before the method
 * inside method decorator, evaluation order => in side out (closest first), so each time, push to the top of the stack
 * executing the stack way, FILO
 * for each execution, pass in the EventExecutionContext (EEC)
 * mutate the handler and arguments using EEC's public method
 * finally execute the EEC using public mmethod call()
 * @returns
 */
export function createDecorator(method: CreateMethodDecoratorParameters) {
  return (
    target: Prototype,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const { value: originalDescriptor, ...descriptorOthers } = descriptor
    descriptor.value = async function (...args: any[]) {
      let originalArgs = null
      if (!descriptor.hasOwnProperty(ORIGINAL_ARGS_KEY)) {
        originalArgs = [...args]
        Object.defineProperty(descriptor.value, 'originalArgs', originalArgs)
      } else {
        originalArgs = descriptor.value[ORIGINAL_ARGS_KEY]
      }

      const [desc, _args] = await method(
        [target, propertyKey, { ...descriptorOthers, value: originalDescriptor }],
        args,
        [_configRef, _clientRef, originalArgs]
      )

      if (!desc) return
      return desc.apply(this, _args)
    }
  }
}

/**
 *
 * @param method the method, should return the altered descriptor (or the original one) and argument list
 * @returns
 */
export function createMethodDecorator(method: CreateMethodDecoratorParameters) {
  return () => createDecorator(method)
}
