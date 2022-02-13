import { ConfigService } from '@/config-service/config.service'
import { createMethodDecorator, DiscordClient, Prototype } from '@/ioc-container'

export const TestDecorator = createMethodDecorator(
  (
    [target, propertyKey, descriptor]: [Prototype, string, TypedPropertyDescriptor<Function>],
    originalArguments: any[],
    [config, discordClient]: [ConfigService, DiscordClient]
  ) => {
    console.log({target, propertyKey, descriptor}, '<========= {target, propertyKey, descriptor} [yui\custom\decorators\test.decorator.ts:10]')
      console.log(config, '<========= config [yui\custom\decorators\test.decorator.ts:11]')
      console.log(discordClient, '<========= discordClient [yui\custom\decorators\test.decorator.ts:12]')
      console.log(originalArguments, '<========= originalArguments [yui\custom\decorators\test.decorator.ts:13]')
      
      return [descriptor.value, originalArguments]
  }
)
