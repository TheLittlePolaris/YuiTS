import { ClientEvents } from 'discord.js'

import { DiscordEvent } from '@/ioc-container/constants/discord-events'

import { INTERCEPTOR_TARGET } from '../constants/dependencies-injection.constant'
import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { PromiseHandleFunction } from '../interfaces/container.interface'
import { Type } from '../interfaces/dependencies-injection.interfaces'
import { IBaseInterceptor } from '../interfaces/interceptor.interface'
import { BaseRecursiveCompiler } from './base.compiler'

/**
 * @description Compile using recursive strategy.
 */
export class PromiseBasedRecursiveCompiler extends BaseRecursiveCompiler  {
  constructor(
    protected _moduleContainer: ModulesContainer,
    protected _componentContainer: ComponentsContainer,
    protected _providerContainer: ProvidersContainer,
    protected _interceptorContainer: InterceptorsContainer
  ) {
    super(_moduleContainer, _componentContainer, _providerContainer, _interceptorContainer)
  }

  protected compileCommand(
    target: Type<any>,
    instance: InstanceType<Type<any>>,
    propertyKey: string
  ): PromiseHandleFunction {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this._interceptorContainer.getInterceptorInstance(useInterceptor)) || null
    // bind: passive when go through interceptor, active when call directly
    const handler = (_eventArgs: ClientEvents[DiscordEvent], bind = false) =>
      bind
        ? (instance[propertyKey] as Function).bind(instance, _eventArgs, this._config)
        : (instance[propertyKey] as Function).apply(instance, [_eventArgs, this._config])

    return interceptorInstance
      ? (_eventArgs: ClientEvents[DiscordEvent]) =>
          interceptorInstance.intercept(_eventArgs, handler(_eventArgs, true))
      : handler
  }
}

