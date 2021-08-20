import { ConfigService } from '@/config-service/config.service'
import { YuiLogger } from '@/services/logger/logger.service'
import { DiscordClient, EventHandler, OnEvent, OnComponentInit } from '@/ioc-container'

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
