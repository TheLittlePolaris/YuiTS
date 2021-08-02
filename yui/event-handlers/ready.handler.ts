import { ConfigService } from '@/config-service/config.service'
import { YuiClient } from '@/custom-classes/yui-client'
import { EventHandler, OnEvent } from '@/ioc-container/decorators'
import { YuiLogger } from '@/services/logger/logger.service'

@OnEvent('ready')
export class ReadyHandler {
  constructor(private readonly yui: YuiClient, private readonly configService: ConfigService) {
    YuiLogger.info(`Created!`, ReadyHandler.name)
  }

  @EventHandler()
  async onReadyHandler() {
    const { user = null } = this.yui
    if (!user) throw new Error('Something went horribly wrong! Client is not defined!')
    YuiLogger.log('🔗 🛰 Connected!', ReadyHandler.name)

    user
      .setActivity(`${this.configService.prefix}help`, {
        type: 'LISTENING',
      })
      .then(() => {
        YuiLogger.log('🚀 🔶Yui is online! 🚀', ReadyHandler.name)
      })
  }
}
