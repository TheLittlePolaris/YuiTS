import { ClientEvents } from 'discord.js'
import { isArray } from 'lodash'

import { YuiLogger } from '@/services/logger'

import { DiscordEvent } from '../constants'
import { DiscordClient } from '../entrypoint'
import { Prototype } from '../interfaces'
import { IExecutionContextMetadata } from '../interfaces/execution-context.interface'
import { ConfigService } from '../simple-config'

export class ExecutionContext {
  private _handler: Function | ((...args: any[]) => any)

  private _mutatedArguments: any[]

  private _contextTarget: Prototype
  private _contextPropertyKey: string
  private _contextDescriptor: TypedPropertyDescriptor<Function>

  private _terminated = false

  static client: DiscordClient
  static config: ConfigService

  constructor(
    private readonly _arguments: ClientEvents[DiscordEvent],
    _metadata?: IExecutionContextMetadata,
    _contextHandler?: Function | ((...args: any[]) => any)
  ) {
    this.setArguments(isArray(_arguments) ? _arguments : [_arguments])
    if (_metadata) this.setContextMetadata(_metadata)
    if (_contextHandler) this.setHandler(_contextHandler)
  }

  public get terminated() {
    return this._terminated
  }

  public get client() {
    return ExecutionContext.client
  }

  public get config() {
    return ExecutionContext.config
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

  public setHandler(handler: Function | ((...args: any[]) => any)): void {
    this._handler = handler
  }

  public getHandler<T extends (...args: any[]) => any = (...args: any[]) => any>(): T {
    return this._handler as T
  }

  public setContextMetadata({ target, propertyKey, descriptor }: IExecutionContextMetadata): void {
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

    if (this._terminated || !handler) return
    return handler(...args)
  }

  terminate() {
    delete this._handler
    delete this._mutatedArguments
    this._terminated = true
    YuiLogger.log(`${this.target?.constructor?.name || this.target?.['name']} terminated`)
  }
}
