import { ClientEvents } from 'discord.js'
import { isArray } from 'lodash'
import { catchError, fromEvent, map, noop, Observable, of, take } from 'rxjs'

import { YuiLogger } from '@/services/logger/logger.service'

import { RxjsRecursiveCompiler } from '../compilers'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../constants'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from '../containers'
import { DiscordClient } from '../entrypoint'
import { _internalSetGetter, _internalSetRefs } from '../helpers'
import { BaseEventsHandlers, RxjsCommandHandler, RxjsHandlerFn, Type } from '../interfaces'
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
    this.eventHandlers = this.compiler.eventHandlers as BaseEventsHandlers<
      RxjsHandlerFn,
      RxjsCommandHandler
    >

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

  protected getHandler(event: keyof ClientEvents, command: string | false): RxjsHandlerFn {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._args: any) => of(noop)
    const {
      [command]: compiledCommand = null, //
      [DEFAULT_ACTION_KEY]: defaultAction,
    } = this._eventHandlers[event].handlers as RxjsCommandHandler
    return compiledCommand || defaultAction
  }
}

