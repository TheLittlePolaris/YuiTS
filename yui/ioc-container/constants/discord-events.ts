import { ClientEvents } from 'discord.js';

export type DiscordEvent = keyof ClientEvents;

export interface DiscordEventConfig {
  messageCreate: {
    ignoreBots: boolean;
    startsWithPrefix: boolean;
  };
  [allOthers: string]: Record<string, any>;
}
