import { DiscordEvent } from '@/constants/discord-events'
import { ClientEvents } from 'discord.js'
import { INTERCEPTOR_TARGET } from '../constants'
import { ComponentsContainer, InterceptorsContainer, ProvidersContainer } from '../containers'
import { ModulesContainer } from '../containers/modules.container'
import { IBaseInterceptor } from '../interfaces'
import { HandleFunction } from '../interfaces/container.interface'
import { ICommandHandlerMetadata, Type } from '../interfaces/dependencies-injection.interfaces'
import { RecursiveCompiler } from './recursive.compiler'

/**
 * @description Compile using Rxjs strategy.
 */
export class RxjsCompiler extends RecursiveCompiler {
  constructor(
    protected moduleContainer: ModulesContainer,
    protected componentContainer: ComponentsContainer,
    protected providerContainer: ProvidersContainer,
    protected interceptorContainer: InterceptorsContainer
  ) {
    super(moduleContainer, componentContainer, providerContainer, interceptorContainer)
  }

  protected compileCommand<T extends Type<any>>(
    target: T,
    instance: InstanceType<T>,
    propertyKey: string
  ) {
    const useInterceptor: string = Reflect.getMetadata(INTERCEPTOR_TARGET, target)
    const interceptorInstance: IBaseInterceptor =
      (useInterceptor && this.interceptorContainer.getInterceptorInstance(useInterceptor)) || null
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

  protected compileHandlers<T extends Type<any>>(
    target: T,
    instance: InstanceType<T>,
    handlerMetadata: ICommandHandlerMetadata[]
  ): HandleFunction {
    return handlerMetadata.reduce(
      (acc: HandleFunction, { command, propertyKey, commandAliases }) => {
        const commandFn = this.compileCommand(target, instance, propertyKey)
        const mainCommand = { [command]: commandFn }
        const aliases = [...(commandAliases || [])].reduce(
          (accAliases, curr) => ({ ...accAliases, [curr]: mainCommand[command] }),
          {}
        )
        return Object.assign(acc, mainCommand, aliases)
      },
      {}
    )
  }
}

