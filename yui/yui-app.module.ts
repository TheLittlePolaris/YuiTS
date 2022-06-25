import { YuiModule, InjectToken } from '@/ioc-container'
import { ClientOptions, Intents } from 'discord.js'
import { ConfigModule } from './config-service/config.module'
import { HandlerModule } from './event-handlers/handler.module'

@YuiModule({
  modules: [ConfigModule, HandlerModule],
  providers: [
    {
      provide: InjectToken.CLIENT_OPTIONS,
      useValue: <ClientOptions>{
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_VOICE_STATES,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          Intents.FLAGS.DIRECT_MESSAGES
        ],
        partials: ['MESSAGE', 'CHANNEL', 'REACTION']
      }
    }
  ]
})
export class AppModule {}
