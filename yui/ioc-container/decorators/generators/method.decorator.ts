import { isEmpty, isFunction } from 'lodash';

import { getParamDecoratorResolverValue as getParameterDecoratorResolverValue } from '../../builder';
import { METHOD_PARAMS_METADATA_INTERNAL } from '../../constants';
import { ExecutionContext } from '../../event-execution-context';
import {
  MethodDecoratorResolver,
  MethodDecoratorPresetter,
  Prototype,
  FunctionType,
  Type
} from '../../interfaces';
import { Logger } from '../../logger';

async function compileContextArguments(context: ExecutionContext): Promise<void> {
  const parameterResolverList: Record<string, number> =
    Reflect.getMetadata(
      METHOD_PARAMS_METADATA_INTERNAL,
      context.target.constructor,
      context.propertyKey
    ) || {};

  if (isEmpty(parameterResolverList)) return;

  const compiledArguments = context.getArguments();

  await Promise.all(
    Object.entries(parameterResolverList).map(
      async ([key, index]) =>
        (compiledArguments[index] = await getParameterDecoratorResolverValue(key, context))
    )
  ).catch((error) => Logger.error(error));

  context.setArguments(compiledArguments);
}

export function wrappedDecorator(
  method?: MethodDecoratorResolver,
  presetter?: MethodDecoratorPresetter
) {
  return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<FunctionType>) => {
    if (isFunction(presetter)) presetter(target, propertyKey, descriptor);

    const originalDescriptor = descriptor.value;
    descriptor.value = async function (...arguments_: any[]) {
      const context = new ExecutionContext(
        arguments_,
        { target, propertyKey, descriptor },
        originalDescriptor.bind(this)
      );

      if (method) await method(context);

      if (context.terminated) return;

      await compileContextArguments(context);

      return context.call();
    };
  };
}

/**
 *
 * @param method The method to perform at run time, on every execution of this method
 * @param presetter the method to perform at build time, run only once (mostly used for emitting custom metadata)
 * @returns
 */
export function createMethodDecorator(
  method: MethodDecoratorResolver,
  presetter?: MethodDecoratorPresetter
) {
  return () => wrappedDecorator(method, presetter);
}
