import { ConfigService } from '@/config-service/config.service'
import { DiscordClient } from '..'
import { Prototype } from './dependencies-injection.interfaces'

export type CreateMethodDecoratorParameters<T = Function> = (
  [target, propertyKey, descriptor]: [Prototype, string, TypedPropertyDescriptor<T>],
  originalArguments: any[],
  [config, discordClient, originalArgumentList]?: [ConfigService, DiscordClient, any[]]
) =>
  | [/* descriptor */ Function, /* argument list */ any[]]
  | Promise<[/* descriptor */ Function, /* argument list */ any[]]>
