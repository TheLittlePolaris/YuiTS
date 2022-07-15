import { ClientEvents } from 'discord.js'
import { BaseHandler } from '../compilers'

import { BaseRecursiveCompiler } from '../compilers/base/base-recursive.compiler'
import { DEFAULT_ACTION_KEY, DiscordEvent } from '../../constants'
import { DiscordClient } from '../../entrypoint'
import { ExecutionContext } from '../../event-execution-context/execution-context'
import { Type } from '../../interfaces'

export abstract class BaseContainerFactory<TReturn> {
  static entryDetected = false

  protected _config
  protected _client: DiscordClient

  constructor(private readonly _compiler: BaseRecursiveCompiler<TReturn>) {}

  protected get compiler() {
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
    return (
      this._client || (this._client = this.compiler.componentContainer.getInstance(DiscordClient))
    )
  }

  protected getConfig() {
    return this._config || (this._config = this.compiler.config)
  }

  protected createExecutionContext(args: ClientEvents[DiscordEvent]) {
    return new ExecutionContext(args)
  }

  protected handleEvent(
    event: keyof ClientEvents,
    context: ExecutionContext
  ): ReturnType<BaseHandler<TReturn>> {
    const command = this.getCommand(event, context.getArguments())

    const commandHandler = this.getHandler(event, command)

    return commandHandler(context)
  }

  private getCommand(event: DiscordEvent, args: ClientEvents[DiscordEvent]): string | false {
    switch (event) {
      case 'messageCreate': {
        const [{ content }] = args as ClientEvents['messageCreate']
        return content.replace(this._config['prefix'], '').trim().split(/ +/g)[0]
      }
      default:
        return DEFAULT_ACTION_KEY
    }
  }

  protected abstract filterEvent(event: DiscordEvent, args: ClientEvents[DiscordEvent]): TReturn
  protected abstract initialize(
    rootModule: Type<any>,
    entryComponent: Type<DiscordClient>
  ): Promise<DiscordClient>

  protected abstract getHandler(
    event: keyof ClientEvents,
    command: string | false
  ): BaseHandler<TReturn>
}
