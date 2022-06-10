import { ClientEvents } from 'discord.js'

import { DiscordEvent } from '@/ioc-container/constants/discord-events'

import { INTERCEPTOR_TARGET } from '../constants/dependencies-injection.constant'
import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { PromiseCommands, PromiseHandler } from '../interfaces/container.interface'
import { Type } from '../interfaces/dependencies-injection.interfaces'
import { IBaseInterceptor } from '../interfaces/interceptor.interface'
import { BaseRecursiveCompiler } from './base-recursive.compiler'

/**
 * @description Compile using recursive strategy.
 */
export class PromiseBasedRecursiveCompiler extends BaseRecursiveCompiler<PromiseHandler, PromiseCommands> {
  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {
    super(_moduleContainer, _componentContainer, _providerContainer, _interceptorContainer)
  }

  protected compileCommand(target: Type<any>, instance: InstanceType<Type<any>>, propertyKey: string): PromiseHandler {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this._interceptorContainer.getInterceptorInstance(useInterceptor)) || null
    // bind: passive when go through interceptor, active when call directly
    const fromHandler = (_eventArgs: ClientEvents[DiscordEvent]) =>
      (instance[propertyKey] as Function).call(instance, _eventArgs)

    const handler = (context: ExecutionContext) => {
      context.setContextMetadata({ target, propertyKey })
      return !useInterceptor
        ? fromHandler(context.getArguments())
        : interceptorInstance.intercept(context, () => fromHandler(context.getArguments()))
    }

    return handler
  }
}
