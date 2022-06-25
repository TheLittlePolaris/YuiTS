import { setParamDecoratorResolver } from '../../builder'
import { METHOD_PARAM_METADATA, METHOD_PARAMS_METADATA_INTERNAL } from '../../constants'
import { Prototype, ParamDecoratorResolver } from '../../interfaces'
import { paramKeyPrefix } from './constants'

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

export function createParamDecorator(method: ParamDecoratorResolver) {
  return () => wrappedParamDecorator(method)
}
