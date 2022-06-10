import { DiscordEvent, DiscordEventConfig } from '../../constants'
import { ExecutionContext } from '../../event-execution-context'

export type BaseHandler<TReturn> = (context: ExecutionContext) => TReturn
export type BaseCommands<TReturn> = {
  [command: string]: BaseHandler<TReturn>
}

export type BaseEventsHandlers<TReturn> = {
  [key in DiscordEvent]?: {
    handlers: BaseCommands<TReturn>
    config?: DiscordEventConfig[key]
  }
}

