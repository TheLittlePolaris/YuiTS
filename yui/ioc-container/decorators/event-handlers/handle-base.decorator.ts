import { ClientEvents } from "discord.js";

import { COMMAND_HANDLER } from "@/ioc-container/constants/dependencies-injection.constant";
import { DiscordEvent } from "@/ioc-container/constants/discord-events";
import { ICommandHandlerMetadata, Prototype } from "@/ioc-container/interfaces";

export function EventHandler() {
  return (
    target: Prototype,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || [];
    commands = [...commands, { propertyKey, command: "default" }];
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor);

    const originalHandler = descriptor.value as Function;
    descriptor.value = function (eventArgs: ClientEvents[DiscordEvent]) {
      return originalHandler.apply(this, eventArgs);
    };
  };
}
