import { ClientEvents, Message } from 'discord.js'

import { BaseRecursiveCompiler } from '../compilers/base-recursive.compiler'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../constants'
import { DiscordClient } from '../entrypoint'
import { ExecutionContext } from '../event-execution-context/event-execution-context'
import { BaseCommands, BaseEventsHandlers, BaseHandler, BaseResult, Type } from '../interfaces'
import { ConfigService } from '../simple-config'

export abstract class BaseContainerFactory<T extends BaseHandler, U extends BaseCommands<T>> {
  static entryDetected = false

  protected _config: ConfigService
  protected _client: DiscordClient

  constructor(private readonly _compiler: BaseRecursiveCompiler<T, U>) {}

  protected get compiler(): BaseRecursiveCompiler<T, U> {
    return this._compiler
  }

  protected get eventHandlers() {
    return this._compiler.eventHandlers
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
    return this._client || (this._client = this.compiler.componentContainer.getInstance(DiscordClient))
  }

  protected getConfig() {
    return this._config || (this._config = this.compiler.config)
  }

  protected createExecutionContext(args: ClientEvents[DiscordEvent]) {
    return new ExecutionContext(args)
  }

  protected handleEvent<T>(event: keyof ClientEvents, context: ExecutionContext): BaseResult {
    const command = this.getCommand(event, context.getArguments())

    const commandHandler = this.getHandler(event, command)

    return commandHandler(context)
  }

  protected filterCommand(event: DiscordEvent, args: ClientEvents[DiscordEvent]): ClientEvents[DiscordEvent] | null {
    switch (event) {
      case 'messageCreate': {
        const {
          author: { bot },
          content
        } = args as any as Message
        const { config } = this.eventHandlers['messageCreate']
        if (config) {
          const { ignoreBots, startsWithPrefix } = config

          if ((startsWithPrefix && !content.startsWith(this._config['prefix'])) || (ignoreBots && bot)) return null
        }
        break
      }
      default:
        break
    }

    return args
  }

  private getCommand(event: DiscordEvent, args: ClientEvents[DiscordEvent]): string | false {
    switch (event) {
      case 'messageCreate': {
        const { content } = args[0] as Message
        return content.replace(this._config['prefix'], '').trim().split(/ +/g)[0]
      }
      default:
        return DEFAULT_ACTION_KEY
    }
  }

  protected abstract initialize(rootModule: Type<any>, entryComponent: Type<DiscordClient>): Promise<DiscordClient>

  protected abstract getHandler(event: keyof ClientEvents, command: string | false): BaseHandler
}
