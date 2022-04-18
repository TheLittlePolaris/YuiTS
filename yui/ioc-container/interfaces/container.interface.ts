/* eslint-disable @typescript-eslint/no-namespace */
import { DiscordEvent, DiscordEventConfig } from '@/ioc-container/constants/discord-events'
import { ClientEvents } from 'discord.js'
import { Observable } from 'rxjs'

export type PromiseHandlerFn = (originalArgument: ClientEvents[DiscordEvent]) => Promise<any>
export type PromiseCommandHandler = {
  [command: string]: PromiseHandlerFn
}

export type RxjsHandlerFn = (originalArgument: ClientEvents[DiscordEvent]) => Observable<any>
export type RxjsCommandHandler = {
  [command: string]: RxjsHandlerFn
}

export type BaseHandlerFn = PromiseHandlerFn | RxjsHandlerFn
export type BaseCommandHandler<T extends BaseHandlerFn> = {
  [command: string]: T
}

export type BaseSingleEventHandler = PromiseCommandHandler | RxjsCommandHandler
export type BaseEventsHandler<U extends BaseHandlerFn, T extends BaseCommandHandler<U>> = {
  [key in DiscordEvent]?: {
    handlers: T
    config?: DiscordEventConfig[key]
  }
}

export type PromiseEventHandlers = BaseEventsHandler<PromiseHandlerFn, PromiseCommandHandler>

export type RxjsEventHandlers = BaseEventsHandler<RxjsHandlerFn, RxjsCommandHandler>
