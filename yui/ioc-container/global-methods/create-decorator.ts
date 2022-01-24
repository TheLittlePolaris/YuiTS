import { ConfigService } from '@/config-service/config.service'
import { DiscordClient } from '../entrypoint'
import { Prototype } from '../interfaces'

export function createMethodDecorator(
  method: (...args: any[]) => any
) {
  return (config: ConfigService, discordClient: DiscordClient) =>
    (target: Prototype, propertyKey: string, descriptor: PropertyDecorator) => {}
}
