import { ActivityType } from 'discord.js';
import { DiscordClient, EventHandler, OnEvent } from '@tlp01/djs-ioc-container';

import { ConfigService } from '@/config-service/config.service';
import { YuiLogger } from '@/logger/logger.service';

@OnEvent('ready')
export class ReadyEventHandler {
  constructor(private readonly yui: DiscordClient, private readonly configService: ConfigService) {}

  @EventHandler()
  async onReadyHandler() {
    const { user = null } = this.yui;
    if (!user) throw new Error('Something went horribly wrong! Client is not defined!');

    user.setActivity(`${this.configService.prefix}help`, {
      type: ActivityType.Listening
    });

    YuiLogger.log('🚀 🔶Yui is online! 🚀', ReadyEventHandler.name);
  }
}
