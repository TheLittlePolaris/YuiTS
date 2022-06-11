import { get, isArray } from 'lodash'

import { DiscordClient } from '../entrypoint'
import { Prototype, Type } from '../interfaces'
import { IExecutionContextMetadata } from '../interfaces/execution-context.interface'
import { Logger } from '../logger'
import { ConfigService } from '../simple-config'

export class ExecutionContext {
  static client: DiscordClient
  static config: ConfigService

  private _handler: Function | ((...args: any[]) => any)

  private _mutatedArguments: any[]

  private _contextTarget: Prototype | Type<any>

  private _contextPropertyKey: string
  private _contextDescriptor: TypedPropertyDescriptor<Function>

  private _terminated = false

  private _executionStartTimestamp: number

  constructor(
    private readonly _arguments: any,
    _metadata?: IExecutionContextMetadata,
    _contextHandler?: Function | ((...args: any[]) => any)
  ) {
    this.setArguments(isArray(_arguments) ? _arguments : [_arguments])

    if (_metadata) this.setContextMetadata(_metadata)
    if (_contextHandler) this.setHandler(_contextHandler)

    this._executionStartTimestamp = Date.now()
  }

  get executionStartTimestamp() {
    return this._executionStartTimestamp
  }

  get terminated() {
    return this._terminated
  }

  get client() {
    return ExecutionContext.client
  }

  get config() {
    return ExecutionContext.config
  }

  getArguments<T extends any[] = any[]>(): T {
    return this._mutatedArguments as T
  }

  getOriginalArguments<T = any[]>(): T {
    return this._arguments
  }

  setArguments(args: any[]): void {
    this._mutatedArguments = [...args]
  }

  setHandler(handler: Function | ((...args: any[]) => any)): void {
    this._handler = handler
  }

  getHandler<T extends (...args: any[]) => any = (...args: any[]) => any>(): T {
    return this._handler as T
  }

  setContextMetadata({ target, propertyKey, descriptor }: IExecutionContextMetadata): void {
    this._contextTarget = target
    this._contextPropertyKey = propertyKey
    this._contextDescriptor = descriptor
  }

  get target() {
    return this._contextTarget
  }

  get contextName(): string {
    return get(this._contextTarget, 'name') || get(this._contextTarget, 'constructor.name')
  }

  get propertyKey() {
    return this._contextPropertyKey
  }

  get descriptor() {
    return this._contextDescriptor
  }

  getContextMetadata() {
    return {
      target: this.target,
      propertyKey: this.propertyKey,
      descriptor: this.descriptor
    }
  }

  call<T>(): T {
    const handler = this.getHandler()
    const args = this.getArguments()

    if (this._terminated || !handler) return
    return handler(...args)
  }

  terminate() {
    delete this._handler
    delete this._mutatedArguments
    this._terminated = true
    Logger.log(`${this.target?.constructor?.name || this.target?.['name']} terminated`)
  }
}
