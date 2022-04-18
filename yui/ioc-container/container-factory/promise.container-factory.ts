import { ClientEvents, Message } from 'discord.js'
import { noop } from 'lodash'

import { PromiseBasedRecursiveCompiler } from '../compilers'
import { COMPONENT_METADATA, DEFAULT_ACTION_KEY, DiscordEvent } from '../constants'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from '../containers'
import { DiscordClient } from '../entrypoint'
import { _internalSetGetter, _internalSetRefs } from '../helpers'
import { BaseEventsHandler, PromiseCommandHandler, PromiseHandlerFn, Type } from '../interfaces'

export class RecursiveContainerFactory {
  static entryDetected = false

  private moduleContainer = new ModulesContainer()
  private componentContainer = new ComponentsContainer()
  private interceptorContainer = new InterceptorsContainer()
  private providerContainer = new ProvidersContainer()

  private readonly _compiler: PromiseBasedRecursiveCompiler

  private _config
  private _eventHandlers: BaseEventsHandler<PromiseHandlerFn, PromiseCommandHandler> = {}

  constructor() {
    this._compiler = new PromiseBasedRecursiveCompiler(
      this.moduleContainer,
      this.componentContainer,
      this.providerContainer,
      this.interceptorContainer
    )
  }

  /**
   *
   * @param moduleMetadata - the `AppModule`
   * @param entryComponent ```ts
   * export class MyEntryComponent extends EntrypointComponent {
   *    constructor(token: string) {
   *       super(token)
   *    }
   * }
   * ```
   * @returns instance of MyEntryComponent
   */
  async createInstanceModule(moduleMetadata: Type<any>, entryComponent?: Type<any>) {
    await this._compiler.compileModule(moduleMetadata, entryComponent)
    /**
     * IMPORTANT:
     *  - Required the entry component to extend EntryComponent class
     */
    const entryInstance = this.get(entryComponent)

    const boundEvents =
      Reflect.getMetadata(COMPONENT_METADATA.EVENT_LIST, entryInstance['constructor']) || {}

    const { length: hasEvents, ...events } = Object.keys(boundEvents)
    if (hasEvents) {
      events.forEach((eventKey: DiscordEvent) =>
        entryInstance.client.addListener(eventKey, (...args) =>
          entryInstance[boundEvents[eventKey]](...args)
        )
      )
    }

    Object.keys(this._eventHandlers).map((handler: DiscordEvent) =>
      entryInstance.client.addListener(handler, (...args: ClientEvents[typeof handler]) =>
        this.getHandlerForEvent(handler, args)
      )
    )

    return entryInstance
  }

  async initialize(rootModule: Type<any>, entryComponent = DiscordClient) {
    await this._compiler.compileModule(rootModule, entryComponent)

    this._config = this._compiler.config
    this._eventHandlers = this._compiler.eventHandlers as BaseEventsHandler<
      PromiseHandlerFn,
      PromiseCommandHandler
    >

    const client = this.componentContainer.getInstance(entryComponent)
    const compiledEvents = Object.keys(this._eventHandlers)
    compiledEvents.map((handler: DiscordEvent) =>
      client.addListener(handler, (...args: ClientEvents[typeof handler]) =>
        this.getHandlerForEvent(handler, args)
      )
    )

    _internalSetRefs(this._config, client)
    _internalSetGetter((...args: any[]) => this.get.bind(this, ...args))
    return client
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.componentContainer.getInstance(type)
  }

  private getCommandFunction(event: keyof ClientEvents, command: string | false) {
    if (command === false) return noop
    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this._eventHandlers[event].handlers
    return compiledCommand || defaultAction
  }

  private getHandlerForEvent(event: keyof ClientEvents, args: ClientEvents[DiscordEvent]) {
    const command = this.getCommandHandler(event, args)
    const commandHandler = this.getCommandFunction(event, command)
    return commandHandler(args)
  }

  private getCommandHandler(event: DiscordEvent, args: ClientEvents[DiscordEvent]): string | false {
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
        return DEFAULT_ACTION_KEY
    }
  }
}

