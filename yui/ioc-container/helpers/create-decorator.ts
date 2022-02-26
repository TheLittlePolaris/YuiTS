import { ConfigService } from '@/config-service/config.service'
import { YuiLogger } from '@/services/logger'
import { DiscordClient } from '..'
import { Prototype, Type } from '../interfaces'
import { CreateMethodDecoratorParam } from '../interfaces/decorator.interface'

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

/**
 *
 * @param method the method, should return the altered descriptor (or the original one) and argument list
 * @returns
 */
export function createMethodDecorator(method: CreateMethodDecoratorParam) {
  return () =>
    (target: Prototype, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
      const { value: originalDescriptor, ...descriptorOthers } = descriptor
      descriptor.value = async function (...args: any[]) {
        const [desc, _args] = await method(
          [target, propertyKey, { ...descriptorOthers, value: originalDescriptor }],
          args,
          [_configRef, _clientRef]
        )
        if(!desc) return
        return desc.apply(this, _args)
      }
    }
}
