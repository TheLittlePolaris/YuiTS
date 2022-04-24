import { ClientEvents } from 'discord.js'

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
import { BaseEventsHandlers, PromiseCommandHandler, PromiseHandlerFn, Type } from '../interfaces'
import { BaseContainerFactory } from './base.container-factory'

export class RecursiveContainerFactory extends BaseContainerFactory {
  static entryDetected = false

  constructor() {
    const moduleContainer = new ModulesContainer()
    const componentContainer = new ComponentsContainer()
    const interceptorContainer = new InterceptorsContainer()
    const providerContainer = new ProvidersContainer()
    super(
      new PromiseBasedRecursiveCompiler(
        moduleContainer,
        componentContainer,
        providerContainer,
        interceptorContainer
      )
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
    await this.compiler.compileModule(moduleMetadata, entryComponent)
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
    await this.compiler.compileModule(rootModule, entryComponent)

    this._config = this.compiler.config
    this._eventHandlers = this.compiler.eventHandlers as BaseEventsHandlers<
      PromiseHandlerFn,
      PromiseCommandHandler
    >

    const client = this.compiler.componentContainer.getInstance(entryComponent)
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

  protected getHandler(event: keyof ClientEvents, command: string | false): PromiseHandlerFn {
    if (command === false) return (..._: any[]) => Promise.resolve()
    const { [command]: compiledCommand = null, [DEFAULT_ACTION_KEY]: defaultAction } =
      this._eventHandlers[event].handlers

    return (compiledCommand || defaultAction) as PromiseHandlerFn
  }
}

