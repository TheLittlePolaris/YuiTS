import { clone, get, isArray } from 'lodash'

import { DiscordClient } from '../entrypoint'
import { Prototype, Type } from '../interfaces'
import { IExecutionContextMetadata } from './execution-context.interface'
import { Logger } from '../logger'
import { ConfigService } from '../simple-config'

export class ExecutionContext {
  static client: DiscordClient
  static config: ConfigService

  private _handler: Function | ((...args: any[]) => any)

  private _arguments: any[]
  private _mutatedArguments: any[]

  private _ctxTarget: Prototype | Type<any>

  private _ctxPropertyKey: string
  private _ctxDescriptor: TypedPropertyDescriptor<Function>

  private _terminated = false

  private _executionStartTimestamp: number

  constructor(
    inputArguments: any[],
    ctxMetadata?: IExecutionContextMetadata,
    ctxHandler?: Function | ((...args: any[]) => any)
  ) {
    if (!isArray(inputArguments)) {
      this._arguments = clone([inputArguments])
    } else {
      this._arguments = clone(inputArguments)
    }

    this.setArguments(this._arguments)

    if (ctxMetadata) this.setContextMetadata(ctxMetadata)
    if (ctxHandler) this.setHandler(ctxHandler)

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

  getArguments<T extends any[]>(): T {
    return this._mutatedArguments as T
  }

  getOriginalArguments<T extends any[]>(): T {
    return this._arguments as T
  }

  setArguments(args: any[]): void {
    this._mutatedArguments = clone(args)
  }

  setHandler(handler: Function | ((...args: any[]) => any)): void {
    this._handler = handler
  }

  getHandler<T extends (...args: any[]) => any = (...args: any[]) => any>(): T {
    return this._handler as T
  }

  setContextMetadata({ target, propertyKey, descriptor }: IExecutionContextMetadata): void {
    this._ctxTarget = target
    this._ctxPropertyKey = propertyKey
    this._ctxDescriptor = descriptor
  }

  get target() {
    return this._ctxTarget
  }

  get contextName(): string {
    return get(this._ctxTarget, 'name') || get(this._ctxTarget, 'constructor.name')
  }

  get propertyKey() {
    return this._ctxPropertyKey
  }

  get descriptor() {
    return this._ctxDescriptor
  }

  getContextMetadata() {
    return {
      target: this.target,
      propertyKey: this.propertyKey,
      descriptor: this.descriptor
    }
  }

  async call<T>(): Promise<T> {
    const handler = this.getHandler()
    const args = this.getArguments<any[]>()

    if (this._terminated || !handler) return
    try {
      return await handler(...args)
    } catch (error) {
      Logger.error(error?.stack || error)
      return null
    }
  }

  terminate() {
    delete this._handler
    delete this._mutatedArguments
    this._terminated = true
    Logger.log(`${this.contextName}.${this._ctxPropertyKey} terminated`)
  }
}
