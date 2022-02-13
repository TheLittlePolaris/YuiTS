import { ConfigService } from '@/config-service/config.service'
import { DiscordClient } from '..'
import { Prototype } from './dependencies-injection.interfaces'

export type CreateMethodDecoratorParam<T = Function> = (
  [target, propertyKey, descriptor]: [Prototype, string, TypedPropertyDescriptor<T>],
  originalArguments: any[],
  [config, discordClient]?: [ConfigService, DiscordClient]
) => [/* descriptor */ Function, /* argument list */ any[]];
