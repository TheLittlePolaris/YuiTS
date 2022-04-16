import { ClientEvents } from 'discord.js'
import { catchError, from, of, tap, throwError } from 'rxjs'

import { DiscordEvent } from '@/constants/discord-events'

import { INTERCEPTOR_TARGET } from '../constants'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from '../containers'
import { IRxjsInterceptor, RxjsHandleFunction, Type } from '../interfaces'
import { BaseRecursiveCompiler } from './base.compiler'

/**
 * @description Compile using Rxjs strategy.
 */
export class RxjsRecursiveCompiler extends BaseRecursiveCompiler {
  constructor(
    protected moduleContainer: ModulesContainer,
    protected componentContainer: ComponentsContainer,
    protected providerContainer: ProvidersContainer,
    protected interceptorContainer: InterceptorsContainer
  ) {
    super(moduleContainer, componentContainer, providerContainer, interceptorContainer)
  }

  protected compileCommand(
    target: Type<any>,
    instance: InstanceType<Type<any>>,
    propertyKey: string
  ): RxjsHandleFunction {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IRxjsInterceptor =
      (useInterceptor && this.interceptorContainer.getInterceptorInstance(useInterceptor)) || null
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

