import { ClientEvents, Message } from 'discord.js'

import { DiscordEvent } from '@/ioc-container/constants/discord-events'

import { BaseRecursiveCompiler } from '../compilers/base.compiler'
import { DiscordClient } from '../entrypoint'
import {
  BaseEventsHandler,
  BaseSingleEventHandler,
  BaseSingleHandleFunction,
  Type,
} from '../interfaces'

export abstract class BaseContainerFactory {
  static entryDetected = false

  protected _config
  protected _eventHandlers: BaseEventsHandler<BaseSingleEventHandler>

  constructor(private readonly _compiler: BaseRecursiveCompiler) {
    this._eventHandlers = {}
  }

  protected get compiler() {
    return this._compiler
  }

  protected set eventHandlers(value: BaseEventsHandler<BaseSingleEventHandler>) {
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

  protected abstract initialize(
    rootModule: Type<any>,
    entryComponent: Type<DiscordClient>
  ): Promise<DiscordClient>

  public get<T>(type: Type<T>): InstanceType<Type<T>> {
    return this._compiler.componentContainer.getInstance(type)
  }

  protected abstract getCommandFunction(
    event: keyof ClientEvents,
    command: string | false
  ): BaseSingleHandleFunction

  protected getHandlerForEvent(event: keyof ClientEvents, args: ClientEvents[DiscordEvent]) {
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
        return 'default'
    }
  }
}

