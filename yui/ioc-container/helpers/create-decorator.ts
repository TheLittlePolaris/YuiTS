import { YuiLogger } from '@/services/logger'
import { Prototype, Type } from '../interfaces'
import { CreateMethodDecoratorParam } from '../interfaces/decorator.interface'

type AppGetterType = <T = any>(instanceType: Type<T>) => InstanceType<Type<T>>

let _appGetter: AppGetterType

let _configRef = null
let _clientRef = null

export const _internalSetRefs =  (cfRef, clRef) => {
  _configRef = cfRef
  _clientRef = clRef
}

/**
 * 
 * @param method the method, should return the altered descriptor (or the original one) and argument list
 * @returns 
 */
export function createMethodDecorator(
  method: CreateMethodDecoratorParam
) {
  return () => (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
    const { value: originalDescriptor, ...descriptorOthers } = descriptor
    descriptor.value = function (...args: any[]) {
      
      const [desc, _args] = method([target, propertyKey, { ...descriptorOthers, value: originalDescriptor }], args, [_configRef, _clientRef])
      console.log(_args, '<========= _args [yui/ioc-container/helpers/create-decorator.ts:43]')
      
      return desc.apply(this, _args)
    }
  }
}
