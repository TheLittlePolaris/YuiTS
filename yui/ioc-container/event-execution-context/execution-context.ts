import { clone, get, isArray } from 'lodash';

import { DiscordClient } from '../entrypoint';
import { FunctionType, Prototype, Type } from '../interfaces';
import { Logger } from '../logger';

import { IExecutionContextMetadata } from './execution-context.interface';

export class ExecutionContext {
  static client: DiscordClient;
  static config;

  private _handler: FunctionType;

  private readonly _arguments: any[];
  private _mutatedArguments: any[];

  private _ctxTarget: Prototype | Type<any>;

  private _ctxPropertyKey: string;
  private _ctxDescriptor: TypedPropertyDescriptor<(...args: any[]) => any>;

  private _terminated = false;

  private readonly _executionStartTimestamp: number;

  constructor(
    inputArguments: any[],
    contextMetadata?: IExecutionContextMetadata,
    contextHandler?: FunctionType
  ) {
    this._arguments = !isArray(inputArguments) ? clone([inputArguments]) : clone(inputArguments);

    this.setArguments(this._arguments);

    if (contextMetadata) this.setContextMetadata(contextMetadata);

    if (contextHandler) this.setHandler(contextHandler);

    this._executionStartTimestamp = Date.now();
  }

  get executionStartTimestamp() {
    return this._executionStartTimestamp;
  }

  get terminated() {
    return this._terminated;
  }

  get client() {
    return ExecutionContext.client;
  }

  get config() {
    return ExecutionContext.config;
  }

  getArguments<T extends any[]>(): T {
    return this._mutatedArguments as T;
  }

  getOriginalArguments<T extends any[]>(): T {
    return this._arguments as T;
  }

  setArguments(arguments_: any[]): void {
    this._mutatedArguments = clone(arguments_);
  }

  setHandler(handler: FunctionType): void {
    this._handler = handler;
  }

  getHandler<T extends (...arguments_: any[]) => any = (...arguments_: any[]) => any>(): T {
    return this._handler as T;
  }

  setContextMetadata({ target, propertyKey, descriptor }: IExecutionContextMetadata): void {
    this._ctxTarget = target;
    this._ctxPropertyKey = propertyKey;
    this._ctxDescriptor = descriptor;
  }

  get target() {
    return this._ctxTarget;
  }

  get contextName(): string {
    return get(this._ctxTarget, 'name') || get(this._ctxTarget, 'constructor.name');
  }

  get propertyKey() {
    return this._ctxPropertyKey;
  }

  get descriptor() {
    return this._ctxDescriptor;
  }

  getContextMetadata() {
    return {
      target: this.target,
      propertyKey: this.propertyKey,
      descriptor: this.descriptor
    };
  }

  async call<T>(): Promise<T> {
    const handler = this.getHandler();
    const compiledArguments = this.getArguments<[]>();

    if (this._terminated || !handler) return;

    try {
      return await handler(...compiledArguments);
    } catch (error) {
      Logger.error(error?.stack || error);
      return null;
    }
  }

  terminate() {
    delete this._handler;
    delete this._mutatedArguments;
    this._terminated = true;
    Logger.log(`${this.contextName}.${this._ctxPropertyKey} terminated`);
  }
}
