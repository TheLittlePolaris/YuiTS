import { DiscordEvent, DiscordEventConfig } from '@/constants/discord-events'
import { ClientEvents } from 'discord.js'

export type HandleFunction = {
  [command: string]: (originalArgument: ClientEvents[DiscordEvent]) => Promise<any>
}

export type DiscordEventHandlers = {
  [key in DiscordEvent]?: { handleFunction: HandleFunction; config?: DiscordEventConfig[key] }
}
