import { ClientEvents } from 'discord.js'
import { from, Observable, of } from 'rxjs'

import { DiscordEvent } from '../constants'
import { ComponentsContainer, InterceptorsContainer, ModulesContainer, ProvidersContainer } from '../containers'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { Type } from '../interfaces'
import { BaseRecursiveCompiler } from './base/base-recursive.compiler'

/**
 * @description Compile using Rxjs strategy.
 */
export class RxjsRecursiveCompiler extends BaseRecursiveCompiler<Observable<any>> {
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

    const fromHandler = (_eventArgs: ClientEvents[DiscordEvent]) => from(of(instance[propertyKey](_eventArgs)))

    const handler = (context: ExecutionContext) => {
      context.setContextMetadata({ target, propertyKey })
      return !interceptor
        ? fromHandler(context.getArguments())
        : interceptor.intercept(context, () => fromHandler(context.getArguments()))
    }

    return handler
  }
}
