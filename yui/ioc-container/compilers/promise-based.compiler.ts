import { ClientEvents } from 'discord.js'
import { DiscordEvent } from '../constants'

import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Type } from '../interfaces/dependencies-injection.interfaces'
import { BaseRecursiveCompiler } from './base/base-recursive.compiler'

/**
 * @description Compile using recursive strategy.
 */
export class PromiseBasedRecursiveCompiler extends BaseRecursiveCompiler<Promise<any>> {
  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {
    super(_moduleContainer, _componentContainer, _providerContainer, _interceptorContainer)
  }

  protected compileCommand(target: Type<any>, instance: InstanceType<Type<any>>, propertyKey: string) {
    const interceptor = this.getInterceptor(target)
    // bind: passive when go through interceptor, active when call directly
    const fromHandler = (_eventArgs: ClientEvents[DiscordEvent]) =>
      (instance[propertyKey] as Function).call(instance, _eventArgs)

    const handler = (context: ExecutionContext): Promise<any> => {
      context.setContextMetadata({ target, propertyKey })
      return !interceptor
        ? fromHandler(context.getArguments())
        : interceptor.intercept(context, () => fromHandler(context.getArguments()))
    }

    return handler
  }
}
