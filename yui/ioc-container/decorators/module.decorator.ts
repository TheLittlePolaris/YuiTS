import { MODULE_METADATA } from "../constants/di-connstants"
import { ContainerFactory } from "../container-factory"
import { GenericClassDecorator, ModuleOption, Type } from "../interfaces/di-interfaces"



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
        if (ContainerFactory.entryDetected)
          throw new Error('Multiple entry detected: ' + target['name'])
        ContainerFactory.entryDetected = true
      }

      if (options.hasOwnProperty(property)) {
        Reflect.defineMetadata(MODULE_METADATA[property], options[property], target)
      }
    }
  }
}
