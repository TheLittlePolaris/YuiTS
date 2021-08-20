import { HandlerModule } from '@/event-handlers/handler.module'
import { YuiModule, INJECT_TOKEN } from '@/ioc-container'
import { RedisModule } from '@/services/redis-adapter/redis.module'
import { ConfigModule } from '@/config-service/config.module'
import { BitFieldResolvable, Intents, IntentsString } from 'discord.js'

@YuiModule({
  modules: [ConfigModule, RedisModule, HandlerModule],
  providers: [
    {
      provide: INJECT_TOKEN.BOT_INTENTS,
      useValue: <BitFieldResolvable<IntentsString, number>[]>[
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        // Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
      ],
    },
  ],
})
export class AppModule {}
