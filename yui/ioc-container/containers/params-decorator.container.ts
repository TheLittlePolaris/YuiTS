import { isFunction } from 'lodash'
import { ExecutionContext } from '../event-execution-context'
import { ParamDecoratorResolver } from '../interfaces'

const _container: {
  [key: string]: ParamDecoratorResolver<any>
} = {}

export function setParamDecoratorResolver(key: string, valueResolver: ParamDecoratorResolver<any>) {
  _container[key] = valueResolver
}

export function getParamDecoratorResolver(key: string): ParamDecoratorResolver<any> {
  return _container[key]
}

export function getParamDecoratorResolverValue(key: string, context: ExecutionContext) {
  const resolver = getParamDecoratorResolver(key)
  return isFunction(resolver) ? resolver(context) : null
}
