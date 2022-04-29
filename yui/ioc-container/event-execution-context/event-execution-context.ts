import { ClientEvents } from 'discord.js'
import { isArray } from 'lodash'
import { DiscordEvent } from '../constants'
import { DiscordClient } from '../entrypoint'
import { Prototype } from '../interfaces'
import { SimpleConfigService } from '../simple-config'

export class EventExecutionContext<
  TClient extends DiscordClient = DiscordClient,
  TConfig extends SimpleConfigService = SimpleConfigService
> {
  private _handler: (...args: any[]) => any

  private _mutatedArguments: any[]

  private _contextTarget: Prototype
  private _contextPropertyKey: string
  private _contextDescriptor: TypedPropertyDescriptor<Function>

  private _terminated = false

  constructor(
    private readonly _arguments: ClientEvents[DiscordEvent],
    public readonly client: TClient,
    public readonly config: TConfig
  ) {

    this._mutatedArguments = isArray(_arguments) ? _arguments : [_arguments]
  }

  public get terminated() {
    return this._terminated
  }

  public getArguments<T extends any[] = any[]>(): T {
    return this._mutatedArguments as T
  }

  public getOriginalArguments(): any[] {
    return this._arguments
  }

  public setArguments(args: any[]): void {
    this._mutatedArguments = [...args]
  }

  public setHandler(handler: (...args: any[]) => any): void {
    this._handler = handler
  }

  public getHandler<T extends (...args: any[]) => any = (...args: any[]) => any>(): T {
    return this._handler as T
  }

  public setContextMetadata(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>
  ): void {
    this._contextTarget = target
    this._contextPropertyKey = propertyKey
    this._contextDescriptor = descriptor
  }

  public get target() {
    return this._contextTarget
  }

  public get propertyKey() {
    return this._contextPropertyKey
  }

  public get descriptor() {
    return this._contextDescriptor
  }

  public getContextMetadata() {
    return {
      target: this.target,
      propertyKey: this.propertyKey,
      descriptor: this.descriptor,
    }
  }

  public call<T>(): T {
    const handler = this.getHandler()
    const args = this.getArguments()
    return handler(args)
  }

  terminate() {
    delete this._handler
    delete this._mutatedArguments
    this._terminated = true
    console.log(`${this.target?.constructor?.name || this.target?.['name']} terminated`)
  }
}

