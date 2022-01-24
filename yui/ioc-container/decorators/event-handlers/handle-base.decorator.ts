import { ConfigService } from '@/config-service/config.service'
import { DiscordEvent } from '@/constants/discord-events'
import { COMMAND_HANDLER } from '@/ioc-container/constants/dependencies-injection.constant'
import { ICommandHandlerMetadata, Prototype } from '@/ioc-container/interfaces'
import { ClientEvents } from 'discord.js'

export function EventHandler() {
  return (target: Prototype, propertyKey: string, descriptor: PropertyDescriptor) => {
    let commands: ICommandHandlerMetadata[] =
      Reflect.getMetadata(COMMAND_HANDLER, target.constructor) || []
    commands = [...commands, { propertyKey, command: 'default' }]
    Reflect.defineMetadata(COMMAND_HANDLER, commands, target.constructor)

    const originalHandler = descriptor.value as Function
    descriptor.value = function (eventArgs: ClientEvents[DiscordEvent], config: ConfigService) {
      return originalHandler.apply(this, eventArgs)
    }
  }
}
