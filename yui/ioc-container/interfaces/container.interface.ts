/* eslint-disable @typescript-eslint/no-namespace */
import { DiscordEvent, DiscordEventConfig } from '@/ioc-container/constants/discord-events'
import { Observable } from 'rxjs'
import { EventExecutionContext } from '../event-execution-context/event-execution-context'

export type BaseResult = Promise<any> | Observable<any>

export type PromiseHandlerFn = (context: EventExecutionContext) => Promise<any>
export type PromiseCommandHandler = {
  [command: string]: PromiseHandlerFn
}

export type RxjsHandlerFn = (context: EventExecutionContext) => Observable<any>
export type RxjsCommandHandler = {
  [command: string]: RxjsHandlerFn
}

export type BaseHandlerFn = PromiseHandlerFn | RxjsHandlerFn
export type BaseCommandHandler<T extends BaseHandlerFn> = {
  [command: string]: T
}

export type BaseSingleEventHandler = PromiseCommandHandler | RxjsCommandHandler
export type BaseEventsHandlers<U extends BaseHandlerFn, T extends BaseCommandHandler<U>> = {
  [key in DiscordEvent]?: {
    handlers: T
    config?: DiscordEventConfig[key]
  }
}

export type PromiseEventsHandlers = BaseEventsHandlers<PromiseHandlerFn, PromiseCommandHandler>

export type RxjsEventsHandlers = BaseEventsHandlers<RxjsHandlerFn, RxjsCommandHandler>
