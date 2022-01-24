import { DiscordEvent } from "@/constants/discord-events";
import { ClientEvents } from "discord.js";

export interface IBaseInterceptor {
  intercept(args: ClientEvents[DiscordEvent], next: () => any): void
}