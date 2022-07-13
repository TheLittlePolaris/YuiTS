import { MsgArgs, HandleCommand, Msg, OnEvent, UseInterceptor } from 'djs-ioc-container'
import { DMInterceptor } from '@/event-handlers/messageCreate/dm.interceptor'
import { OwnerChannelService } from '@/services/owner-service/channel.service'
import { Message } from 'discord.js'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(DMInterceptor)
export class DMEventHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleCommand('statistics', 'stat')
  async statistics(@Msg() message: Message, @MsgArgs() args: string[]): Promise<void> {
    return this.ownerChannelService.statistics(message, args)
  }
}
