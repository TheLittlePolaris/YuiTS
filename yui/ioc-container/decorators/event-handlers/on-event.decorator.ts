import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { EVENT_HANDLER, EVENT_HANDLER_CONFIG } from '@/ioc-container/constants'
import { Type } from '@/ioc-container/interfaces'

export function OnEvent(event: DiscordEvent, config?: DiscordEventConfig[DiscordEvent]) {
  return (target: Type<any>) => {
    Reflect.defineMetadata(EVENT_HANDLER, event, target)
    if(config) Reflect.defineMetadata(EVENT_HANDLER_CONFIG, config, target)
  }
}
