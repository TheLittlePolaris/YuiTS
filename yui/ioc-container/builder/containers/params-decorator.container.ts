import { isFunction } from 'lodash';

import { ExecutionContext } from '../../event-execution-context';
import { ParamDecoratorResolver as ParameterDecoratorResolver } from '../../interfaces';

const _container: {
  [key: string]: ParameterDecoratorResolver<any>;
} = {};

export function setParamDecoratorResolver(
  key: string,
  valueResolver: ParameterDecoratorResolver<any>
) {
  _container[key] = valueResolver;
}

export function getParamDecoratorResolver(key: string): ParameterDecoratorResolver<any> {
  return _container[key];
}

export async function getParamDecoratorResolverValue(key: string, context: ExecutionContext) {
  const resolver = getParamDecoratorResolver(key);
  return isFunction(resolver) ? resolver(context) : null;
}
