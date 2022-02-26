import { ClientEvents, Message } from 'discord.js'

import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { COMPONENT_METADATA, DiscordClient } from '@/ioc-container'
import { YuiLogger } from '@/services/logger/logger.service'
import {
  ComponentsContainer,
  InterceptorsContainer,
  ModulesContainer,
  ProvidersContainer,
} from './containers'
import { _internalSetGetter, _internalSetRefs } from './helpers'
import { HandleFunction, Type } from './interfaces'
import { RecursiveCompiler } from './compilers/recursive.compiler'

export class ContainerFactory {
  static entryDetected = false
  static _instance: ContainerFactory

  private moduleContainer = new ModulesContainer()
  private componentContainer = new ComponentsContainer()
  private interceptorContainer = new InterceptorsContainer()
  private providerContainer = new ProvidersContainer()

  private readonly _compiler: RecursiveCompiler

  private _config
  private _eventHandlers: {
    [key in DiscordEvent]?: { handleFunction: HandleFunction; config?: DiscordEventConfig[key] }
  } = {}
  constructor() {
    this._compiler = new RecursiveCompiler(
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

  async createHandleModule(rootModule: Type<any>, entryComponent = DiscordClient) {
    await this._compiler.compileModule(rootModule, entryComponent)

    this._config = this._compiler.config
    this._eventHandlers = this._compiler.eventHandlers

    const client = this.componentContainer.getInstance(entryComponent)
    const compiledEvents = Object.keys(this._eventHandlers)
    compiledEvents.map((handler: DiscordEvent) =>
      client.addListener(handler, (...args: ClientEvents[typeof handler]) =>
        this.getHandlerForEvent(handler, args)
      )
    )
    // _internalInjectionGetter(this.container.getInstance)
    _internalSetRefs(this._config, client)
    _internalSetGetter((...args: any[]) => this.get.bind(this, ...args))
    return client
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this.componentContainer.getInstance(type)
  }

  public getHandlerForEvent(event: keyof ClientEvents, args: ClientEvents[DiscordEvent]) {
    const command = this.getCommandHandler(event, args)
    if (command === false) return

    const { [command]: compiledCommand = null, ['default']: defaultAction } =
      this._eventHandlers[event].handleFunction

    try {
      if (compiledCommand) compiledCommand(args)
      else if (defaultAction) defaultAction(args)
    } catch (error) {
      YuiLogger.error(`Uncaught error: ${error}`, 'AppContainer')
    }
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
