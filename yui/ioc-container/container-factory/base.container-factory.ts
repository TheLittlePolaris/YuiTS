import { ClientEvents, Message } from 'discord.js'

import { BaseRecursiveCompiler } from '../compilers/base-recursive.compiler'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../constants'
import { DiscordClient } from '../entrypoint'
import { EventExecutionContext } from '../event-execution-context/event-execution-context'
import {
  BaseEventsHandlers,
  BaseHandlerFn,
  BaseResult,
  BaseSingleEventHandler,
  Type,
} from '../interfaces'
import { ConfigService } from '../simple-config'

export abstract class BaseContainerFactory {
  static entryDetected = false

  protected _config: ConfigService
  protected _client: DiscordClient
  protected _eventHandlers: BaseEventsHandlers<BaseHandlerFn, BaseSingleEventHandler>

  constructor(private readonly _compiler: BaseRecursiveCompiler) {
    this._eventHandlers = {}
  }

  protected get compiler() {
    return this._compiler
  }

  protected set eventHandlers(value: BaseEventsHandlers<BaseHandlerFn, BaseSingleEventHandler>) {
    this._eventHandlers = value
  }

  protected get eventHanlders() {
    return this._eventHandlers
  }

  protected get config() {
    return this._config
  }

  protected set config(value: any) {
    this._config = value
  }

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this._compiler.componentContainer.getInstance(type)
  }

  protected getClient() {
    return (
      this._client || (this._client = this.compiler.componentContainer.getInstance(DiscordClient))
    )
  }

  protected getConfig() {
    return this._config || (this._config = this.compiler.config)
  }

  protected createExecutionContext(args: ClientEvents[DiscordEvent]) {
    return new EventExecutionContext(args, this.getClient(), this.getConfig())
  }

  protected handleEvent(
    event: keyof ClientEvents,
    context: EventExecutionContext
  ): BaseResult {
    const command = this.getCommand(event, context.getArguments())

    const commandHandler = this.getHandler(event, command)

    // context.setHandler(commandHandler)

    return commandHandler(context)
  }

  private getCommand(event: DiscordEvent, args: ClientEvents[DiscordEvent]): string | false {
    switch (event) {
      case 'messageCreate': {
        const {
          author: { bot },
          content,
        } = args[0] as Message
        const { config } = this._eventHandlers['messageCreate']
        if (config) {
          const { ignoreBots, startsWithPrefix } = config

          if (
            (startsWithPrefix && !content.startsWith(this._config['prefix'])) ||
            (ignoreBots && bot)
          )
            return false
        }
        return content.replace(this._config['prefix'], '').trim().split(/ +/g)[0]
      }

      default:
        return DEFAULT_ACTION_KEY
    }
  }

  protected abstract initialize(
    rootModule: Type<any>,
    entryComponent: Type<DiscordClient>
  ): Promise<DiscordClient>

  protected abstract getHandler(event: keyof ClientEvents, command: string | false): BaseHandlerFn
}

