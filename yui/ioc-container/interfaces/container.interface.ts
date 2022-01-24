import { DiscordEvent } from "@/constants/discord-events";
import { ClientEvents } from "discord.js";

export type HandleFunction = {
  [command: string]: (originalArgument: ClientEvents[DiscordEvent]) => Promise<any>
}