import { ClientEvents } from "discord.js";

export type DiscordEvent = keyof ClientEvents

export interface DiscordEventConfig {
  message: {
    ignoreBots: boolean,
    startsWithPrefix: boolean
  }
  [allOthers: string]: {}
}