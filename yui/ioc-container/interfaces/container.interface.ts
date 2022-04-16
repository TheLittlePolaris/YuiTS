/* eslint-disable @typescript-eslint/no-namespace */
import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { ClientEvents } from 'discord.js'
import { Observable } from 'rxjs'

export type PromiseHandleFunction = (originalArgument: ClientEvents[DiscordEvent]) => Promise<any>
export type PromiseCommandHandler = {
  [command: string]: PromiseHandleFunction
}

export type RxjsHandleFunction = (originalArgument: ClientEvents[DiscordEvent]) => Observable<any>
export type RxjsCommandHandler = {
  [command: string]: RxjsHandleFunction
}



export type DiscordEventHandlers = {
  [key in DiscordEvent]?: {
    handleFunction: PromiseCommandHandler
    config?: DiscordEventConfig[key]
  }
}
export type DiscordRxjsEventHandlers = {
  [key in DiscordEvent]?: {
    handleFunction: RxjsCommandHandler
    config?: DiscordEventConfig[key]
  }
}

export type BaseSingleHandleFunction = PromiseHandleFunction | RxjsHandleFunction
export type BaseCommandHandler<T extends BaseSingleHandleFunction> = {
  [command: string]: T
}

export type BaseSingleEventHandler = PromiseCommandHandler | RxjsCommandHandler
export type BaseEventsHandler<T extends BaseSingleEventHandler> =
  {
    [key in DiscordEvent]?: {
      handleFunction: T
      config?: DiscordEventConfig[key]
    }
  }
