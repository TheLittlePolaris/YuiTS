import { DMInterceptor } from '@/event-handlers/event-interceptors/dm.interceptor'
import { OnEvent, UseInterceptor } from '@/ioc-container/decorators'
import {
  Args,
  HandleCommand,
  MessageParam,
} from '@/ioc-container/decorators/event-handlers/message-handle.decorator'
import { OwnerChannelService } from '@/services/owner-service/channel.service'
import { Message } from 'discord.js'

@OnEvent('messageCreate', { ignoreBots: true, startsWithPrefix: true })
@UseInterceptor(DMInterceptor)
export class DMEventHandler {
  constructor(private ownerChannelService: OwnerChannelService) {}

  @HandleCommand('statistics', 'stat')
  async statistics(@MessageParam() message: Message, @Args() args: string[]): Promise<void> {
    return this.ownerChannelService.statistics(message, args)
  }
}
