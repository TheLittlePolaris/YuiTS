import { ClientEvents } from 'discord.js';

import { ICommandHandlerMetadata } from '../interfaces';

export type DiscordEvent = keyof ClientEvents;

export interface DiscordEventConfig {
  messageCreate: ICommandHandlerMetadata & {
    ignoreBots: boolean;
    startsWithPrefix: boolean;
  };
  [allOthers: string]: ICommandHandlerMetadata | Record<string, never>;
}
