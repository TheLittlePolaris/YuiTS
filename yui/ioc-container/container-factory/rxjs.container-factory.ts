import { ClientEvents } from 'discord.js'
import { isArray } from 'lodash'
import { catchError, fromEvent, map, noop, Observable, of, take } from 'rxjs'

import { DiscordEvent } from '@/ioc-container/constants/discord-events'
import {
  BaseEventsHandler,
  ComponentsContainer,
  DiscordClient,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
  RxjsCommandHandler,
  RxjsHandleFunction,
  RxjsRecursiveCompiler,
  Type,
  _internalSetGetter,
  _internalSetRefs,
} from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'
import { BaseContainerFactory } from './base.container-factory'

export class RxjsContainerFactory extends BaseContainerFactory {

  constructor() {
    const moduleContainer = new ModulesContainer()
    const componentContainer = new ComponentsContainer()
    const interceptorContainer = new InterceptorsContainer()
    const providerContainer = new ProvidersContainer()
    super(
      new RxjsRecursiveCompiler(
        moduleContainer,
        componentContainer,
        providerContainer,
        interceptorContainer
      )
    )
  }

  async initialize(rootModule: Type<any>, entryComponent = DiscordClient): Promise<DiscordClient> {
    await this.compiler.compileModule(rootModule, entryComponent)

    this.config = this.compiler.config
    this.eventHandlers = this.compiler.eventHandlers as BaseEventsHandler<RxjsCommandHandler>

    const client = this.compiler.componentContainer.getInstance(entryComponent)
    const compiledEvents = Object.keys(this._eventHandlers)

    compiledEvents.forEach((event: DiscordEvent) => {
      fromEvent(client, event)
        .pipe(
          map((args: ClientEvents[typeof event]) =>
            this.getHandlerForEvent(event, isArray(args) ? args : [args])
          ),
          map((observable: Observable<any>) =>
            observable
              .pipe(
                take(1),
                catchError((error) => {
                  YuiLogger.error(`Uncaught error: ${error}`, 'AppContainer')
                  return of(error)
                })
              )
              .subscribe()
          ),
          catchError((error) => {
            YuiLogger.error(`Uncaught error: ${error}`, 'AppContainer')
            return of(error)
          })
        )
        .subscribe()
    })

    _internalSetRefs(this._config, client)
    _internalSetGetter((...args: any[]) => this.get.bind(this, ...args))
    return client as DiscordClient
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.compiler.componentContainer.getInstance(type)
  }

  protected getCommandFunction(
    event: keyof ClientEvents,
    command: string | false
  ): RxjsHandleFunction {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._args: any) => of(noop)
    const { [command]: compiledCommand = null, ['default']: defaultAction } = this._eventHandlers[
      event
    ].handleFunction as RxjsCommandHandler
    return compiledCommand || defaultAction
  }
}

