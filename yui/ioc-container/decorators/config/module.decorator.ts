import { getPropertyKey, ModuleMetadata } from '../../constants'
import { RecursiveContainerFactory } from '../../builder/container-factory'
import { GenericClassDecorator, ModuleOption, Type } from '../../interfaces'

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
        if (RecursiveContainerFactory.entryDetected) throw new Error('Multiple entry detected: ' + target['name'])
        RecursiveContainerFactory.entryDetected = true
      }

      if (options.hasOwnProperty(property)) {
        Reflect.defineMetadata(getPropertyKey(property as ModuleMetadata), options[property], target)
      }
    }
  }
}
