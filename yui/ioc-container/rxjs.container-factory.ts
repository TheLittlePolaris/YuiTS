import { ClientEvents, Message } from 'discord.js'
import { isArray } from 'lodash'
import { catchError, fromEvent, map, noop, Observable, of, take, tap } from 'rxjs'

import { DiscordEvent } from '@/constants/discord-events'
import { DiscordClient } from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'

import { RxjsRecursiveCompiler } from './compilers/rxjs.compiler'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from './containers'
import { _internalSetGetter, _internalSetRefs } from './helpers'
import {
  BaseEventsHandler,
  DiscordRxjsEventHandlers,
  RxjsCommandHandler,
  RxjsHandleFunction,
  Type,
} from './interfaces'

export class RxjsContainerFactory {
  private moduleContainer = new ModulesContainer()
  private componentContainer = new ComponentsContainer()
  private interceptorContainer = new InterceptorsContainer()
  private providerContainer = new ProvidersContainer()

  private readonly _compiler: RxjsRecursiveCompiler

  private _config
  private _eventHandlers: DiscordRxjsEventHandlers = {}
  constructor() {
    this._compiler = new RxjsRecursiveCompiler(
      this.moduleContainer,
      this.componentContainer,
      this.providerContainer,
      this.interceptorContainer
    )
  }

  async initialize(rootModule: Type<any>, entryComponent = DiscordClient) {
    await this._compiler.compileModule(rootModule, entryComponent)

    this._config = this._compiler.config
    this._eventHandlers = this._compiler.eventHandlers as BaseEventsHandler<RxjsCommandHandler>

    const client = this.componentContainer.getInstance(entryComponent)
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
    return client
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.componentContainer.getInstance(type)
  }

  private getCommandFunction(
    event: keyof ClientEvents,
    command: string | false
  ): RxjsHandleFunction {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (command === false) return (..._args: any) => of(noop)
    const { [command]: compiledCommand = null, ['default']: defaultAction } =
      this._eventHandlers[event].handleFunction
    return compiledCommand || defaultAction
  }

  private getHandlerForEvent(event: keyof ClientEvents, args: ClientEvents[DiscordEvent]) {
    const command = this.getCommandHandler(event, args)
    const commandHandler = this.getCommandFunction(event, command)
    return commandHandler(args)
  }

  private getCommandHandler(event: DiscordEvent, args: ClientEvents[DiscordEvent]) {
    switch (event) {
      case 'messageCreate': {
        const {
          author: { bot },
          content,
        } = args[0] as Message
        const { config } = this._eventHandlers['messageCreate']
        if (config) {
          const { ignoreBots, startsWithPrefix } = config

          if ((startsWithPrefix && !content.startsWith(this._config.prefix)) || (ignoreBots && bot))
            return false
        }
        // if (!content.startsWith(this.configService.prefix) || bot) return false
        return content.replace(this._config.prefix, '').trim().split(/ +/g)[0]
      }

      default:
        return 'default'
    }
  }
}
