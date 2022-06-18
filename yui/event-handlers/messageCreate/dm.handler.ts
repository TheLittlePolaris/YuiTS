import { MsgArgs, HandleCommand, Msg, OnEvent, UseInterceptor } from '@/ioc-container'
import { DMInterceptor } from '@/event-handlers/messageCreate/dm.interceptor'
import { OwnerChannelService } from '@/services/owner-service/channel.service'
import { Message } from 'discord.js'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(DMInterceptor)
export class DMEventHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleCommand('statistics', 'stat')
  async statistics(@Msg() message: Message, @MsgArgs() args: string[]): Promise<void> {
    console.log('TLP::LOG ', message, '<==== message, <yui/event-handlers/messageCreate/dm.handler.ts:13>')
    
    return this.ownerChannelService.statistics(message, args)
  }
}
