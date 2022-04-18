import { ClientEvents } from 'discord.js'
import { catchError, from, of, tap, throwError } from 'rxjs'

import { DiscordEvent } from '@/ioc-container/constants/discord-events'

import { INTERCEPTOR_TARGET } from '../constants'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from '../containers'
import { IRxjsInterceptor, RxjsHandlerFn, Type } from '../interfaces'
import { BaseRecursiveCompiler } from './base.compiler'

/**
 * @description Compile using Rxjs strategy.
 */
export class RxjsRecursiveCompiler extends BaseRecursiveCompiler {
  
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
  ): RxjsHandlerFn {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IRxjsInterceptor =
      (useInterceptor && this._interceptorContainer.getInterceptorInstance(useInterceptor)) || null
    // bind: passive when go through interceptor, active when call directly
    const fromHandler = (_eventArgs: ClientEvents[DiscordEvent]) =>
      from(of(instance[propertyKey](_eventArgs)))

    const handler = (_eventArgs: ClientEvents[DiscordEvent]) => {
      return !useInterceptor
        ? fromHandler(_eventArgs)
        : interceptorInstance.intercept(_eventArgs, () => fromHandler(_eventArgs))
    }

    return handler
  }
}

