import { HandleCommand, Msg, OnEvent, UseInterceptor } from 'djs-ioc-container'
import { Message } from 'discord.js'
import { DMInterceptor } from './dm.interceptor'
import { OwnerChannelService } from '@/services/statistics/statistics.service'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(DMInterceptor)
export class DMEventHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleCommand('statistics', 'stat')
  async statistics(@Msg() message: Message): Promise<void> {
    return this.ownerChannelService.statistics(message)
  }
}
