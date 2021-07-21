import 'reflect-metadata'
import { isUndefined, isFunction } from './helper-functions'
import { GenericClassDecorator, Type, ModuleOption } from './interfaces/di-interfaces'
import {
  SELF_DECLARED_DEPS_METADATA,
  PROPERTY_DEPS_METADATA,
  INJECTABLE_METADATA,
  DESIGN_TYPE,
  InjectTokenName,
  MODULE_METADATA,
} from '@/ioc-container/constants/di-connstants'
import { YuiContainerFactory } from './container-factory'
import { decoratorLogger } from './log/logger'

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

export function YuiModule<T = any>(options: ModuleOption): GenericClassDecorator<Type<T>> {
  const propKeys = Object.keys(options)
  propKeys.map((key: string) => {
    if (key === 'entryComponent') return
    if (!options[key].length) return delete options[key]
    options[key].map((record) => {
      if (!record) throw new Error(`Cannot resolve ${record} of property ${key} in module metadata`)
    })
  })
  return function (target: Type<any>) {
    for (const property in options) {
      if (property === 'entryComponent') {
        if (YuiContainerFactory.entryDetected)
          throw new Error('Multiple entry detected: ' + target['name'])
        YuiContainerFactory.entryDetected = true
      }

      if (options.hasOwnProperty(property)) {
        Reflect.defineMetadata(MODULE_METADATA[property], options[property], target)
      }
    }
  }
}
