import { Observable } from 'rxjs'

/* eslint-disable @typescript-eslint/no-namespace */
import { DiscordEvent, DiscordEventConfig } from '@/ioc-container/constants/discord-events'

import { ExecutionContext } from '../event-execution-context/event-execution-context'

export type BaseResult = Promise<any> | Observable<any>

export type PromiseHandler = (context: ExecutionContext) => Promise<any>
export type PromiseCommands = {
  [command: string]: PromiseHandler
}

export type RxjsHandler = (context: ExecutionContext) => Observable<any>
export type RxjsCommands = {
  [command: string]: RxjsHandler
}

export type BaseHandler = PromiseHandler | RxjsHandler
export type BaseCommands<T extends BaseHandler> = {
  [command: string]: T
}

export type BaseSingleEventCommand = PromiseCommands | RxjsCommands
export type BaseEventsHandlers<T extends BaseHandler, U extends BaseCommands<T>> = {
  [key in DiscordEvent]?: {
    handlers: U
    config?: DiscordEventConfig[key]
  }
}

export type PromiseEventsHandlers = BaseEventsHandlers<PromiseHandler, PromiseCommands>

export type RxjsEventsHandlers = BaseEventsHandlers<RxjsHandler, RxjsCommands>
