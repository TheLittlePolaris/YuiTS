import { YuiModule, InjectToken } from 'djs-ioc-container'
import { ClientOptions, GatewayIntentBits, Partials } from 'discord.js'
import { ConfigModule } from './config-service/config.module'
import { HandlerModule } from './event-handlers/handler.module'

@YuiModule({
  modules: [ConfigModule, HandlerModule],
  providers: [
    {
      provide: InjectToken.CLIENT_OPTIONS,
      useValue: <ClientOptions>{
        intents: [
          GatewayIntentBits.GuildBans,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.GuildEmojisAndStickers,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildWebhooks,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.DirectMessageReactions,
          GatewayIntentBits.GuildMessageReactions
        ],
        partials: [Partials.Message, Partials.Channel, Partials.Reaction]
      }
    }
  ]
})
export class AppModule {}
