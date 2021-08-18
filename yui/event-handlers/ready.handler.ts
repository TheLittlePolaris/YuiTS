import { ConfigService } from '@/config-service/config.service'
import { DiscordClient } from '@/ioc-container/entrypoint/discord-client'
import { EventHandler, OnEvent } from '@/ioc-container/decorators'
import { YuiLogger } from '@/services/logger/logger.service'
import { OnComponentInit } from '@/ioc-container/interfaces'

@OnEvent('ready')
export class ReadyHandler implements OnComponentInit {
  constructor(private readonly yui: DiscordClient, private readonly configService: ConfigService) {}


  onComponentInit() {
  }

  @EventHandler()
  async onReadyHandler() {
    const { user = null } = this.yui
    if (!user) throw new Error('Something went horribly wrong! Client is not defined!')

    user.setActivity(`${this.configService.prefix}help`, {
      type: 'LISTENING',
    })

    YuiLogger.log('🚀 🔶Yui is online! 🚀', ReadyHandler.name)
  }
}
